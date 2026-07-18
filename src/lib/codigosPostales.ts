import {
  FM_CONFIG,
  buscarRegistrosLayout,
  leerNombresCamposLayout,
  paginarRegistrosLayout,
} from "@/lib/filemaker";
import { textoCampo } from "@/lib/textoCampo";

export type LocalidadEspana = {
  codigoPostal: string;
  poblacion: string;
  provincia: string;
};

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";
const usarDatosMock = () => USE_MOCK || !FM_CONFIG.host?.trim();

const LOCALIDADES_MOCK: LocalidadEspana[] = [
  { codigoPostal: "46013", poblacion: "Valencia", provincia: "Valencia" },
  { codigoPostal: "46006", poblacion: "Valencia", provincia: "Valencia" },
  { codigoPostal: "46001", poblacion: "Valencia", provincia: "Valencia" },
  { codigoPostal: "46380", poblacion: "Cheste", provincia: "Valencia" },
  { codigoPostal: "28013", poblacion: "Madrid", provincia: "Madrid" },
  { codigoPostal: "08001", poblacion: "Barcelona", provincia: "Barcelona" },
];

type CamposCodigosPostalesLayout = {
  codPostal: string;
  poblacion: string;
  provincia: string;
};

const ALIAS_CP = ["CodigoPostal", "CodPostal", "CP"];
const ALIAS_POBLACION = ["Poblacion", "Municipio", "Localidad"];
const ALIAS_PROVINCIA = ["Provincia", "ProvinciaNombre"];

let camposLayoutCache: CamposCodigosPostalesLayout | null = null;
let provinciasCache: string[] | null = null;

export function normalizarCp(value: unknown) {
  return textoCampo(value).replace(/\D/g, "").slice(0, 5);
}

function claveLocalidad(localidad: LocalidadEspana) {
  return `${localidad.codigoPostal}|${localidad.poblacion}|${localidad.provincia}`.toLowerCase();
}

function deduplicarLocalidades(localidades: LocalidadEspana[]) {
  const seen = new Set<string>();
  const resultado: LocalidadEspana[] = [];

  for (const localidad of localidades) {
    const key = claveLocalidad(localidad);
    if (seen.has(key)) continue;
    seen.add(key);
    resultado.push(localidad);
  }

  return resultado;
}

function deduplicarTextos(values: string[]) {
  return [...new Set(values.map((value) => textoCampo(value)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

function leerCampo(fieldData: Record<string, unknown>, principal: string, aliases: string[]) {
  for (const key of [principal, ...aliases]) {
    const value = textoCampo(fieldData[key]);
    if (value) return value;
  }
  return "";
}

function nombresCp(campos: CamposCodigosPostalesLayout) {
  return [...new Set([campos.codPostal, FM_CONFIG.cpCampoCodPostal, ...ALIAS_CP])];
}

function cpCoincide(fieldData: Record<string, unknown>, cp: string, campos: CamposCodigosPostalesLayout) {
  return nombresCp(campos).some((nombre) => normalizarCp(fieldData[nombre]) === cp);
}

async function resolverCamposCodigosPostalesLayout(): Promise<CamposCodigosPostalesLayout> {
  if (camposLayoutCache) return camposLayoutCache;

  const disponibles = await leerNombresCamposLayout(FM_CONFIG.layoutCodigosPostales);
  const elegir = (candidatos: string[], fallback: string) =>
    candidatos.find((nombre) => disponibles.has(nombre)) ?? fallback;

  camposLayoutCache = {
    codPostal: elegir(
      [FM_CONFIG.cpCampoCodPostal, ...ALIAS_CP],
      FM_CONFIG.cpCampoCodPostal
    ),
    poblacion: elegir(
      [FM_CONFIG.cpCampoPoblacion, ...ALIAS_POBLACION],
      FM_CONFIG.cpCampoPoblacion
    ),
    provincia: elegir(
      [FM_CONFIG.cpCampoProvincia, ...ALIAS_PROVINCIA],
      FM_CONFIG.cpCampoProvincia
    ),
  };

  return camposLayoutCache;
}

function mapearLocalidad(
  fieldData: Record<string, unknown>,
  campos: CamposCodigosPostalesLayout
): LocalidadEspana | null {
  const codigoPostal = normalizarCp(
    leerCampo(fieldData, campos.codPostal, ALIAS_CP)
  );
  const poblacion = leerCampo(fieldData, campos.poblacion, ALIAS_POBLACION);
  const provincia = leerCampo(fieldData, campos.provincia, ALIAS_PROVINCIA);

  if (!codigoPostal && !poblacion && !provincia) return null;

  return { codigoPostal, poblacion, provincia };
}

async function registrosALocalidades(records: { fieldData: Record<string, unknown> }[]) {
  const campos = await resolverCamposCodigosPostalesLayout();
  return deduplicarLocalidades(
    records
      .map((record) => mapearLocalidad(record.fieldData, campos))
      .filter((item): item is LocalidadEspana => Boolean(item))
  );
}

async function buscarEnLayoutOr(queries: Record<string, string>[], limit = "200") {
  if (!queries.length) return [];

  const data = await buscarRegistrosLayout(
    FM_CONFIG.layoutCodigosPostales,
    { query: queries, limit },
    true
  );
  return (data?.response?.data ?? []) as { fieldData: Record<string, unknown> }[];
}

function queriesBusquedaCp(cp: string, campos: CamposCodigosPostalesLayout) {
  const queries: Record<string, string>[] = [];

  for (const nombre of nombresCp(campos)) {
    queries.push({ [nombre]: cp });
    queries.push({ [nombre]: `==${cp}` });
  }

  return queries;
}

async function buscarCpPaginando(cp: string, campos: CamposCodigosPostalesLayout) {
  let offset = 1;
  const limit = 1000;
  const maxPaginas = 50;

  for (let pagina = 0; pagina < maxPaginas; pagina++) {
    const records = await paginarRegistrosLayout(FM_CONFIG.layoutCodigosPostales, limit, offset);
    if (!records.length) break;

    const coincidencias = records.filter((record) => cpCoincide(record.fieldData, cp, campos));
    if (coincidencias.length) return coincidencias;

    if (records.length < limit) break;
    offset += limit;
  }

  return [];
}

async function buscarRegistrosPorCp(cp: string, campos: CamposCodigosPostalesLayout) {
  const porFind = await buscarEnLayoutOr(queriesBusquedaCp(cp, campos), "100");
  if (porFind.length) return porFind;

  return buscarCpPaginando(cp, campos);
}

export async function buscarLocalidadesPorCodigoPostal(codigoPostal: string): Promise<LocalidadEspana[]> {
  const cp = normalizarCp(codigoPostal);
  if (cp.length !== 5) return [];

  if (usarDatosMock()) {
    return deduplicarLocalidades(LOCALIDADES_MOCK.filter((item) => item.codigoPostal === cp));
  }

  const campos = await resolverCamposCodigosPostalesLayout();
  const records = await buscarRegistrosPorCp(cp, campos);
  const localidades = await registrosALocalidades(records);

  return localidades.filter(
    (localidad) => !localidad.codigoPostal || normalizarCp(localidad.codigoPostal) === cp
  );
}

async function buscarEnLayout(query: Record<string, string>, limit = "200") {
  return buscarEnLayoutOr([query], limit);
}

async function listarRegistrosPorProvincia(provincia: string, campos: CamposCodigosPostalesLayout) {
  const provinciaNorm = textoCampo(provincia);
  const porFind = await buscarEnLayoutOr(
    [
      { [campos.provincia]: provinciaNorm },
      { [campos.provincia]: `==${provinciaNorm}` },
    ],
    "500"
  );
  if (porFind.length) return porFind;

  let offset = 1;
  const limit = 1000;
  const maxPaginas = 50;

  for (let pagina = 0; pagina < maxPaginas; pagina++) {
    const records = await paginarRegistrosLayout(FM_CONFIG.layoutCodigosPostales, limit, offset);
    if (!records.length) break;

    const coincidencias = records.filter(
      (record) =>
        leerCampo(record.fieldData, campos.provincia, ALIAS_PROVINCIA).toLowerCase() ===
        provinciaNorm.toLowerCase()
    );
    if (coincidencias.length) return coincidencias;

    if (records.length < limit) break;
    offset += limit;
  }

  return [];
}

export async function listarProvinciasCodigosPostales(): Promise<string[]> {
  if (provinciasCache) return provinciasCache;

  if (usarDatosMock()) {
    provinciasCache = deduplicarTextos(LOCALIDADES_MOCK.map((item) => item.provincia));
    return provinciasCache;
  }

  const campos = await resolverCamposCodigosPostalesLayout();
  const provincias = new Set<string>();
  let offset = 1;
  const limit = 1000;

  while (true) {
    const records = await paginarRegistrosLayout(FM_CONFIG.layoutCodigosPostales, limit, offset);
    if (!records.length) break;

    records.forEach((record) => {
      const provincia = leerCampo(record.fieldData, campos.provincia, ALIAS_PROVINCIA);
      if (provincia) provincias.add(provincia);
    });

    if (records.length < limit) break;
    offset += limit;
  }

  provinciasCache = deduplicarTextos([...provincias]);
  return provinciasCache;
}

export async function listarPoblacionesCodigosPostales(
  provincia: string,
  filtro = ""
): Promise<string[]> {
  const provinciaNorm = textoCampo(provincia);
  if (!provinciaNorm) return [];

  if (usarDatosMock()) {
    const q = filtro.trim().toLowerCase();
    return deduplicarTextos(
      LOCALIDADES_MOCK.filter(
        (item) =>
          item.provincia.toLowerCase() === provinciaNorm.toLowerCase() &&
          (!q || item.poblacion.toLowerCase().includes(q))
      ).map((item) => item.poblacion)
    );
  }

  const campos = await resolverCamposCodigosPostalesLayout();
  const records = await listarRegistrosPorProvincia(provinciaNorm, campos);
  const localidades = await registrosALocalidades(records);
  const q = filtro.trim().toLowerCase();

  return deduplicarTextos(
    localidades
      .filter(
        (item) =>
          item.provincia.toLowerCase() === provinciaNorm.toLowerCase() &&
          (!q || item.poblacion.toLowerCase().includes(q))
      )
      .map((item) => item.poblacion)
  );
}

export async function listarCodigosPostalesLocalidad(
  provincia: string,
  poblacion: string
): Promise<string[]> {
  const provinciaNorm = textoCampo(provincia);
  const poblacionNorm = textoCampo(poblacion);
  if (!provinciaNorm || !poblacionNorm) return [];

  if (usarDatosMock()) {
    return deduplicarTextos(
      LOCALIDADES_MOCK.filter(
        (item) =>
          item.provincia.toLowerCase() === provinciaNorm.toLowerCase() &&
          item.poblacion.toLowerCase() === poblacionNorm.toLowerCase()
      ).map((item) => item.codigoPostal)
    );
  }

  const campos = await resolverCamposCodigosPostalesLayout();
  const records = (await listarRegistrosPorProvincia(provinciaNorm, campos)).filter(
    (record) =>
      leerCampo(record.fieldData, campos.poblacion, ALIAS_POBLACION).toLowerCase() ===
      poblacionNorm.toLowerCase()
  );
  const localidades = await registrosALocalidades(records);
  return deduplicarTextos(localidades.map((item) => item.codigoPostal));
}

export function resolverLocalidadUnica(localidades: LocalidadEspana[]): LocalidadEspana | null {
  if (localidades.length !== 1) return null;
  return localidades[0];
}
