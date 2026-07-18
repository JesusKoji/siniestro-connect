import { Poliza } from "@/data/siniestros";
import { textoCampo } from "@/lib/textoCampo";

export const TIPOS_VIA_CATASTRO: Record<string, string> = {
  AC: "Acceso",
  AG: "Agregado",
  AL: "Aldea",
  AN: "Andador",
  AR: "Area",
  AU: "Autopista",
  AV: "Avenida",
  AY: "Arroyo",
  BJ: "Bajada",
  BL: "Bloque",
  BO: "Barrio",
  BQ: "Barranquil",
  BR: "Barranco",
  CA: "Cañada",
  CG: "Colegio",
  CH: "Chalet",
  CI: "Cinturon",
  CJ: "Calleja",
  CL: "Calle",
  CM: "Camino",
  CN: "Colonia",
  CO: "Concejo",
  CP: "Campo",
  CR: "Carretera",
  CS: "Caserio",
  CT: "Cuesta",
  CU: "Conjunto",
  CY: "Caleya",
  CZ: "Callizo",
  DE: "Detrás",
  DP: "Diputacion",
  DS: "Diseminados",
  ED: "Edificios",
  EM: "Extramuros",
  EN: "Entrada",
  EP: "Espalda",
  ER: "Extrarradio",
  ES: "Escalinata",
  EX: "Explanada",
  FC: "Ferrocarril",
  FN: "Finca",
  GL: "Glorieta",
  GR: "Grupo",
  GV: "Gran Via",
  HT: "Huerta",
  JR: "Jardines",
  LA: "Lago",
  LD: "Lado",
  LG: "Lugar",
  MA: "Malecon",
  MC: "Mercado",
  ML: "Muelle",
  MN: "Municipio",
  MS: "Masias",
  MT: "Monte",
  MZ: "Manzana",
  PB: "Poblado",
  PC: "Placeta",
  PD: "Partida",
  PI: "Particular",
  PJ: "Pasaje",
  PL: "Poligono",
  PM: "Paramo",
  PQ: "Parque",
  PR: "Prolongacion",
  PS: "Paseo",
  PT: "Puente",
  PU: "Pasadizo",
  PZ: "Plaza",
  QT: "Quinta",
  RA: "Raconada",
  RB: "Rambla",
  RC: "Rincon",
  RD: "Ronda",
  RM: "Ramal",
  RP: "Rampa",
  RR: "Riera",
  RU: "Rua",
  SA: "Salida",
  SC: "Sector",
  SD: "Senda",
  SL: "Solar",
  SN: "Salon",
  SU: "Subida",
  TN: "Terrenos",
  TO: "Torrente",
  TR: "Travesia",
  UR: "Urbanizacion",
  VA: "Valle",
  VD: "Viaducto",
  VI: "Via",
  VL: "Vial",
  VR: "Vereda",
};

const VIA_NOMBRE_A_SIGLA = Object.fromEntries(
  Object.entries(TIPOS_VIA_CATASTRO).map(([sigla, nombre]) => [normalizarTexto(nombre), sigla])
);

export type DetalleCatastroDesdeCatastro = {
  referenciaCatastral: string;
  tipoUso: string;
  superficieConstruida: string;
};

export type InmuebleParcelaCatastro = {
  referenciaCatastral: string;
  referenciaParcela: string;
  etiqueta: string;
  usoPrincipal?: string;
  supConstruidaEdificio?: string;
  anoConstruccion?: string;
  cpt?: string;
  escalera?: string;
  planta?: string;
  puerta?: string;
  bloque?: string;
  provincia?: string;
  municipio?: string;
  tipoVia?: string;
  nombreVia?: string;
  codigoPostal?: string;
  numeroVia?: string;
  usosJson?: Record<string, number>;
  superficieConstruidaTotal?: number;
  campos?: Partial<Poliza>;
  detallesUsos: DetalleCatastroDesdeCatastro[];
};

export type OpcionParcelaCatastro = {
  referenciaParcela: string;
  etiqueta: string;
  campos: Partial<Poliza>;
  inmuebles: InmuebleParcelaCatastro[];
  detallesUsosAgregados: DetalleCatastroDesdeCatastro[];
};

export type CandidatoCatastro = {
  id: string;
  etiqueta: string;
  referenciaCatastral: string;
  campos: Partial<Poliza>;
  detalleCatastro?: DetalleCatastroDesdeCatastro;
};

export type ResultadoNormalizacionCatastro = {
  candidatos: CandidatoCatastro[];
  detallesUsos: DetalleCatastroDesdeCatastro[];
  opcionParcela?: OpcionParcelaCatastro;
  errores: string[];
  numerosAlternativos: string[];
  dtConsulta?: CatastroDt;
};

type CatastroDir = {
  tv?: string;
  nv?: string;
  pnp?: string;
  plp?: string;
};

type CatastroLoint = {
  bq?: string;
  es?: string;
  pt?: string;
  pu?: string;
};

type CatastroLourb = {
  dir?: CatastroDir;
  loint?: CatastroLoint;
  dp?: string;
};

export type CatastroDt = {
  np?: string;
  nm?: string;
  ldt?: string;
  loine?: { cp?: string; cm?: string };
  cmc?: string;
  locs?: {
    lous?: { lourb?: CatastroLourb };
    lors?: { lourb?: CatastroLourb };
  };
};

type CatastroRc = {
  pc1?: string;
  pc2?: string;
  car?: string;
  cc1?: string;
  cc2?: string;
};

function normalizarTexto(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function expandirTipoVia(sigla?: string) {
  const code = String(sigla ?? "").trim().toUpperCase();
  return TIPOS_VIA_CATASTRO[code] ?? code;
}

export function siglaDesdeVia(via?: string) {
  const raw = String(via ?? "").trim();
  if (!raw) return "CL";

  if (/^[A-Za-z]{2,5}$/.test(raw) && raw === raw.toUpperCase()) {
    return raw.toUpperCase();
  }

  const normalized = normalizarTexto(raw);
  if (VIA_NOMBRE_A_SIGLA[normalized]) return VIA_NOMBRE_A_SIGLA[normalized];

  for (const [nombre, sigla] of Object.entries(VIA_NOMBRE_A_SIGLA)) {
    if (normalized.startsWith(`${nombre} `)) return sigla;
  }

  return "CL";
}

function inferNombreVia(poliza: Poliza) {
  const direccionC = textoCampo(poliza.direccionC);
  if (direccionC && !/^\d+$/.test(direccionC)) return direccionC;

  const nombre = textoCampo(poliza.nombreViaC);
  if (!nombre) return direccionC;

  const normalized = normalizarTexto(nombre);
  for (const [, nombreVia] of Object.entries(TIPOS_VIA_CATASTRO)) {
    const tipo = normalizarTexto(nombreVia);
    if (normalized.startsWith(`${tipo} `)) {
      return nombre.slice(nombreVia.length).trim();
    }
  }

  for (const [nombreTipo] of Object.entries(VIA_NOMBRE_A_SIGLA)) {
    if (normalized.startsWith(`${nombreTipo} `)) {
      return nombre.slice(nombreTipo.length).trim();
    }
  }

  return nombre;
}

/** Formato RC español: 14 (parcela) o 20 (inmueble) caracteres alfanuméricos (puede haber letras en los 7 primeros). */
export function esReferenciaCatastralValida(value?: string) {
  const ref = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s.-]/g, "");
  return /^(?:[A-Z0-9]{14}|[A-Z0-9]{20})$/.test(ref);
}

/** Para sede web y DNPRC: validez por longitud 14/20 (guión WebCatastro). */
export function prepararReferenciaCatastroWeb(value?: string) {
  const ref = textoCampo(value)
    .toUpperCase()
    .replace(/[\s.-]/g, "");

  if (!ref) return null;
  if (esReferenciaCatastralValida(ref)) return ref;
  return null;
}

export function normalizarReferenciaCatastral(value?: string) {
  return prepararReferenciaCatastroWeb(value);
}

export function esConsultaCatastroPorReferencia(poliza: Poliza) {
  return Boolean(normalizarReferenciaCatastral(poliza.catastro));
}

export function parametrosConsultaCatastroPorReferencia(poliza: Poliza): { RefCat: string } | null {
  const refCat = normalizarReferenciaCatastral(poliza.catastro);
  return refCat ? { RefCat: refCat } : null;
}

export function parametrosConsultaCatastro(poliza: Poliza): Record<string, string> | null {
  const provincia = textoCampo(poliza.provinciaC);
  const municipio = textoCampo(poliza.poblacionC);
  const numero = textoCampo(poliza.numeroCalleC);
  const calle = inferNombreVia(poliza);

  if (!provincia || !municipio || !calle || !numero) return null;

  const params: Record<string, string> = {
    Provincia: provincia.toUpperCase(),
    Municipio: municipio.toUpperCase(),
    Sigla: siglaDesdeVia(textoCampo(poliza.viaC) || textoCampo(poliza.nombreViaC)),
    Calle: calle.toUpperCase(),
    Numero: numero,
  };

  const bloque = textoCampo(poliza.bloqueC);
  const escalera = textoCampo(poliza.escaleraC);
  const planta = textoCampo(poliza.plantaC);
  const puerta = textoCampo(poliza.puertaC);
  if (bloque) params.Bloque = bloque;
  if (escalera) params.Escalera = escalera;
  if (planta) params.Planta = planta;
  if (puerta) params.Puerta = puerta;

  return params;
}

export function puedeConsultarCatastroOficial(poliza: Poliza) {
  return Boolean(esConsultaCatastroPorReferencia(poliza) || parametrosConsultaCatastro(poliza));
}

export function codigoPostalDesdeDt(dt?: CatastroDt) {
  const lourb = dt?.locs?.lous?.lourb ?? dt?.locs?.lors?.lourb;
  if (lourb?.dp?.trim()) return lourb.dp.trim();
  const match = dt?.ldt?.match(/\b(\d{5})\b/);
  return match?.[1] ?? "";
}

export function enriquecerCamposCatastro(campos: Partial<Poliza>, dt?: CatastroDt): Partial<Poliza> {
  const cp = textoCampo(campos.codigoPostalC) || codigoPostalDesdeDt(dt);
  if (!cp) return campos;
  return { ...campos, codigoPostalC: cp };
}

type BicoCatastro = {
  bi?: {
    dt?: CatastroDt;
    idbi?: { rc?: CatastroRc };
    debi?: CatastroDebi;
    lcons?: CatastroCons | CatastroCons[];
  };
  lcons?: CatastroCons | CatastroCons[];
};

function normalizarBico(root?: Record<string, unknown>): BicoCatastro | undefined {
  const raw = root?.bico;
  if (!raw) return undefined;

  const item = (Array.isArray(raw) ? raw[0] : raw) as BicoCatastro;
  const bi = item.bi;
  const lcons = asArray(item.lcons ?? bi?.lcons);

  return { bi, lcons };
}

function referenciaCatastral(rc?: CatastroRc) {
  if (!rc?.pc1 || !rc?.pc2) return "";
  return `${rc.pc1}${rc.pc2}${rc.car ?? ""}${rc.cc1 ?? ""}${rc.cc2 ?? ""}`.trim();
}

export function referenciaParcelaCatastral(rc?: CatastroRc) {
  if (!rc?.pc1 || !rc?.pc2) return "";
  return `${rc.pc1}${rc.pc2}`.trim();
}

export function referenciaParcelaDesdeReferencia(value?: string) {
  const ref = normalizarReferenciaCatastral(value);
  if (!ref) return null;
  return ref.length >= 14 ? ref.slice(0, 14) : null;
}

export function esReferenciaParcela(value?: string) {
  const ref = normalizarReferenciaCatastral(value);
  return Boolean(ref && ref.length === 14);
}

function formatearSuperficieAgregada(total: number) {
  if (Number.isInteger(total)) return String(total);
  return total.toFixed(2).replace(/\.?0+$/, "");
}

export function etiquetaUsoParcela(uso: string) {
  const upper = uso.trim().toUpperCase();
  if (upper === "VIVIENDA") return "Vivienda";
  if (upper === "COMERCIO" || upper === "COMERCIAL") return "Comercial";
  return titleCase(uso);
}

/** Igual que FileMaker: suma superficies por clave lcd en lcons (UsosJSON). */
export function extraerUsosJsonDesdeConsultaDnprc(payload: unknown): Record<string, number> {
  const root = (payload as { consulta_dnprcResult?: Record<string, unknown> }).consulta_dnprcResult;
  const bico = normalizarBico(root);
  const usos: Record<string, number> = {};

  asArray(bico?.lcons).forEach((unidad) => {
    const clave = String(unidad.lcd ?? "")
      .trim()
      .replace(/"/g, "");
    if (!clave) return;

    const stl = Number.parseFloat(String(unidad.dfcons?.stl ?? "").replace(",", "."));
    if (!Number.isFinite(stl)) return;

    usos[clave] = (usos[clave] ?? 0) + stl;
  });

  return usos;
}

/** Datos de CAT_DetalleCatastro_ActualizarUsosPorRC20 (DNPRC por RC20). */
export function extraerDatosDnprcPorRc20(payload: unknown) {
  const root = (payload as { consulta_dnprcResult?: Record<string, unknown> }).consulta_dnprcResult;
  const bico = normalizarBico(root);
  const usosJson = extraerUsosJsonDesdeConsultaDnprc(payload);
  const superficieConstruidaTotal = Object.values(usosJson).reduce((total, valor) => total + valor, 0);

  return {
    usosJson,
    superficieConstruidaTotal,
    superficieEdificio: bico?.bi?.debi?.sfc,
    usoPrincipal: bico?.bi?.debi?.luso,
    anoConstruccion: bico?.bi?.debi?.ant,
  };
}

export function sumarUsosJsonParcela(lista: Record<string, number>[]): Record<string, number> {
  const agg: Record<string, number> = {};

  lista.forEach((usos) => {
    Object.entries(usos).forEach(([clave, valor]) => {
      agg[clave] = (agg[clave] ?? 0) + valor;
    });
  });

  return agg;
}

export function detallesCatastroDesdeUsosParcelaJson(
  referenciaParcela: string,
  usosParcelaJson: Record<string, number>
): DetalleCatastroDesdeCatastro[] {
  return Object.entries(usosParcelaJson)
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([tipoUso, superficie]) => ({
      referenciaCatastral: referenciaParcela,
      tipoUso,
      superficieConstruida: formatearSuperficieAgregada(superficie),
    }));
}

function parsearListaRcdnp(payload: unknown) {
  const root = (payload as { consulta_dnprcResult?: Record<string, unknown> }).consulta_dnprcResult;
  return asArray(
    (root?.lrcdnp as { rcdnp?: unknown } | undefined)?.rcdnp as
      | { dt?: CatastroDt; rc?: CatastroRc; debi?: CatastroDebi }
      | { dt?: CatastroDt; rc?: CatastroRc; debi?: CatastroDebi }[]
      | undefined
  );
}

function inmuebleParcelaDesdeRcdnp(
  item: { dt?: CatastroDt; rc?: CatastroRc; debi?: CatastroDebi },
  referenciaParcela: string
): InmuebleParcelaCatastro {
  const ref20 = referenciaCatastral(item.rc);
  const dt = item.dt;
  const lourb = dt?.locs?.lous?.lourb ?? dt?.locs?.lors?.lourb;
  const loint = lourb?.loint;
  const dir = lourb?.dir;
  const campos = mapDtCatastroAPoliza(dt, item.rc, loint);

  return {
    referenciaCatastral: ref20,
    referenciaParcela,
    etiqueta: dt?.ldt || ref20 || referenciaParcela,
    usoPrincipal: item.debi?.luso,
    supConstruidaEdificio: item.debi?.sfc,
    anoConstruccion: item.debi?.ant,
    cpt: item.debi?.cpt,
    escalera: loint?.es,
    planta: loint?.pt,
    puerta: loint?.pu,
    bloque: loint?.bq,
    provincia: dt?.np,
    municipio: dt?.nm,
    tipoVia: dir?.tv,
    nombreVia: dir?.nv,
    codigoPostal: lourb?.dp,
    numeroVia: dir?.pnp,
    campos,
    usosJson: {},
    superficieConstruidaTotal: 0,
    detallesUsos: [],
  };
}

/** Inmueble único de una parcela sin división horizontal (DNPRC devuelve "bico"). */
function inmuebleParcelaDesdeBico(
  payload: unknown,
  referenciaParcela: string
): InmuebleParcelaCatastro | null {
  const root = (payload as { consulta_dnprcResult?: Record<string, unknown> }).consulta_dnprcResult;
  const bico = normalizarBico(root);
  const bi = bico?.bi;
  if (!bi) return null;

  const ref20 = referenciaCatastral(bi.idbi?.rc);
  if (ref20.length !== 20) return null;

  const dt = bi.dt;
  const lourb = dt?.locs?.lous?.lourb ?? dt?.locs?.lors?.lourb;
  const loint = lourb?.loint;
  const dir = lourb?.dir;
  const campos = mapDtCatastroAPoliza(dt, bi.idbi?.rc, loint);

  return {
    referenciaCatastral: ref20,
    referenciaParcela,
    etiqueta: dt?.ldt || ref20 || referenciaParcela,
    usoPrincipal: bi.debi?.luso,
    supConstruidaEdificio: bi.debi?.sfc,
    anoConstruccion: bi.debi?.ant,
    cpt: bi.debi?.cpt,
    escalera: loint?.es,
    planta: loint?.pt,
    puerta: loint?.pu,
    bloque: loint?.bq,
    provincia: dt?.np,
    municipio: dt?.nm,
    tipoVia: dir?.tv,
    nombreVia: dir?.nv,
    codigoPostal: lourb?.dp,
    numeroVia: dir?.pnp,
    campos,
    usosJson: {},
    superficieConstruidaTotal: 0,
    detallesUsos: [],
  };
}

async function consultarDnprcJson(referenciaCatastral: string) {
  const refCat =
    prepararReferenciaCatastroWeb(referenciaCatastral) ??
    normalizarReferenciaCatastral(referenciaCatastral);
  if (!refCat) throw new Error("Referencia catastral no válida");

  const res = await fetch(`/api/catastro/dnprc?${new URLSearchParams({ RefCat: refCat })}`);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || "No se pudo consultar el catastro por referencia");
  }

  return data;
}

async function actualizarUsosPorRc20(inmueble: InmuebleParcelaCatastro): Promise<InmuebleParcelaCatastro> {
  if (inmueble.referenciaCatastral.length !== 20) {
    return { ...inmueble, usosJson: {}, superficieConstruidaTotal: 0, detallesUsos: [] };
  }

  try {
    const data = await consultarDnprcJson(inmueble.referenciaCatastral);
    const datos = extraerDatosDnprcPorRc20(data);

    return {
      ...inmueble,
      usosJson: datos.usosJson,
      superficieConstruidaTotal: datos.superficieConstruidaTotal,
      usoPrincipal: datos.usoPrincipal || inmueble.usoPrincipal,
      anoConstruccion: datos.anoConstruccion || inmueble.anoConstruccion,
      detallesUsos: detallesCatastroDesdeUsosParcelaJson(
        inmueble.referenciaCatastral,
        datos.usosJson
      ),
    };
  } catch {
    return { ...inmueble, usosJson: {}, superficieConstruidaTotal: 0, detallesUsos: [] };
  }
}

/** Réplica de CAT_DetalleCatastro_* en FileMaker para una RC de parcela (14). */
export async function calcularParcelaCatastroFm(referenciaParcela: string) {
  const ref = normalizarReferenciaCatastral(referenciaParcela);
  if (!ref || ref.length !== 14) {
    throw new Error("La referencia de parcela debe tener 14 caracteres");
  }

  const data = await consultarDnprcJson(ref);
  const rcdnp = parsearListaRcdnp(data);

  let inmueblesBase = rcdnp
    .map((item) => inmuebleParcelaDesdeRcdnp(item, ref))
    .filter((item) => item.referenciaCatastral.length === 20);

  // Parcela sin división horizontal: DNPRC devuelve un único "bico", no la lista lrcdnp.
  if (inmueblesBase.length === 0) {
    const inmuebleBico = inmuebleParcelaDesdeBico(data, ref);
    if (inmuebleBico) inmueblesBase = [inmuebleBico];
  }

  if (inmueblesBase.length === 0) {
    throw new Error("El catastro no devolvió inmuebles (rcdnp) para esa referencia de parcela");
  }

  const inmuebles = await ejecutarConConcurrencia(inmueblesBase, 6, async (inmueble) =>
    actualizarUsosPorRc20(inmueble)
  );

  const usosParcelaJson = sumarUsosJsonParcela(inmuebles.map((inmueble) => inmueble.usosJson ?? {}));
  const detallesUsosAgregados = detallesCatastroDesdeUsosParcelaJson(ref, usosParcelaJson);
  const supConstruidaTotal = inmuebles.reduce(
    (total, inmueble) => total + (inmueble.superficieConstruidaTotal ?? 0),
    0
  );

  return {
    referenciaParcela: ref,
    inmuebles,
    usosParcelaJson,
    supConstruidaTotal,
    detallesUsosAgregados,
    campos: inmuebles[0]?.campos ?? {},
  };
}

async function ejecutarConConcurrencia<T, R>(
  items: T[],
  limite: number,
  tarea: (item: T, indice: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const resultados = new Array<R>(items.length);
  let indice = 0;

  async function worker() {
    while (indice < items.length) {
      const actual = indice++;
      resultados[actual] = await tarea(items[actual], actual);
    }
  }

  const workers = Math.min(limite, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return resultados;
}

export function agregarDetallesUsosPorTipo(
  detalles: DetalleCatastroDesdeCatastro[],
  referenciaParcela: string
): DetalleCatastroDesdeCatastro[] {
  const totales = new Map<string, number>();

  detalles.forEach((detalle) => {
    const tipoUso = String(detalle.tipoUso ?? "").trim();
    if (!tipoUso) return;
    const superficie = Number.parseFloat(String(detalle.superficieConstruida ?? "").replace(",", "."));
    if (!Number.isFinite(superficie)) return;
    totales.set(tipoUso, (totales.get(tipoUso) ?? 0) + superficie);
  });

  return [...totales.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([tipoUso, superficie]) => ({
      referenciaCatastral: referenciaParcela,
      tipoUso,
      superficieConstruida: formatearSuperficieAgregada(superficie),
    }));
}

function mensajeDetallesUsosAgregados(detalles: DetalleCatastroDesdeCatastro[]) {
  return detalles
    .map((d) => `${etiquetaUsoParcela(d.tipoUso)} ${d.superficieConstruida} m²`)
    .join(" · ");
}

function construirOpcionParcelaDesdeResultado(
  resultado: ResultadoNormalizacionCatastro
): OpcionParcelaCatastro | undefined {
  if (resultado.candidatos.length === 0) return undefined;

  const referenciasParcela = new Set(
    resultado.candidatos
      .map((candidato) => referenciaParcelaDesdeReferencia(candidato.referenciaCatastral))
      .filter(Boolean) as string[]
  );
  if (referenciasParcela.size !== 1) return undefined;

  const referenciaParcela = [...referenciasParcela][0];

  return {
    referenciaParcela,
    etiqueta: `Parcela catastral ${referenciaParcela}`,
    campos: { ...resultado.candidatos[0].campos, catastro: referenciaParcela },
    inmuebles: [],
    detallesUsosAgregados: [],
  };
}

export async function enriquecerOpcionParcela(
  opcion: OpcionParcelaCatastro,
  _poliza?: Poliza
): Promise<OpcionParcelaCatastro> {
  const fm = await calcularParcelaCatastroFm(opcion.referenciaParcela);

  return {
    referenciaParcela: fm.referenciaParcela,
    etiqueta: `Parcela catastral ${fm.referenciaParcela} · ${mensajeDetallesUsosAgregados(fm.detallesUsosAgregados)}`,
    campos: { ...opcion.campos, ...fm.campos, catastro: fm.referenciaParcela },
    inmuebles: fm.inmuebles,
    detallesUsosAgregados: fm.detallesUsosAgregados,
  };
}

function anoConstruccionDesdeAnt(ant?: string) {
  const value = String(ant ?? "").trim();
  return /^\d{4}$/.test(value) ? value : "";
}

function tipoUsoCatastro(uso?: string, tipologia?: string) {
  const lcd = String(uso ?? "").trim();
  if (lcd) {
    const upper = lcd.toUpperCase();
    if (upper === "VIVIENDA") return "Vivienda";
    if (upper === "COMERCIO" || upper === "COMERCIAL") return "Comercial";
    return titleCase(lcd);
  }
  return titleCase(String(tipologia ?? "").trim());
}

function superficieConstruidaCatastro(superficieUnidad?: string, superficieEdificio?: string) {
  const unit = String(superficieUnidad ?? "").trim();
  if (unit) return unit.replace(",", ".");

  const total = String(superficieEdificio ?? "").trim();
  if (!total) return "";
  return total.replace(",", ".");
}

function claveDetalleUso(detalle: DetalleCatastroDesdeCatastro) {
  return `${detalle.referenciaCatastral}|${detalle.tipoUso}|${detalle.superficieConstruida}`;
}

function crearDetalleCatastro(
  referencia: string,
  detalles: {
    uso?: string;
    tipologia?: string;
    superficieUnidad?: string;
    superficieEdificio?: string;
  }
): DetalleCatastroDesdeCatastro | undefined {
  const tipoUso = tipoUsoCatastro(detalles.uso, detalles.tipologia);
  const superficieConstruida = detalles.superficieUnidad
    ? superficieConstruidaCatastro(detalles.superficieUnidad)
    : superficieConstruidaCatastro(undefined, detalles.superficieEdificio);

  if (!referencia && !tipoUso && !superficieConstruida) return undefined;

  return {
    referenciaCatastral: referencia,
    tipoUso,
    superficieConstruida,
  };
}

function detalleDesdeUnidadConstructiva(
  referencia: string,
  unidad: CatastroCons
): DetalleCatastroDesdeCatastro | undefined {
  return crearDetalleCatastro(referencia, {
    uso: unidad.lcd,
    superficieUnidad: unidad.dfcons?.stl,
  });
}

function extraerDetallesUsosBico(
  bico?: {
    bi?: { idbi?: { rc?: CatastroRc }; debi?: CatastroDebi };
    lcons?: CatastroCons | CatastroCons[];
  },
  referenciaFallback = ""
): DetalleCatastroDesdeCatastro[] {
  const ref = referenciaCatastral(bico?.bi?.idbi?.rc) || referenciaFallback;
  const unidades = asArray(bico?.lcons);
  const detalles: DetalleCatastroDesdeCatastro[] = [];
  const seen = new Set<string>();

  if (unidades.length > 0) {
    unidades.forEach((unidad) => {
      const detalle = detalleDesdeUnidadConstructiva(ref, unidad);
      if (!detalle) return;
      const key = claveDetalleUso(detalle);
      if (seen.has(key)) return;
      seen.add(key);
      detalles.push(detalle);
    });
    return detalles;
  }

  const debi = bico?.bi?.debi;
  const detalleEdificio = crearDetalleCatastro(ref, {
    uso: debi?.luso,
    superficieEdificio: debi?.sfc,
  });
  return detalleEdificio ? [detalleEdificio] : [];
}

/** Quita el uso agregado del edificio (p. ej. Residencial/130) si hay unidades en lcons. */
export function filtrarDetallesUsosConstructivos(
  detalles: DetalleCatastroDesdeCatastro[]
): DetalleCatastroDesdeCatastro[] {
  if (detalles.length <= 1) return detalles;

  const hayUnidadesConstructivas = detalles.some(
    (detalle) => !/^residencial$/i.test(detalle.tipoUso.trim())
  );

  if (!hayUnidadesConstructivas) return detalles;

  return detalles.filter((detalle) => !/^residencial$/i.test(detalle.tipoUso.trim()));
}

export function candidatoPreferidoDireccionCatastro(candidatos: CandidatoCatastro[]) {
  if (candidatos.length === 0) return null;
  const vivienda = candidatos.find((candidato) =>
    /vivienda/i.test(candidato.detalleCatastro?.tipoUso ?? candidato.etiqueta)
  );
  return vivienda ?? candidatos.find((c) => c.campos.plantaC || c.campos.puertaC) ?? candidatos[0];
}

type CatastroDebi = {
  luso?: string;
  ant?: string;
  sfc?: string;
};

type CatastroCons = {
  lcd?: string;
  dt?: { lourb?: { loint?: CatastroLoint } };
  dvcons?: { dtip?: string };
  dfcons?: { stl?: string };
};

export function mapDtCatastroAPoliza(
  dt?: CatastroDt,
  rc?: CatastroRc,
  lointOverride?: CatastroLoint
): Partial<Poliza> {
  return mapDtCatastroAPolizaInternal(dt, rc, lointOverride);
}

function mapDtCatastroAPolizaInternal(
  dt?: CatastroDt,
  rc?: CatastroRc,
  lointOverride?: CatastroLoint,
  anoConstruccion?: string,
  unidadDt?: { lourb?: CatastroLourb }
): Partial<Poliza> {
  if (!dt) return {};

  const lourbBase = dt.locs?.lous?.lourb ?? dt.locs?.lors?.lourb;
  const lourbUnidad = unidadDt?.lourb;
  const dir = lourbUnidad?.dir ?? lourbBase?.dir;
  const loint = lointOverride ?? lourbUnidad?.loint ?? lourbBase?.loint;
  const via = expandirTipoVia(dir?.tv);
  const direccion = titleCase(dir?.nv ?? "");
  const ref = referenciaCatastral(rc);
  const ano = anoConstruccionDesdeAnt(anoConstruccion);

  return {
    viaC: via,
    direccionC: direccion,
    nombreViaC: [via, direccion].filter(Boolean).join(" "),
    numeroCalleC: dir?.pnp ?? "",
    bloqueC: loint?.bq ?? "",
    escaleraC: loint?.es ?? "",
    plantaC: loint?.pt ?? "",
    puertaC: loint?.pu ?? "",
    codigoPostalC:
      (lourbUnidad?.dp ?? "").trim() ||
      (lourbBase?.dp ?? "").trim() ||
      codigoPostalDesdeDt(dt),
    poblacionC: titleCase(dt.nm ?? ""),
    provinciaC: titleCase(dt.np ?? ""),
    ...(ref ? { catastro: ref } : {}),
    ...(ano ? { anoConstruccion: ano } : {}),
  };
}

function detalleInterno(loint?: CatastroLoint) {
  return [
    loint?.bq ? `Bloque ${loint.bq}` : "",
    loint?.es ? `Esc. ${loint.es}` : "",
    loint?.pt ? `Planta ${loint.pt}` : "",
    loint?.pu ? `Puerta ${loint.pu}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function crearCandidato(
  dt: CatastroDt,
  rc: CatastroRc | undefined,
  loint: CatastroLoint | undefined,
  detalles: {
    uso?: string;
    tipologia?: string;
    indice?: number;
    anoConstruccion?: string;
    superficieUnidad?: string;
    superficieEdificio?: string;
  },
  unidadDt?: { lourb?: CatastroLourb }
): CandidatoCatastro {
  const ref = referenciaCatastral(rc);
  const interno = detalleInterno(loint);
  const ano = anoConstruccionDesdeAnt(detalles.anoConstruccion);
  const superficie = detalles.superficieUnidad
    ? superficieConstruidaCatastro(detalles.superficieUnidad)
    : "";
  const partes = [
    dt.ldt,
    detalles.uso ? titleCase(String(detalles.uso)) : "",
    detalles.tipologia,
    interno,
    superficie ? `${superficie} m²` : "",
    ano ? `Año ${ano}` : "",
    ref ? `RC ${ref}` : "",
  ].filter(Boolean);

  return {
    id: `${ref || "sin-rc"}-${detalles.indice ?? 0}-${interno || "base"}`,
    etiqueta: partes.join(" · "),
    referenciaCatastral: ref,
    campos: mapDtCatastroAPolizaInternal(dt, rc, loint, detalles.anoConstruccion, unidadDt),
    detalleCatastro: crearDetalleCatastro(ref, {
      uso: detalles.uso,
      tipologia: detalles.tipologia,
      superficieUnidad: detalles.superficieUnidad,
      superficieEdificio: detalles.superficieEdificio,
    }),
  };
}

function claveCandidato(candidato: CandidatoCatastro) {
  const c = candidato.campos;
  return [
    candidato.referenciaCatastral,
    c.bloqueC,
    c.escaleraC,
    c.plantaC,
    c.puertaC,
  ].join("|");
}

export function parseConsultaCatastro(payload: unknown): ResultadoNormalizacionCatastro {
  const data = payload as {
    consulta_dnplocResult?: Record<string, unknown>;
    consulta_dnprcResult?: Record<string, unknown>;
  };
  const root = data.consulta_dnplocResult ?? data.consulta_dnprcResult;
  const errores = asArray(root?.lerr as { des?: string } | { des?: string }[]).map((item) => item.des).filter(Boolean) as string[];
  const numerero = root?.numerero as
    | { nump?: { num?: { pnp?: string } } | { num?: { pnp?: string } }[] }
    | undefined;
  const numerosAlternativos = asArray(numerero?.nump)
    .map((item) => item.num?.pnp)
    .filter(Boolean) as string[];

  const candidatos: CandidatoCatastro[] = [];
  const detallesUsos: DetalleCatastroDesdeCatastro[] = [];
  let dtConsulta: CatastroDt | undefined;
  const seen = new Set<string>();
  const seenDetalles = new Set<string>();

  const addDetalle = (detalle?: DetalleCatastroDesdeCatastro) => {
    if (!detalle) return;
    const key = claveDetalleUso(detalle);
    if (seenDetalles.has(key)) return;
    seenDetalles.add(key);
    detallesUsos.push(detalle);
  };

  const add = (candidato: CandidatoCatastro) => {
    const key = claveCandidato(candidato);
    if (seen.has(key)) return;
    seen.add(key);
    candidatos.push(candidato);
  };

  const bico = normalizarBico(root as Record<string, unknown> | undefined);
  const lista = asArray(
    (root?.lrcdnp as { rcdnp?: unknown } | undefined)?.rcdnp as
      | { dt?: CatastroDt; rc?: CatastroRc; debi?: CatastroDebi }
      | { dt?: CatastroDt; rc?: CatastroRc; debi?: CatastroDebi }[]
      | undefined
  );

  if (bico) {
    const dt = bico.bi?.dt;
    if (dt) dtConsulta = dt;
    const ref = referenciaCatastral(bico.bi?.idbi?.rc);
    extraerDetallesUsosBico(bico, ref).forEach(addDetalle);
  }

  if (lista.length > 0) {
    lista.forEach((item, index) => {
      if (!item.dt) return;
      if (!dtConsulta) dtConsulta = item.dt;
      const loint = item.dt.locs?.lous?.lourb?.loint ?? item.dt.locs?.lors?.lourb?.loint;
      const candidato = crearCandidato(item.dt, item.rc, loint, {
        uso: item.debi?.luso,
        anoConstruccion: item.debi?.ant,
        superficieEdificio: item.debi?.sfc,
        indice: index,
      });
      candidato.detalleCatastro = undefined;
      add(candidato);
    });
  } else if (bico?.bi?.dt) {
    const dt = bico.bi.dt;
    const rc = bico.bi.idbi?.rc;
    const ref = referenciaCatastral(rc);
    const anoConstruccion = bico.bi.debi?.ant;
    const unidades = asArray(bico.lcons);

    if (unidades.length > 0) {
      unidades.forEach((unidad, index) => {
        add(
          crearCandidato(
            dt,
            rc,
            unidad.dt?.lourb?.loint,
            {
              uso: unidad.lcd,
              tipologia: unidad.dvcons?.dtip,
              anoConstruccion,
              superficieUnidad: unidad.dfcons?.stl,
              indice: index,
            },
            unidad.dt
          )
        );
      });
    } else {
      const loint = dt.locs?.lous?.lourb?.loint ?? dt.locs?.lors?.lourb?.loint;
      add(
        crearCandidato(dt, rc, loint, {
          uso: bico.bi.debi?.luso,
          anoConstruccion,
          superficieEdificio: bico.bi.debi?.sfc,
        })
      );
    }
  }

  return {
    candidatos,
    detallesUsos: filtrarDetallesUsosConstructivos(detallesUsos),
    errores,
    numerosAlternativos,
    dtConsulta,
  };
}

async function finalizarResultadoCatastro(
  resultado: ResultadoNormalizacionCatastro,
  poliza?: Poliza
): Promise<ResultadoNormalizacionCatastro> {
  let opcionParcela = construirOpcionParcelaDesdeResultado(resultado);
  if (opcionParcela) {
    opcionParcela = await enriquecerOpcionParcela(opcionParcela, poliza);
  }

  return {
    ...resultado,
    opcionParcela,
  };
}

export function parseConsultaDnpLoc(payload: unknown): ResultadoNormalizacionCatastro {
  return parseConsultaCatastro(payload);
}

export function calcularSuperficieTotalDesdeUsosJson(usosJson: Record<string, number>): number {
  return Object.values(usosJson).reduce((total, valor) => total + valor, 0);
}

export function calcularSuperficieTotalDesdeDetallesUsos(
  detalles: DetalleCatastroDesdeCatastro[]
): number {
  return detalles.reduce((total, detalle) => {
    const superficie = Number.parseFloat(
      String(detalle.superficieConstruida ?? "").replace(",", ".")
    );
    return Number.isFinite(superficie) ? total + superficie : total;
  }, 0);
}

/** Suma todos los usos del catastro (p. ej. vivienda + elementos comunes). */
export function resolverSuperficieConstruidaTotalCatastro(
  usosJson: Record<string, number>,
  detalles: DetalleCatastroDesdeCatastro[],
  superficieFallback?: string | number
): number {
  const desdeUsosJson = calcularSuperficieTotalDesdeUsosJson(usosJson);
  if (desdeUsosJson > 0) return desdeUsosJson;

  const desdeDetalles = calcularSuperficieTotalDesdeDetallesUsos(detalles);
  if (desdeDetalles > 0) return desdeDetalles;

  const fallback = Number.parseFloat(String(superficieFallback ?? "").replace(",", "."));
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
}

/** DNPRC por RC20: usos (lcons), superficie total y detalle para DETALLECATASTRO. */
export async function consultarDatosUsosDnprc(referenciaCatastral: string): Promise<{
  detallesUsos: DetalleCatastroDesdeCatastro[];
  usosJson: Record<string, number>;
  superficieConstruidaTotal: number;
  superficieEdificio?: string;
}> {
  const refCat = normalizarReferenciaCatastral(referenciaCatastral);
  if (!refCat) {
    return { detallesUsos: [], usosJson: {}, superficieConstruidaTotal: 0 };
  }

  const data = await consultarDnprcJson(refCat);
  const datos = extraerDatosDnprcPorRc20(data);
  let detallesUsos = filtrarDetallesUsosConstructivos(parseConsultaCatastro(data).detallesUsos);

  if (detallesUsos.length === 0 && Object.keys(datos.usosJson).length > 0) {
    detallesUsos = detallesCatastroDesdeUsosParcelaJson(refCat, datos.usosJson);
  }

  const superficieConstruidaTotal = resolverSuperficieConstruidaTotalCatastro(
    datos.usosJson,
    detallesUsos,
    datos.superficieEdificio
  );

  return {
    detallesUsos,
    usosJson: datos.usosJson,
    superficieConstruidaTotal,
    superficieEdificio: datos.superficieEdificio,
  };
}

/** Usos por unidad (lcons) solo vienen en DNPRC; DNPLOC devuelve uso agregado del edificio. */
export async function consultarDetallesUsosPorReferencia(
  referenciaCatastral: string
): Promise<DetalleCatastroDesdeCatastro[]> {
  const datos = await consultarDatosUsosDnprc(referenciaCatastral);
  return datos.detallesUsos;
}

export async function normalizarDireccionCatastro(poliza: Poliza): Promise<ResultadoNormalizacionCatastro> {
  const paramsReferencia = parametrosConsultaCatastroPorReferencia(poliza);

  if (paramsReferencia) {
    const res = await fetch(`/api/catastro/dnprc?${new URLSearchParams(paramsReferencia)}`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error((data as { error?: string })?.error || "No se pudo consultar el catastro por referencia");
    }

    const resultado = parseConsultaCatastro(data);
    if (resultado.candidatos.length === 0 && resultado.errores.length === 0) {
      throw new Error("El catastro no devolvió datos para esa referencia catastral");
    }

    return finalizarResultadoCatastro(resultado, poliza);
  }

  const params = parametrosConsultaCatastro(poliza);
  if (!params) {
    throw new Error(
      "Introduce la referencia catastral o completa provincia, población, vía/dirección y número del catastro"
    );
  }

  const res = await fetch(`/api/catastro/dnploc?${new URLSearchParams(params)}`);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || "No se pudo consultar el catastro");
  }

  let resultado = parseConsultaCatastro(data);
  if (resultado.candidatos.length === 0 && resultado.errores.length === 0) {
    throw new Error("El catastro no devolvió datos para esa dirección");
  }

  if (resultado.detallesUsos.length === 0 && resultado.candidatos.length === 1) {
    const ref = resultado.candidatos[0].referenciaCatastral;
    if (ref) {
      try {
        const usos = await consultarDetallesUsosPorReferencia(ref);
        if (usos.length) resultado = { ...resultado, detallesUsos: usos };
      } catch {
        // Sin DNPRC se mantienen los datos de dirección ya obtenidos.
      }
    }
  }

  return finalizarResultadoCatastro(resultado, poliza);
}
