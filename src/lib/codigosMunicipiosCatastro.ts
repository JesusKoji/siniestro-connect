import {
  FM_CONFIG,
  buscarRegistrosLayout,
  leerNombresCamposLayout,
  paginarRegistrosLayout,
} from "@/lib/filemaker";
import { textoCampo } from "@/lib/textoCampo";

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";
/** Solo mock explícito; host vacío usa el proxy /fmi de Vite igual que el resto de la app. */
const usarDatosMock = () => USE_MOCK;
const TIMEOUT_BUSQUEDA_MS = 12000;

export const CAMPO_MUNICIPIO_CATASTRO = FM_CONFIG.cmCatastroCampoMunicipio;
export const CAMPO_CODIGO_CATASTRO = FM_CONFIG.cmCatastroCampoCodigo;

const ALIAS_MUNICIPIO = ["Municipio", "municipio", "NombreMunicipio", "Poblacion", "Nombre"];
const ALIAS_CODIGO = ["Codigo", "codigo", "CodigoMunicipio", "CodigoCatastro", "Cod_Municipio"];

/** Solo cuando VITE_USE_MOCK=true */
const FALLBACK_CODIGOS_MUNICIPIO: Record<string, string> = {
  valencia: "46900",
  cheste: "46054",
  mislata: "46171",
  madrid: "28079",
  barcelona: "08019",
};

type CamposMunicipiosLayout = {
  municipio: string;
  codigo: string;
};

let camposLayoutCache: CamposMunicipiosLayout | null = null;
const codigoPorPoblacionCache = new Map<string, string>();

function normalizarNombreMunicipio(value: unknown) {
  return textoCampo(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

/** Igualdad estricta: POLIZAS::PoblacionC = CodigosMunicipios::Municipio */
export function municipioIgualPoblacionC(municipio: unknown, poblacionC: string) {
  return normalizarNombreMunicipio(municipio) === normalizarNombreMunicipio(poblacionC);
}

function variantesBusquedaExacta(poblacionC: string) {
  const original = textoCampo(poblacionC);
  const titulo = original
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
    .join(" ");

  return [...new Set([original, titulo, original.toUpperCase(), original.toLowerCase()].filter(Boolean))];
}

function inferirCamposDesdeRegistro(fieldData: Record<string, unknown>): Partial<CamposMunicipiosLayout> {
  let municipio = "";
  let codigo = "";

  for (const [key, value] of Object.entries(fieldData)) {
    const texto = textoCampo(value);
    if (!texto) continue;

    if (!municipio && /municipio|poblacion|localidad/i.test(key) && !/codigo/i.test(key)) {
      municipio = key;
    }
    if (!codigo && /codigo/i.test(key) && /^\d{4,5}$/.test(texto.replace(/\D/g, ""))) {
      codigo = key;
    }
  }

  return { municipio: municipio || undefined, codigo: codigo || undefined };
}

async function resolverCamposMunicipiosLayout(): Promise<CamposMunicipiosLayout> {
  if (camposLayoutCache) return camposLayoutCache;

  const disponibles = await leerNombresCamposLayout(FM_CONFIG.layoutCodigosMunicipiosCatastro);
  const elegir = (candidatos: string[], fallback: string) =>
    candidatos.find((nombre) => disponibles.has(nombre)) ?? fallback;

  let municipio = elegir(
    [FM_CONFIG.cmCatastroCampoMunicipio, ...ALIAS_MUNICIPIO],
    FM_CONFIG.cmCatastroCampoMunicipio
  );
  let codigo = elegir(
    [FM_CONFIG.cmCatastroCampoCodigo, ...ALIAS_CODIGO],
    FM_CONFIG.cmCatastroCampoCodigo
  );

  if (disponibles.size === 0) {
    try {
      const muestra = await paginarRegistrosLayout(FM_CONFIG.layoutCodigosMunicipiosCatastro, 1, 1);
      const inferidos = inferirCamposDesdeRegistro(muestra[0]?.fieldData ?? {});
      if (inferidos.municipio) municipio = inferidos.municipio;
      if (inferidos.codigo) codigo = inferidos.codigo;
    } catch {
      // layout sin registros o sin acceso
    }
  }

  camposLayoutCache = { municipio, codigo };
  return camposLayoutCache;
}

function leerCodigoRegistro(fieldData: Record<string, unknown>, campos: CamposMunicipiosLayout) {
  for (const key of [campos.codigo, ...ALIAS_CODIGO]) {
    const codigo = textoCampo(fieldData[key]).replace(/\D/g, "");
    if (codigo.length >= 4) return codigo;
  }

  for (const value of Object.values(fieldData)) {
    const codigo = textoCampo(value).replace(/\D/g, "");
    if (/^\d{5}$/.test(codigo)) return codigo;
  }

  return "";
}

function leerMunicipioRegistro(fieldData: Record<string, unknown>, campos: CamposMunicipiosLayout) {
  for (const key of [campos.municipio, ...ALIAS_MUNICIPIO]) {
    const municipio = textoCampo(fieldData[key]);
    if (municipio && !/^\d+$/.test(municipio)) return municipio;
  }

  for (const [key, value] of Object.entries(fieldData)) {
    if (/municipio|poblacion/i.test(key) && !/codigo/i.test(key)) {
      const municipio = textoCampo(value);
      if (municipio && !/^\d+$/.test(municipio)) return municipio;
    }
  }

  return "";
}

function codigoDesdeRegistros(
  records: { fieldData: Record<string, unknown> }[],
  poblacion: string,
  campos: CamposMunicipiosLayout
) {
  for (const record of records) {
    const municipioRegistro = leerMunicipioRegistro(record.fieldData, campos);
    if (!municipioIgualPoblacionC(municipioRegistro, poblacion)) continue;

    const codigo = leerCodigoRegistro(record.fieldData, campos);
    if (codigo) return codigo;
  }

  return undefined;
}

async function buscarCodigoConFind(poblacion: string, campos: CamposMunicipiosLayout) {
  const queries: Record<string, string>[] = [];

  for (const variante of variantesBusquedaExacta(poblacion)) {
    queries.push({ [campos.municipio]: `==${variante}` });
    queries.push({ [campos.municipio]: variante });
    queries.push({ [campos.municipio]: `*${variante}*` });
  }

  const data = await buscarRegistrosLayout(
    FM_CONFIG.layoutCodigosMunicipiosCatastro,
    { query: queries, limit: "50" },
    true
  );
  const records = (data?.response?.data ?? []) as { fieldData: Record<string, unknown> }[];

  return codigoDesdeRegistros(records, poblacion, campos);
}

async function buscarCodigoPaginando(poblacion: string, campos: CamposMunicipiosLayout) {
  const limit = 500;
  const maxPaginas = 30;

  for (let pagina = 0; pagina < maxPaginas; pagina++) {
    const offset = 1 + pagina * limit;
    const records = await paginarRegistrosLayout(
      FM_CONFIG.layoutCodigosMunicipiosCatastro,
      limit,
      offset
    );
    if (!records.length) break;

    const codigo = codigoDesdeRegistros(records, poblacion, campos);
    if (codigo) return codigo;

    if (records.length < limit) break;
  }

  return undefined;
}

async function buscarCodigoEnLayout(poblacionC: string): Promise<string | undefined> {
  const poblacion = textoCampo(poblacionC);
  if (!poblacion) return undefined;

  const campos = await resolverCamposMunicipiosLayout();

  const porFind = await buscarCodigoConFind(poblacion, campos).catch(() => undefined);
  if (porFind) return porFind;

  return buscarCodigoPaginando(poblacion, campos).catch(() => undefined);
}

function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promesa,
    new Promise<undefined>((resolve) => {
      setTimeout(() => resolve(undefined), ms);
    }),
  ]);
}

export function limpiarCacheCodigosMunicipioCatastro() {
  codigoPorPoblacionCache.clear();
  camposLayoutCache = null;
}

export async function resolverCodigoMunicipioCatastro(poblacionC?: string): Promise<string | undefined> {
  const poblacion = textoCampo(poblacionC);
  const poblacionNorm = normalizarNombreMunicipio(poblacion);
  if (!poblacionNorm) return undefined;

  const enCache = codigoPorPoblacionCache.get(poblacionNorm);
  if (enCache) return enCache;

  if (usarDatosMock()) {
    const codigo = FALLBACK_CODIGOS_MUNICIPIO[poblacionNorm];
    if (codigo) codigoPorPoblacionCache.set(poblacionNorm, codigo);
    return codigo;
  }

  try {
    const codigo = await conTimeout(buscarCodigoEnLayout(poblacion), TIMEOUT_BUSQUEDA_MS);
    if (codigo) codigoPorPoblacionCache.set(poblacionNorm, codigo);
    return codigo;
  } catch {
    return undefined;
  }
}

export function codigoMunicipioCatastroInmediato(poblacionC?: string) {
  const poblacionNorm = normalizarNombreMunicipio(poblacionC);
  if (!poblacionNorm) return undefined;

  const enCache = codigoPorPoblacionCache.get(poblacionNorm);
  if (enCache) return enCache;

  if (usarDatosMock()) {
    return FALLBACK_CODIGOS_MUNICIPIO[poblacionNorm];
  }

  return undefined;
}

/** Igual que FileMaker WebCatastro: Left(Codigo; 2) y Right(Codigo; 3). */
export function partesCodigoMunicipioCatastro(codigo?: string) {
  const c = textoCampo(codigo).replace(/\D/g, "");
  if (!c) return { del: "", mun: "" };

  return {
    del: c.length >= 2 ? c.slice(0, 2) : c,
    mun: c.length >= 3 ? c.slice(-3) : "",
  };
}
