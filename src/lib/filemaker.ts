import {
  Asegurado,
  aseguradoMock,
  Compania,
  companiasMock,
  ContactoAsegurado,
  contactosAseguradoMock,
  DetalleCatastroPoliza,
  DetalleContinente,
  Poliza,
  polizasMock,
  Ramo,
  Siniestro,
  siniestrosMock,
  TipologiaContinente,
} from "@/data/siniestros";
import { calcularMetricasDistanciaPoliza } from "@/lib/distanciaPoliza";
import type { DetalleCatastroDesdeCatastro, InmuebleParcelaCatastro } from "@/lib/catastro";
import { calcularImporteContinente } from "@/lib/continente";
import { normalizarPoliza } from "@/lib/normalizarPoliza";
import { textoCampo, valorContactoVisible } from "@/lib/textoCampo";
import {
  agruparAsignadosAnual,
  COMPANIAS_ASIGNADOS_SEGUIMIENTO,
  candidatosBusquedaAnioFecha,
  type DesgloseCompaniaAsignados,
  type FormatoBusquedaAnioFecha,
  type PuntoAsignadosAnual,
  type PuntoAsignadosMensualComparado,
  type PuntoAsignadosDiario,
  nombreMes,
  valorBusquedaAnioFecha,
  valorBusquedaMesAnioFecha,
  valorBusquedaRangoMes,
  valorBusquedaDia,
  candidatosBusquedaDia,
  diasEnMes,
} from "@/lib/asignadosSiniestros";

function parseListaEnv(valor: unknown, defecto: string[]): string[] {
  const texto = textoCampo(valor);
  if (!texto) return defecto;
  return Array.from(new Set(texto.split(/[,;|]/).map((item) => item.trim()).filter(Boolean)));
}

export const FM_CONFIG = {
  host: import.meta.env.VITE_FM_HOST ?? "",
  database: import.meta.env.VITE_FM_DATABASE ?? "GestionPericial",
  layout: import.meta.env.VITE_FM_LAYOUT ?? "API_EnlacesSiniestros",
  layoutSiniestros: import.meta.env.VITE_FM_LAYOUT_SINIESTROS ?? "API_Siniestros",
  layoutAsegurados: import.meta.env.VITE_FM_LAYOUT_ASEGURADOS ?? "API_Asegurados",
  layoutContactosAsegurado: import.meta.env.VITE_FM_LAYOUT_CONTACTOS_ASEGURADO ?? "API_ContactosAsegurado",
  layoutPolizas: import.meta.env.VITE_FM_LAYOUT_POLIZAS ?? "API_Polizas",
  layoutDetalleCatastro: import.meta.env.VITE_FM_LAYOUT_DETALLE_CATASTRO ?? "API_detalleCatastro",
  layoutDetalleCatastroParcela:
    import.meta.env.VITE_FM_LAYOUT_DETALLE_CATASTRO_PARCELA ?? "API_DetalleCatastroParcela",
  layoutDetalleContinente:
    import.meta.env.VITE_FM_LAYOUT_DETALLE_CONTINENTE ?? "API_DetalleContinente",
  layoutTipologiasContinente:
    import.meta.env.VITE_FM_LAYOUT_TIPOLOGIAS_CONTINENTE ?? "API_TipologiasContinente",
  layoutRamos: import.meta.env.VITE_FM_LAYOUT_RAMOS ?? "API_Ramos",
  layoutCompanias: import.meta.env.VITE_FM_LAYOUT_COMPANIAS ?? "API_Companias",
  layoutCodigosPostales: import.meta.env.VITE_FM_LAYOUT_CODIGOS_POSTALES ?? "API_CodigosPostales",
  layoutCodigosMunicipiosCatastro:
    import.meta.env.VITE_FM_LAYOUT_CODIGOS_MUNICIPIOS_CATASTRO ?? "API_CodigosMunicipiosCatastro",
  cmCatastroCampoMunicipio:
    import.meta.env.VITE_FM_CM_CATASTRO_CAMPO_MUNICIPIO ?? "Municipio",
  cmCatastroCampoCodigo: import.meta.env.VITE_FM_CM_CATASTRO_CAMPO_CODIGO ?? "Codigo",
  cpCampoCodPostal: import.meta.env.VITE_FM_CP_CAMPO_COD_POSTAL ?? "CodigoPostal",
  cpCampoPoblacion: import.meta.env.VITE_FM_CP_CAMPO_POBLACION ?? "Poblacion",
  cpCampoProvincia: import.meta.env.VITE_FM_CP_CAMPO_PROVINCIA ?? "Provincia",
  scriptEnviarEnlace: import.meta.env.VITE_FM_SCRIPT_ENVIAR_ENLACE ?? "SMS",
  scriptRellenarDireccionAsegurado:
    import.meta.env.VITE_FM_SCRIPT_RELLENAR_DIRECCION_ASEGURADO ??
    "Rellenar direccion asegurado",
  scriptWebCatastro: import.meta.env.VITE_FM_SCRIPT_WEB_CATASTRO ?? "WebCatastro",
  campoDistanciaPoliza: import.meta.env.VITE_FM_POLIZA_CAMPO_DISTANCIA ?? "Distancia",
  campoLatitudPoliza: import.meta.env.VITE_FM_POLIZA_CAMPO_LATITUD ?? "Latitud",
  campoLongitudPoliza: import.meta.env.VITE_FM_POLIZA_CAMPO_LONGITUD ?? "Longitud",
  polizaCampoCodPostalC: import.meta.env.VITE_FM_POLIZA_CAMPO_COD_POSTAL_C ?? "CodPostalC",
  detalleCatastroFkPoliza: import.meta.env.VITE_FM_DETALLE_CATASTRO_FK_POLIZA ?? "_kf_ID_Poliza",
  detalleCatastroCampoRef: import.meta.env.VITE_FM_DETALLE_CATASTRO_CAMPO_REF ?? "Catastro",
  detalleCatastroCampoTipoUso: import.meta.env.VITE_FM_DETALLE_CATASTRO_CAMPO_TIPO_USO ?? "Uso",
  detalleCatastroCampoSuperficie:
    import.meta.env.VITE_FM_DETALLE_CATASTRO_CAMPO_SUPERFICIE ?? "Superficie",
  detalleCatastroParcelaFkPoliza:
    import.meta.env.VITE_FM_DETALLE_CATASTRO_PARCELA_FK_POLIZA ?? "_kf_ID_Poliza",
  detalleCatastroParcelaCampoRef:
    import.meta.env.VITE_FM_DETALLE_CATASTRO_PARCELA_CAMPO_REF ?? "RC",
  detalleCatastroParcelaCampoRefParcela:
    import.meta.env.VITE_FM_DETALLE_CATASTRO_PARCELA_CAMPO_REF_PARCELA ?? "",
  detalleContinenteFkPoliza:
    import.meta.env.VITE_FM_DETALLE_CONTINENTE_FK_POLIZA ?? "_kf_ID_Poliza",
  detalleContinenteFkTipologia:
    import.meta.env.VITE_FM_DETALLE_CONTINENTE_FK_TIPOLOGIA ?? "_kf_ID_Tipologias",
  detalleContinenteCampoMedicion:
    import.meta.env.VITE_FM_DETALLE_CONTINENTE_CAMPO_MEDICION ?? "Medicion",
  detalleContinenteCampoPrecio:
    import.meta.env.VITE_FM_DETALLE_CONTINENTE_CAMPO_PRECIO ?? "Precio",
  detalleContinenteCampoImporte:
    import.meta.env.VITE_FM_DETALLE_CONTINENTE_CAMPO_IMPORTE ?? "Importe",
  detalleContinenteCampoClave:
    import.meta.env.VITE_FM_DETALLE_CONTINENTE_CAMPO_CLAVE ?? "ClavePrincipal",
  tipologiaContinenteCampoClave:
    import.meta.env.VITE_FM_TIPOLOGIA_CONTINENTE_CAMPO_CLAVE ?? "ClavePrincipal",
  tipologiaContinenteCampoNombre:
    import.meta.env.VITE_FM_TIPOLOGIA_CONTINENTE_CAMPO_NOMBRE ?? "TipoContinente",
  tipologiaContinenteCampoPrecio:
    import.meta.env.VITE_FM_TIPOLOGIA_CONTINENTE_CAMPO_PRECIO ?? "Precio",
  polizaCampoUsosParcelaJson:
    import.meta.env.VITE_FM_POLIZA_CAMPO_USOS_PARCELA_JSON ?? "UsosParcelaJSON",
  polizaCampoSupConstruidaTotal:
    import.meta.env.VITE_FM_POLIZA_CAMPO_SUP_CONSTRUIDA_TOTAL ?? "SupConstruidaTotal",
  polizaValuelistPropiedad:
    import.meta.env.VITE_FM_POLIZA_VALUELIST_PROPIEDAD ?? "Propietario",
  polizaValuelistsPropietario: parseListaEnv(import.meta.env.VITE_FM_POLIZA_VALUELISTS_PROPIETARIO, [
    "Propietario",
    "Propiedad",
  ]),
  polizaValoresPropietarioFallback: parseListaEnv(import.meta.env.VITE_FM_POLIZA_VALORES_PROPIETARIO, [
    "Propietario",
    "Inquilino",
  ]),
  polizaCampoPropietario:
    import.meta.env.VITE_FM_POLIZA_CAMPO_PROPIETARIO ?? "Propietario",
  filtroEnCursoCampo: import.meta.env.VITE_FM_FILTRO_EN_CURSO_CAMPO ?? "FechaCierre",
  filtroEnCursoValor: import.meta.env.VITE_FM_FILTRO_EN_CURSO_VALOR ?? "=",
  siniestroCampoFechaAsignacion:
    import.meta.env.VITE_FM_SINIESTRO_CAMPO_FECHA_ASIGNACION ?? "",
  siniestroCampoAnoAsignacion:
    import.meta.env.VITE_FM_SINIESTRO_CAMPO_ANO_ASIGNACION ?? "",
  siniestroCampoCompania:
    import.meta.env.VITE_FM_SINIESTRO_CAMPO_COMPANIA ?? "",
  siniestroCampoAlias:
    import.meta.env.VITE_FM_SINIESTRO_CAMPO_ALIAS ?? "Alias",
};

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";
const DEBUG_FM = (import.meta.env.VITE_DEBUG_FM ?? "false") === "true";
const FALLBACK_LISTAR_REGISTROS = (import.meta.env.VITE_FM_FALLBACK_LISTAR_REGISTROS ?? "true") !== "false";
let token: string | null = null;
const ramoCache = new Map<string, Ramo>();
const companiaCache = new Map<string, Compania>();
const AUTH_HEADER = "Author" + "ization";

type FileMakerRecord = { recordId: string; fieldData: Record<string, string> };
export interface EnviarEnlaceResult { ok: boolean; url?: string; texto?: string; movil?: string; raw?: unknown; }

const authBasic = (usuario: string, password: string) => `${"Bas"}ic ${btoa(`${usuario}:${password}`)}`;
const authToken = () => `${"Bear"}er ${token}`;

async function login(usuario: string, password: string): Promise<string> {
  if (USE_MOCK) { await wait(600); if (!usuario || !password) throw new Error("Credenciales requeridas"); token = "mock-token"; return token; }
  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/sessions`, { method: "POST", headers: { "Content-Type": "application/json", [AUTH_HEADER]: authBasic(usuario, password) }, body: JSON.stringify({}) });
  if (!res.ok) throw new Error("Usuario o contraseña incorrectos");
  const data = await res.json(); token = data.response.token; return token!;
}
export async function autenticar(usuario: string, password: string) {
  const tokenResult = await login(usuario, password);
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("siniestro-connect:usuario", usuario.trim());
  }
  return tokenResult;
}
export function cerrarSesion() {
  token = null;
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("siniestro-connect:usuario");
}
export function estaAutenticado() { return token !== null; }
export function obtenerUsuarioSesion() {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem("siniestro-connect:usuario") ?? "";
}

async function fmRequest(layout: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${layout}${path}`, { ...init, headers: { "Content-Type": "application/json", [AUTH_HEADER]: authToken(), ...(init.headers ?? {}) } });
  const data = await res.json().catch(() => null); debug(`FM ${layout}${path}`, data);
  if (!res.ok) throw new Error(getFileMakerErrorMessage(data) || `Error FileMaker ${res.status}`);
  return data;
}
async function findRecords(layout: string, body: object, emptyIsOk = false) { try { const data = await fmRequest(layout, "/_find", { method: "POST", body: JSON.stringify(body) }); const code = data?.messages?.[0]?.code; if (emptyIsOk && code === "401") return { response: { data: [] }, messages: data?.messages }; return data; } catch (error) { if (emptyIsOk && error instanceof Error && error.message.includes("401")) return { response: { data: [] } }; throw error; } }
async function listarRegistrosLayout(layout: string, limit = 200): Promise<FileMakerRecord[]> { const data = await fmRequest(layout, `/records?_limit=${limit}`); return data?.response?.data ?? []; }

export async function buscarRegistrosLayout(layout: string, body: object, vacioOk = true) {
  return findRecords(layout, body, vacioOk);
}

export async function paginarRegistrosLayout(
  layout: string,
  limit: number,
  offset: number
): Promise<FileMakerRecord[]> {
  const data = await fmRequest(layout, `/records?_limit=${limit}&_offset=${offset}`);
  return (data?.response?.data ?? []) as FileMakerRecord[];
}

export async function leerNombresCamposLayout(layout: string): Promise<Set<string>> {
  return obtenerNombresCamposLayout(layout);
}

export async function listarSiniestrosEnCurso(): Promise<Siniestro[]> {
  if (USE_MOCK) {
    await wait(400);
    return siniestrosMock.filter(esSiniestroEnCurso);
  }

  let registros = (await buscarRegistrosEnCurso()).filter(esSiniestroEnCursoRecord);

  if (registros.length === 0 && FALLBACK_LISTAR_REGISTROS) {
    const layouts = [FM_CONFIG.layout, FM_CONFIG.layoutSiniestros].filter(
      (layout, index, all) => Boolean(layout) && all.indexOf(layout) === index
    );

    for (const layout of layouts) {
      const todos = await listarRegistrosLayout(layout, 500).catch(() => []);
      const enCurso = todos.filter(esSiniestroEnCursoRecord);
      if (enCurso.length > 0) {
        registros = enCurso;
        break;
      }
    }
  }

  return registros.map(mapearSiniestro).filter(esSiniestroEnCurso);
}

export async function listarTodosSiniestros(limit = 500): Promise<Siniestro[]> {
  if (USE_MOCK) {
    await wait(400);
    return siniestrosMock;
  }

  const layouts = [FM_CONFIG.layoutSiniestros, FM_CONFIG.layout].filter(
    (layout, index, all) => Boolean(layout) && all.indexOf(layout) === index
  );

  for (const layout of layouts) {
    const registros = await buscarRegistrosSiniestrosLayout(layout, limit);
    if (registros.length > 0) {
      return registros.map(mapearSiniestro);
    }
  }

  return [];
}

const CAMPOS_BUSQUEDA_SINIESTRO = [
  "NumeroSiniestro",
  "NumeroSiniestro2",
  "CrawfordSini",
  "Asegurado",
  "Direccion",
  "Poblacion",
  "Provincia",
  "CodPostal",
  "zVistaDireccionCrawfordEnLinea",
  "zVistaDireccionLinea",
] as const;

export function siniestroCoincideTexto(siniestro: Siniestro, texto: string) {
  const q = texto.trim().toLowerCase();
  if (!q) return false;
  return [
    siniestro.numero,
    siniestro.numeroSiniestro2,
    siniestro.crawfordSini,
    siniestro.asegurado,
    siniestro.direccion,
    siniestro.direccionCalle,
    siniestro.poblacion,
    siniestro.provincia,
    siniestro.codPostal,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export async function buscarSiniestros(texto: string, limit = 100): Promise<Siniestro[]> {
  const q = texto.trim();
  if (!q) return [];

  if (USE_MOCK) {
    await wait(200);
    return siniestrosMock.filter((s) => siniestroCoincideTexto(s, q));
  }

  const layouts = [FM_CONFIG.layoutSiniestros, FM_CONFIG.layout].filter(
    (layout, index, all) => Boolean(layout) && all.indexOf(layout) === index
  );

  const porRecordId = new Map<string, Siniestro>();
  const patron = `*${q}*`;

  for (const layout of layouts) {
    const disponibles = await obtenerNombresCamposLayout(layout);
    const query = CAMPOS_BUSQUEDA_SINIESTRO.filter(
      (campo) => !disponibles.size || disponibles.has(campo)
    ).map((campo) => ({ [campo]: patron }));

    if (query.length === 0) {
      query.push({ NumeroSiniestro: patron });
    }

    try {
      const data = await findRecords(layout, { query, limit: String(limit) }, true);
      for (const record of (data?.response?.data ?? []) as FileMakerRecord[]) {
        const siniestro = mapearSiniestro(record);
        const clave = siniestro.recordId ?? siniestro.id;
        if (clave) porRecordId.set(clave, siniestro);
      }
    } catch {
      // Probar el siguiente layout.
    }
  }

  return [...porRecordId.values()];
}

type EstrategiaConteoAsignados =
  | { tipo: "ano"; campo: string }
  | { tipo: "fecha"; campo: string; formato: FormatoBusquedaAnioFecha };

let estrategiaConteoAsignadosCache: EstrategiaConteoAsignados | null = null;

function esErrorBusquedaFechaInvalida(data: unknown, error?: unknown): boolean {
  const messages =
    (data as { messages?: { code: string; message: string }[] } | undefined)?.messages ?? [];
  if (
    messages.some(
      (mensaje) =>
        mensaje.code === "500" ||
        mensaje.code === "400" ||
        /date value does not meet validation/i.test(mensaje.message)
    )
  ) {
    return true;
  }

  const texto = error instanceof Error ? error.message : "";
  return /500|date value does not meet validation|validation entry options/i.test(texto);
}

function leerFoundCount(data: unknown): number {
  const response = (
    data as { response?: { dataInfo?: { foundCount?: number }; data?: unknown[] } } | undefined
  )?.response;
  if (typeof response?.dataInfo?.foundCount === "number") return response.dataInfo.foundCount;
  return Array.isArray(response?.data) ? response.data.length : 0;
}

async function contarSiniestrosPorQuerySafe(
  query: Record<string, string>[]
): Promise<number | null> {
  try {
    const data = await findRecords(
      FM_CONFIG.layoutSiniestros,
      { query, limit: "1" },
      true
    );
    const code = String(data?.messages?.[0]?.code ?? "0");
    if (code === "401") return 0;
    if (code !== "0" && esErrorBusquedaFechaInvalida(data)) return null;
    if (code !== "0") return null;
    return leerFoundCount(data);
  } catch (error) {
    if (esErrorBusquedaFechaInvalida(undefined, error)) return null;
    throw error;
  }
}

function candidatosCampoAnoAsignacionSiniestro() {
  return [
    FM_CONFIG.siniestroCampoAnoAsignacion,
    "AnoEncargo",
    "AnoAsignacion",
    "Ano_Asignacion",
    "AnoAlta",
    "Ano",
  ].filter(Boolean);
}

function candidatosCampoFechaAsignacionSiniestro() {
  return [
    FM_CONFIG.siniestroCampoFechaAsignacion,
    "FechaEncargo",
    "Fecha_Encargo",
    "FechaAsignacion",
    "Fecha_Asignacion",
    "FechaAlta",
    "FechaRecepcion",
    "FechaApertura",
  ].filter(Boolean);
}

async function probarFormatoFechaCampo(
  campo: string,
  anioPrueba: number
): Promise<{ formato: FormatoBusquedaAnioFecha; total: number } | null> {
  for (const candidato of candidatosBusquedaAnioFecha(anioPrueba)) {
    if (candidato.formato === "mes-anio") continue;

    const total = await contarSiniestrosPorQuerySafe([{ [campo]: candidato.valor }]);
    if (total !== null) {
      return { formato: candidato.formato, total };
    }
  }

  let totalMeses = 0;
  for (let mes = 1; mes <= 12; mes += 1) {
    const totalMes = await contarSiniestrosPorQuerySafe([
      { [campo]: valorBusquedaMesAnioFecha(mes, anioPrueba) },
    ]);
    if (totalMes === null) return null;
    totalMeses += totalMes;
  }

  return { formato: "mes-anio", total: totalMeses };
}

async function detectarEstrategiaConteoAsignados(): Promise<EstrategiaConteoAsignados> {
  if (estrategiaConteoAsignadosCache) return estrategiaConteoAsignadosCache;

  const anioPrueba = new Date().getFullYear() - 1;
  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutSiniestros);

  const camposAno = candidatosCampoAnoAsignacionSiniestro().filter(
    (campo) => !disponibles.size || disponibles.has(campo)
  );
  const probesAno = await Promise.all(
    camposAno.map(async (campo) => ({
      tipo: "ano" as const,
      campo,
      total: await contarSiniestrosPorQuerySafe([{ [campo]: String(anioPrueba) }]),
    }))
  );
  const mejorAno = probesAno
    .filter((probe) => probe.total !== null && probe.total > 0)
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))[0];
  if (mejorAno) {
    estrategiaConteoAsignadosCache = { tipo: "ano", campo: mejorAno.campo };
    return estrategiaConteoAsignadosCache;
  }

  const camposFecha = candidatosCampoFechaAsignacionSiniestro().filter(
    (campo) => !disponibles.size || disponibles.has(campo)
  );
  const probesFecha = (
    await Promise.all(
      camposFecha.map(async (campo) => {
        const resultado = await probarFormatoFechaCampo(campo, anioPrueba);
        return resultado ? { campo, ...resultado } : null;
      })
    )
  ).filter(Boolean) as Array<{ campo: string; formato: FormatoBusquedaAnioFecha; total: number }>;

  const mejorFecha = probesFecha.sort((a, b) => b.total - a.total)[0];
  if (mejorFecha) {
    estrategiaConteoAsignadosCache = {
      tipo: "fecha",
      campo: mejorFecha.campo,
      formato: mejorFecha.formato,
    };
    return estrategiaConteoAsignadosCache;
  }

  throw new Error(
    "No se pudo determinar el campo de fecha de asignación en API_Siniestros. " +
      "Configura VITE_FM_SINIESTRO_CAMPO_FECHA_ASIGNACION o VITE_FM_SINIESTRO_CAMPO_ANO_ASIGNACION en .env.local"
  );
}

async function contarAsignadosAnio(
  estrategia: EstrategiaConteoAsignados,
  anio: number
): Promise<number> {
  if (estrategia.tipo === "ano") {
    return (await contarSiniestrosPorQuerySafe([{ [estrategia.campo]: String(anio) }])) ?? 0;
  }

  if (estrategia.formato === "mes-anio") {
    let total = 0;
    for (let mes = 1; mes <= 12; mes += 1) {
      const parcial = await contarSiniestrosPorQuerySafe([
        { [estrategia.campo]: valorBusquedaMesAnioFecha(mes, anio) },
      ]);
      if (parcial === null) return 0;
      total += parcial;
    }
    return total;
  }

  const valor = valorBusquedaAnioFecha(estrategia.formato, anio);
  return (
    (await contarSiniestrosPorQuerySafe([{ [estrategia.campo]: valor }])) ?? 0
  );
}

/** Totales anuales de siniestros asignados (conteo en FileMaker, sin descargar todos los registros). */
export async function listarAsignadosAnuales(
  anioDesde = 1995
): Promise<PuntoAsignadosAnual[]> {
  if (USE_MOCK) {
    await wait(150);
    return agruparAsignadosAnual(siniestrosMock);
  }

  const estrategia = await detectarEstrategiaConteoAsignados();
  const anioHasta = new Date().getFullYear();
  const anios = Array.from({ length: anioHasta - anioDesde + 1 }, (_, indice) => anioDesde + indice);

  const totales = await Promise.all(
    anios.map(async (anio) => ({
      anio,
      total: await contarAsignadosAnio(estrategia, anio),
    }))
  );

  return totales
    .filter((punto) => punto.total > 0)
    .sort((a, b) => b.anio - a.anio)
    .map((punto) => ({
      anio: punto.anio,
      etiqueta: String(punto.anio),
      total: punto.total,
    }));
}

type ConfigConteoMensualAsignados = {
  campoFecha: string;
  formatoMes: FormatoBusquedaAnioFecha;
};

let configConteoMensualAsignadosCache: ConfigConteoMensualAsignados | null = null;
let campoCompaniaSiniestroCache: string | null = null;

async function resolverCampoCompaniaSiniestro(): Promise<string> {
  if (campoCompaniaSiniestroCache) return campoCompaniaSiniestroCache;

  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutSiniestros);
  const candidatos = [
    FM_CONFIG.siniestroCampoCompania,
    "_kf_ID_Compania",
    "_kp_ID_Compania",
    "_kf_ID_Compañia",
  ].filter(Boolean);

  campoCompaniaSiniestroCache =
    candidatos.find((campo) => !disponibles.size || disponibles.has(campo)) ??
    "_kf_ID_Compania";

  return campoCompaniaSiniestroCache;
}

async function probarValorMesAsignados(
  campoFecha: string,
  mes: number,
  anio: number,
  valor: string
): Promise<number | null> {
  return contarSiniestrosPorQuerySafe([{ [campoFecha]: valor }]);
}

async function obtenerConfigConteoMensualAsignados(): Promise<ConfigConteoMensualAsignados> {
  if (configConteoMensualAsignadosCache) return configConteoMensualAsignadosCache;

  const anioPrueba = new Date().getFullYear();
  const mesPrueba = Math.max(1, new Date().getMonth() + 1);
  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutSiniestros);
  const camposFecha = candidatosCampoFechaAsignacionSiniestro().filter(
    (campo) => !disponibles.size || disponibles.has(campo)
  );

  for (const campo of camposFecha) {
    const formatos: FormatoBusquedaAnioFecha[] = [
      "mes-anio",
      "mdy-rango",
      "mdy-rango-corto",
      "iso-rango",
      "dmy-rango",
    ];
    for (const formato of formatos) {
      const valor = valorBusquedaRangoMes(mesPrueba, anioPrueba, formato);
      const total = await probarValorMesAsignados(campo, mesPrueba, anioPrueba, valor);
      if (total !== null) {
        configConteoMensualAsignadosCache = { campoFecha: campo, formatoMes: formato };
        return configConteoMensualAsignadosCache;
      }
    }
  }

  throw new Error(
    "No se pudo determinar el formato mensual de fecha en API_Siniestros. " +
      "Configura VITE_FM_SINIESTRO_CAMPO_FECHA_ASIGNACION en .env.local"
  );
}

function valorMesAsignados(
  config: ConfigConteoMensualAsignados,
  mes: number,
  anio: number
): string {
  return valorBusquedaRangoMes(mes, anio, config.formatoMes);
}

async function contarAsignadosMes(
  config: ConfigConteoMensualAsignados,
  mes: number,
  anio: number,
  idCompania?: string
): Promise<number> {
  const campoCompania = await resolverCampoCompaniaSiniestro();
  const query: Record<string, string> = {
    [config.campoFecha]: valorMesAsignados(config, mes, anio),
  };
  if (idCompania) query[campoCompania] = idCompania;
  return (await contarSiniestrosPorQuerySafe([query])) ?? 0;
}

async function contarDesgloseMesAsignados(
  config: ConfigConteoMensualAsignados,
  mes: number,
  anio: number
): Promise<DesgloseCompaniaAsignados> {
  const total = await contarAsignadosMes(config, mes, anio);
  const porCompania = await Promise.all(
    COMPANIAS_ASIGNADOS_SEGUIMIENTO.map((compania) =>
      contarAsignadosMes(config, mes, anio, compania.id)
    )
  );

  const desglose: DesgloseCompaniaAsignados = {
    total,
    cia0001: porCompania[0] ?? 0,
    cia0002: porCompania[1] ?? 0,
    cia0210: porCompania[2] ?? 0,
    cia0003: porCompania[3] ?? 0,
    cia0347: porCompania[4] ?? 0,
    resto: 0,
  };

  const sumaCompanias =
    desglose.cia0001 +
    desglose.cia0002 +
    desglose.cia0210 +
    desglose.cia0003 +
    desglose.cia0347;
  desglose.resto = Math.max(0, total - sumaCompanias);

  return desglose;
}

function generarMockAsignadosMensualesComparados(): PuntoAsignadosMensualComparado[] {
  const anioActual = new Date().getFullYear();
  const anioAnterior = anioActual - 1;

  return Array.from({ length: 12 }, (_, indice) => {
    const mes = indice + 1;
    const baseAnterior = 120 + mes * 8 + (mes % 3) * 15;
    const baseActual = 100 + mes * 9 + (mes % 4) * 12;

    const anterior: DesgloseCompaniaAsignados = {
      total: baseAnterior,
      cia0001: Math.round(baseAnterior * 0.22),
      cia0002: Math.round(baseAnterior * 0.18),
      cia0210: Math.round(baseAnterior * 0.14),
      cia0003: Math.round(baseAnterior * 0.12),
      cia0347: Math.round(baseAnterior * 0.1),
      resto: 0,
    };
    anterior.resto = Math.max(
      0,
      anterior.total -
        anterior.cia0001 -
        anterior.cia0002 -
        anterior.cia0210 -
        anterior.cia0003 -
        anterior.cia0347
    );

    const actual: DesgloseCompaniaAsignados = {
      total: baseActual,
      cia0001: Math.round(baseActual * 0.24),
      cia0002: Math.round(baseActual * 0.17),
      cia0210: Math.round(baseActual * 0.15),
      cia0003: Math.round(baseActual * 0.11),
      cia0347: Math.round(baseActual * 0.09),
      resto: 0,
    };
    actual.resto = Math.max(
      0,
      actual.total -
        actual.cia0001 -
        actual.cia0002 -
        actual.cia0210 -
        actual.cia0003 -
        actual.cia0347
    );

    if (mes === 1) {
      anterior.total = 206;
      actual.total = 180;
    }

    return {
      mes,
      etiqueta: nombreMes(mes),
      anioActual,
      anioAnterior,
      actual,
      anterior,
    };
  });
}

/** Comparativa mensual año actual vs anterior con desglose por compañía. */
export async function listarAsignadosMensualesComparados(): Promise<PuntoAsignadosMensualComparado[]> {
  if (USE_MOCK) {
    await wait(200);
    return generarMockAsignadosMensualesComparados();
  }

  const config = await obtenerConfigConteoMensualAsignados();
  const anioActual = new Date().getFullYear();
  const anioAnterior = anioActual - 1;

  return Promise.all(
    Array.from({ length: 12 }, async (_, indice) => {
      const mes = indice + 1;
      const [actual, anterior] = await Promise.all([
        contarDesgloseMesAsignados(config, mes, anioActual),
        contarDesgloseMesAsignados(config, mes, anioAnterior),
      ]);

      return {
        mes,
        etiqueta: nombreMes(mes),
        anioActual,
        anioAnterior,
        actual,
        anterior,
      };
    })
  );
}

type ConfigConteoDiarioAsignados = {
  campoFecha: string;
  valorDia: (dia: number, mes: number, anio: number) => string;
};

let configConteoDiarioAsignadosCache: ConfigConteoDiarioAsignados | null = null;

async function obtenerConfigConteoDiarioAsignados(): Promise<ConfigConteoDiarioAsignados> {
  if (configConteoDiarioAsignadosCache) return configConteoDiarioAsignadosCache;

  const mensual = await obtenerConfigConteoMensualAsignados();
  const hoy = new Date();
  const diaPrueba = hoy.getDate();
  const mesPrueba = hoy.getMonth() + 1;
  const anioPrueba = hoy.getFullYear();

  const candidatos = [
    valorBusquedaDia(diaPrueba, mesPrueba, anioPrueba, mensual.formatoMes),
    ...candidatosBusquedaDia(diaPrueba, mesPrueba, anioPrueba),
  ];

  for (const valor of [...new Set(candidatos)]) {
    const total = await contarSiniestrosPorQuerySafe([{ [mensual.campoFecha]: valor }]);
    if (total !== null) {
      configConteoDiarioAsignadosCache = {
        campoFecha: mensual.campoFecha,
        valorDia: (dia, mes, anio) => valorBusquedaDia(dia, mes, anio, mensual.formatoMes),
      };
      return configConteoDiarioAsignadosCache;
    }
  }

  throw new Error(
    "No se pudo determinar el formato diario de fecha en API_Siniestros. " +
      "Configura VITE_FM_SINIESTRO_CAMPO_FECHA_ASIGNACION en .env.local"
  );
}

async function contarAsignadosDia(
  config: ConfigConteoDiarioAsignados,
  dia: number,
  mes: number,
  anio: number,
  idCompania?: string
): Promise<number> {
  const campoCompania = await resolverCampoCompaniaSiniestro();
  const query: Record<string, string> = {
    [config.campoFecha]: config.valorDia(dia, mes, anio),
  };
  if (idCompania) query[campoCompania] = idCompania;
  return (await contarSiniestrosPorQuerySafe([query])) ?? 0;
}

async function contarDesgloseDiaAsignados(
  config: ConfigConteoDiarioAsignados,
  dia: number,
  mes: number,
  anio: number
): Promise<DesgloseCompaniaAsignados> {
  const total = await contarAsignadosDia(config, dia, mes, anio);
  const porCompania = await Promise.all(
    COMPANIAS_ASIGNADOS_SEGUIMIENTO.map((compania) =>
      contarAsignadosDia(config, dia, mes, anio, compania.id)
    )
  );

  const desglose: DesgloseCompaniaAsignados = {
    total,
    cia0001: porCompania[0] ?? 0,
    cia0002: porCompania[1] ?? 0,
    cia0210: porCompania[2] ?? 0,
    cia0003: porCompania[3] ?? 0,
    cia0347: porCompania[4] ?? 0,
    resto: 0,
  };

  const sumaCompanias =
    desglose.cia0001 +
    desglose.cia0002 +
    desglose.cia0210 +
    desglose.cia0003 +
    desglose.cia0347;
  desglose.resto = Math.max(0, total - sumaCompanias);

  return desglose;
}

function generarMockAsignadosDiariosMesEnCurso(): PuntoAsignadosDiario[] {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();
  const totalDias = diasEnMes(mes, anio);

  return Array.from({ length: totalDias }, (_, indice) => {
    const dia = indice + 1;
    const base = 4 + (dia % 5) * 2 + (dia % 7);
    const desglose: DesgloseCompaniaAsignados = {
      total: base,
      cia0001: Math.round(base * 0.25),
      cia0002: Math.round(base * 0.18),
      cia0210: Math.round(base * 0.12),
      cia0003: Math.round(base * 0.1),
      cia0347: Math.round(base * 0.08),
      resto: 0,
    };
    desglose.resto = Math.max(
      0,
      desglose.total -
        desglose.cia0001 -
        desglose.cia0002 -
        desglose.cia0210 -
        desglose.cia0003 -
        desglose.cia0347
    );

    return {
      dia,
      etiqueta: String(dia),
      mes,
      anio,
      desglose,
    };
  });
}

/** Asignados por día del mes en curso con desglose Occident / Resto. */
export async function listarAsignadosDiariosMesEnCurso(): Promise<PuntoAsignadosDiario[]> {
  if (USE_MOCK) {
    await wait(200);
    return generarMockAsignadosDiariosMesEnCurso();
  }

  const config = await obtenerConfigConteoDiarioAsignados();
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();
  const totalDias = diasEnMes(mes, anio);

  return Promise.all(
    Array.from({ length: totalDias }, async (_, indice) => {
      const dia = indice + 1;
      const desglose = await contarDesgloseDiaAsignados(config, dia, mes, anio);

      return {
        dia,
        etiqueta: String(dia),
        mes,
        anio,
        desglose,
      };
    })
  );
}

export async function listarAsegurados(limit = 100): Promise<Asegurado[]> { if (USE_MOCK) { await wait(250); return [aseguradoMock]; } return (await listarRegistrosLayout(FM_CONFIG.layoutAsegurados, limit)).map(mapearAsegurado); }
export async function obtenerAsegurado(idAsegurado?: string): Promise<Asegurado | null> {
  if (!idAsegurado) return null;
  if (USE_MOCK) {
    await wait(250);
    return aseguradoMock.id === idAsegurado || aseguradoMock.recordId === idAsegurado ? aseguradoMock : null;
  }

  const data = await findRecords(FM_CONFIG.layoutAsegurados, { query: [{ _kp_ID_Asegurado: idAsegurado }], limit: "1" }, true);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  if (record) return mapearAsegurado(record);

  return obtenerAseguradoPorRecordId(idAsegurado).catch(() => null);
}
async function obtenerAseguradoPorRecordId(recordId: string): Promise<Asegurado | null> { const data = await fmRequest(FM_CONFIG.layoutAsegurados, `/records/${encodeURIComponent(recordId)}`); const record = data?.response?.data?.[0] as FileMakerRecord | undefined; return record ? mapearAsegurado(record) : null; }
export async function buscarAsegurados(texto: string): Promise<Asegurado[]> { const q = texto.trim(); if (!q) return []; if (USE_MOCK) { await wait(200); return [aseguradoMock].filter((a) => [a.displayName, a.nif, a.direccionCompleta, a.poblacion, a.provincia].join(" ").toLowerCase().includes(q.toLowerCase())); } const body = { query: [{ NIF: `*${q}*` }, { NombreCompleto: `*${q}*` }, { RazonSocial: `*${q}*` }, { DireccCompleta: `*${q}*` }, { Poblacion: `*${q}*` }], limit: "100" }; const data = await findRecords(FM_CONFIG.layoutAsegurados, body, true); return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearAsegurado); }

export async function crearAsegurado(asegurado: Asegurado): Promise<Asegurado> {
  if (USE_MOCK) {
    await wait(300);
    return completarAseguradoLocal({
      ...asegurado,
      id: asegurado.id || `Asegurado_${Date.now()}`,
      recordId: `${Date.now()}`,
    });
  }

  const fieldData = await aseguradoFieldDataParaLayout(asegurado);
  const data = await postAseguradoConReintento(fieldData);
  const recordId = String(data?.response?.recordId ?? "");
  const remoto = recordId ? await obtenerAseguradoPorRecordId(recordId) : null;
  return remoto
    ? fusionarAseguradoTrasGuardar(remoto, asegurado)
    : completarAseguradoLocal({ ...asegurado, recordId });
}

export async function actualizarAsegurado(asegurado: Asegurado): Promise<Asegurado> {
  if (!asegurado.recordId) throw new Error("No se puede actualizar: falta recordId del asegurado");
  if (USE_MOCK) {
    await wait(300);
    return completarAseguradoLocal(asegurado);
  }

  const fieldData = await aseguradoFieldDataParaLayout(asegurado);
  await patchAseguradoConReintento(asegurado.recordId, fieldData);
  const remoto = await obtenerAseguradoPorRecordId(asegurado.recordId);
  return remoto
    ? fusionarAseguradoTrasGuardar(remoto, asegurado)
    : completarAseguradoLocal(asegurado);
}

export async function obtenerContactosAsegurado(idAsegurado?: string): Promise<ContactoAsegurado[]> { if (!idAsegurado) return []; if (USE_MOCK) { await wait(150); return contactosAseguradoMock; } const data = await findRecords(FM_CONFIG.layoutContactosAsegurado, { query: [{ _kf_ID_Asegurado: idAsegurado }], limit: "100" }, true); return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearContactoAsegurado); }
export async function crearContactoAsegurado(contacto: ContactoAsegurado): Promise<ContactoAsegurado> { if (!contacto.idAsegurado) throw new Error("Falta el asegurado relacionado"); const nuevo = { ...contacto, id: contacto.id || `ContactoAseg_${Date.now()}` }; if (USE_MOCK) { await wait(200); return { ...nuevo, nombreCompleto: calcularNombreContacto(nuevo) }; } const data = await fmRequest(FM_CONFIG.layoutContactosAsegurado, "/records", { method: "POST", body: JSON.stringify({ fieldData: contactoToFieldData(nuevo, true) }) }); const recordId = String(data?.response?.recordId ?? ""); return (recordId ? await obtenerContactoPorRecordId(recordId) : null) ?? { ...nuevo, nombreCompleto: calcularNombreContacto(nuevo) }; }
export async function actualizarContactoAsegurado(contacto: ContactoAsegurado): Promise<ContactoAsegurado> { const recordId = await resolverRecordIdContacto(contacto); if (!recordId) throw new Error("No se puede actualizar: no se localiza el recordId del contacto"); if (USE_MOCK) { await wait(200); return { ...contacto, nombreCompleto: calcularNombreContacto(contacto) }; } await fmRequest(FM_CONFIG.layoutContactosAsegurado, `/records/${recordId}`, { method: "PATCH", body: JSON.stringify({ fieldData: contactoToFieldData(contacto, false) }) }); return (await obtenerContactoPorRecordId(recordId)) ?? { ...contacto, nombreCompleto: calcularNombreContacto(contacto) }; }
export async function borrarContactoAsegurado(contacto: ContactoAsegurado): Promise<void> { const recordId = await resolverRecordIdContacto(contacto); if (!recordId) throw new Error("No se puede borrar: no se localiza el recordId del contacto"); if (USE_MOCK) { await wait(200); return; } await fmRequest(FM_CONFIG.layoutContactosAsegurado, `/records/${recordId}`, { method: "DELETE" }); }
async function resolverRecordIdContacto(contacto: ContactoAsegurado): Promise<string> { if (contacto.recordId) return contacto.recordId; if (USE_MOCK) return contacto.id; const data = await findRecords(FM_CONFIG.layoutContactosAsegurado, { query: [{ _kp_ID_ContactoAseg: contacto.id }], limit: "1" }, true); return String(data?.response?.data?.[0]?.recordId ?? ""); }
async function obtenerContactoPorRecordId(recordId: string): Promise<ContactoAsegurado | null> { const data = await fmRequest(FM_CONFIG.layoutContactosAsegurado, `/records/${recordId}`); const record = data?.response?.data?.[0] as FileMakerRecord | undefined; return record ? mapearContactoAsegurado(record) : null; }

export async function obtenerPolizasAsegurado(idAsegurado?: string): Promise<Poliza[]> { if (!idAsegurado) return []; if (USE_MOCK) { await wait(150); return polizasMock; } const data = await findRecords(FM_CONFIG.layoutPolizas, { query: [{ _kf_ID_Asegurado: idAsegurado }], limit: "100" }, true); const polizas = ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearPoliza); return Promise.all(polizas.map(enriquecerPoliza)); }

const CAMPOS_BUSQUEDA_POLIZA = [
  "NumeroPoliza",
  "NumeroPol",
  "Poliza",
  "Asegurado",
  "Compania",
  "Compañia",
  "Ramo",
  "TipoRamo",
  "zVistaDireccionLinea",
  "DireccionCompleta",
  "DireccCompleta",
] as const;

export function polizaCoincideTexto(poliza: Poliza, texto: string) {
  const q = texto.trim().toLowerCase();
  if (!q) return false;
  return [poliza.numeroPoliza, poliza.asegurado, poliza.compania, poliza.ramo, poliza.tipoRamo, poliza.direccionCompleta]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export async function buscarPolizas(texto: string): Promise<Poliza[]> {
  const q = texto.trim();
  if (!q) return [];

  if (USE_MOCK) {
    await wait(200);
    return polizasMock.filter((p) => polizaCoincideTexto(p, q));
  }

  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutPolizas);
  const patron = `*${q}*`;
  const query = CAMPOS_BUSQUEDA_POLIZA.filter(
    (campo) => !disponibles.size || disponibles.has(campo)
  ).map((campo) => ({ [campo]: patron }));

  if (query.length === 0) {
    query.push({ NumeroPoliza: patron });
  }

  const data = await findRecords(
    FM_CONFIG.layoutPolizas,
    { query, limit: "100" },
    true
  );
  const polizas = ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearPoliza);
  return Promise.all(polizas.map(enriquecerPoliza));
}

export async function listarRamos(limit = 200): Promise<Ramo[]> {
  if (USE_MOCK) return [];
  const records = await listarRegistrosLayout(FM_CONFIG.layoutRamos, limit);
  return records.map(mapearRamo);
}

export async function listarCompanias(limit = 200): Promise<Compania[]> {
  if (USE_MOCK) return [];
  const records = await listarRegistrosLayout(FM_CONFIG.layoutCompanias, limit);
  return records.map(mapearCompania);
}

export async function crearPoliza(poliza: Poliza): Promise<Poliza> {
  if (!poliza.idAsegurado) throw new Error("Falta el asegurado relacionado");

  if (USE_MOCK) {
    await wait(250);
    return {
      ...poliza,
      id: poliza.id || `Poliza_${Date.now()}`,
      recordId: `${Date.now()}`,
    };
  }

  const data = await postPolizaConReintento(await polizaFieldDataParaLayout(poliza, true, true));

  const recordId = String(data?.response?.recordId ?? "");
  if (recordId) {
    await guardarCamposDireccionCatastroPoliza(recordId, poliza);
  }

  const creada = recordId ? await obtenerPolizaPorRecordId(recordId) : null;
  const base = creada ?? { ...poliza, recordId };
  return fusionarPolizaTrasGuardar(base, poliza);
}

export async function actualizarPoliza(poliza: Poliza): Promise<Poliza> {
  if (!poliza.recordId) throw new Error("No se puede actualizar: falta recordId de la póliza");

  if (USE_MOCK) {
    await wait(250);
    return poliza;
  }

  const fieldData = await filtrarFieldDataParaEscritura(
    FM_CONFIG.layoutPolizas,
    await polizaFieldDataParaLayout(poliza, false, true)
  );
  try {
    await patchPolizaConReintento(poliza.recordId, fieldData);
  } catch (error) {
    if (!isFieldSkippablePatchError(error)) throw error;
    await patchPolizaCampoPorCampo(poliza.recordId, fieldData);
  }

  await guardarCamposDireccionCatastroPoliza(poliza.recordId, poliza);

  const recargada = await obtenerPolizaPorRecordId(poliza.recordId).catch(() => null);
  return fusionarPolizaTrasGuardar(recargada ?? poliza, poliza);
}

const mockDetallesCatastro = new Map<string, DetalleCatastroDesdeCatastro>();
const mockDetallesCatastroParcela = new Map<string, InmuebleParcelaCatastro>();
const mockDetalleContinente = new Map<string, DetalleContinente>();
const mockTipologiasContinente: TipologiaContinente[] = [
  { id: "TIPO-1", recordId: "1", nombre: "Edificación principal", precio: "600" },
  { id: "TIPO-2", recordId: "2", nombre: "Nave industrial", precio: "450" },
  { id: "TIPO-3", recordId: "3", nombre: "Local comercial", precio: "500" },
  { id: "TIPO-4", recordId: "4", nombre: "Construcciones anexas", precio: "" },
];
const layoutCamposCache = new Map<string, Set<string>>();
const layoutCamposMetaCache = new Map<string, LayoutCampoMeta[]>();
const valorListaPropiedadCache = new Map<string, string[]>();

type LayoutCampoMeta = { name: string; type?: string; valueList?: string };

/** Campos de póliza calculados en FileMaker: se leen pero no se envían en PATCH. */
const POLIZA_CAMPOS_CALCULADOS = new Set([
  "TotalContinente",
  "CteVN",
  "CteVR",
  "CtdoVR",
  "MobYMaqVR",
  "CoefInfraCte",
  "CoefInfraCteVR",
  "CoefInfraCtdo",
  "CoefInfraCtdoVR",
  "CoefInfraMobYMaqVN",
  "CoefInfraMobYMaqVR",
  "CoefInfraExistencias",
  "CoefInfraEmbarcacion",
  "InfraseguroCrawfordCte",
  "InfraseguroCrawfordCtdo",
  "InfraseguroCrawfordMob",
  "InfraseguroCrawfordExist",
]);

type FileMakerValueListItem = {
  displayValue?: string;
  value?: string;
};

type FileMakerValueListMeta = {
  name: string;
  type?: string;
  values?: FileMakerValueListItem[] | Record<string, FileMakerValueListItem>;
};

const MOCK_VALORES_PROPIEDAD = ["Propietario", "Inquilino"];

function normalizarColeccionMeta<T>(raw: unknown, esValido: (item: unknown) => item is T): T[] {
  if (Array.isArray(raw)) return raw.filter(esValido);
  if (raw && typeof raw === "object") {
    return Object.values(raw).filter(esValido);
  }
  return [];
}

function esMetaCampoLayout(item: unknown): item is LayoutCampoMeta {
  return Boolean(
    item &&
      typeof item === "object" &&
      "name" in item &&
      typeof (item as { name?: unknown }).name === "string"
  );
}

function normalizarMetadatosCamposLayout(raw: unknown): LayoutCampoMeta[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .filter(esMetaCampoLayout)
      .map((item) => ({
        name: item.name.trim(),
        type: textoCampo(item.type) || undefined,
        valueList: textoCampo(item.valueList) || undefined,
      }))
      .filter((item) => item.name);
  }

  if (typeof raw === "object") {
    return Object.entries(raw)
      .map(([key, value]) => {
        if (value && typeof value === "object" && "name" in value) {
          const item = value as LayoutCampoMeta;
          const nombre = textoCampo(item.name).trim();
          if (!nombre) return null;
          return {
            name: nombre,
            type: textoCampo(item.type) || undefined,
            valueList: textoCampo(item.valueList) || undefined,
          };
        }
        if (!/^\d+$/.test(key)) {
          return { name: key.trim() };
        }
        return null;
      })
      .filter((item): item is LayoutCampoMeta => Boolean(item?.name));
  }

  return [];
}

function esCampoModificableFm(meta: LayoutCampoMeta): boolean {
  const type = (meta.type ?? "normal").toLowerCase();
  return type !== "calculation" && type !== "summary";
}

function excluirCamposPolizaCalculados(fieldData: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(fieldData).filter(([campo]) => !POLIZA_CAMPOS_CALCULADOS.has(campo))
  );
}

function filtrarFieldDataModificables(
  fieldData: Record<string, string>,
  modificables: Set<string>
) {
  if (modificables.size === 0) return fieldData;
  return Object.fromEntries(
    Object.entries(fieldData).filter(([campo]) => modificables.has(campo))
  );
}

async function filtrarFieldDataParaEscritura(layout: string, fieldData: Record<string, string>) {
  const sinCalculados = excluirCamposPolizaCalculados(fieldData);
  const metas = await obtenerMetadatosCamposLayout(layout);
  if (metas.length === 0) return sinCalculados;

  const modificables = new Set(metas.filter(esCampoModificableFm).map((meta) => meta.name));
  return filtrarFieldDataModificables(sinCalculados, modificables);
}

function normalizarValueLists(raw: unknown): FileMakerValueListMeta[] {
  if (!raw || typeof raw !== "object") return [];

  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is FileMakerValueListMeta => Boolean(item && typeof item === "object"))
      .map((item) => ({
        ...item,
        name: textoCampo(item.name) || textoCampo((item as { Name?: string }).Name),
      }))
      .filter((item) => item.name);
  }

  return Object.entries(raw).map(([key, value]) => {
    const item = (value && typeof value === "object" ? value : {}) as FileMakerValueListMeta;
    return {
      ...item,
      name: textoCampo(item.name) || key,
    };
  });
}

function normalizarItemsListaValores(values?: FileMakerValueListMeta["values"] | string[]): FileMakerValueListItem[] {
  if (!values) return [];
  if (Array.isArray(values)) {
    return values.map((item) =>
      typeof item === "string" ? { value: item, displayValue: item } : item
    );
  }
  if (typeof values === "object") return Object.values(values);
  return [];
}

function extraerValoresListaFileMaker(lista?: FileMakerValueListMeta): string[] {
  return Array.from(
    new Set(
      normalizarItemsListaValores(lista?.values)
        .flatMap((item) => {
          if (typeof item === "string") return [textoCampo(item)];
          return [textoCampo(item.value), textoCampo(item.displayValue)];
        })
        .filter(Boolean)
    )
  );
}

function nombresListaPropietarioCandidatos(data: unknown): string[] {
  const fieldMetaData = (data as { response?: { fieldMetaData?: unknown } } | undefined)?.response?.fieldMetaData;
  const campos = normalizarColeccionMeta(fieldMetaData, esMetaCampoLayout);
  const campoPropietario = FM_CONFIG.polizaCampoPropietario.trim();
  const propietario = campos.find(
    (campo) =>
      campo.name === campoPropietario ||
      campo.name.toLowerCase() === campoPropietario.toLowerCase()
  );
  const desdeCampo = textoCampo(propietario?.valueList);

  return Array.from(
    new Set(
      [
        desdeCampo,
        FM_CONFIG.polizaValuelistPropiedad,
        FM_CONFIG.polizaCampoPropietario,
        ...FM_CONFIG.polizaValuelistsPropietario,
      ]
        .map((nombre) => nombre.trim())
        .filter(Boolean)
    )
  );
}

function buscarListaValoresFileMaker(
  valueListsRaw: unknown,
  nombrePreferido: string
): FileMakerValueListMeta | undefined {
  const valueLists = normalizarValueLists(valueListsRaw);
  const preferido = nombrePreferido.trim();
  if (!preferido) return undefined;

  const exacta = valueLists.find((lista) => lista.name === preferido);
  if (exacta) return exacta;

  const insensible = valueLists.find(
    (lista) => lista.name.toLowerCase() === preferido.toLowerCase()
  );
  if (insensible) return insensible;

  return valueLists.find((lista) => /propiedad|propietario/i.test(lista.name));
}

function resolverListaPropietarioEnMetadata(
  valueListsRaw: unknown,
  data: unknown
): { lista?: FileMakerValueListMeta; valores: string[] } {
  const valueLists = normalizarValueLists(valueListsRaw);
  const candidatos = nombresListaPropietarioCandidatos(data);

  for (const nombre of candidatos) {
    const lista = buscarListaValoresFileMaker(valueListsRaw, nombre);
    const valores = extraerValoresListaFileMaker(lista);
    if (valores.length > 0) return { lista, valores };
  }

  for (const lista of valueLists) {
    const valores = extraerValoresListaFileMaker(lista);
    if (valores.some((valor) => /propietario|inquilino/i.test(valor))) {
      return { lista, valores };
    }
  }

  const unicaConValores = valueLists
    .map((lista) => ({ lista, valores: extraerValoresListaFileMaker(lista) }))
    .filter((item) => item.valores.length > 0);

  if (unicaConValores.length === 1) {
    return unicaConValores[0];
  }

  return { valores: [] };
}

async function leerValoresListaPropiedadDesdeMetadata(recordId?: string): Promise<string[]> {
  const path = recordId ? `?recordId=${encodeURIComponent(recordId)}` : "";
  const data = await fmRequest(FM_CONFIG.layoutPolizas, path);
  const response = (data as { response?: { fieldMetaData?: unknown; valueLists?: unknown } } | undefined)?.response;
  const { lista, valores } = resolverListaPropietarioEnMetadata(response?.valueLists, data);

  debug(`Lista Propietario (${FM_CONFIG.layoutPolizas})`, {
    recordId: recordId ?? "(sin recordId)",
    candidatos: nombresListaPropietarioCandidatos(data),
    listaEncontrada: lista?.name,
    tipoLista: lista?.type,
    totalValores: valores.length,
    valores,
    listasDisponibles: normalizarValueLists(response?.valueLists).map((vl) => ({
      name: vl.name,
      type: vl.type,
      total: extraerValoresListaFileMaker(vl).length,
    })),
  });

  return valores;
}

async function listarValoresPropietarioDesdeRegistrosPoliza(): Promise<string[]> {
  const records = await listarRegistrosLayout(FM_CONFIG.layoutPolizas, 500);
  const valores = new Set<string>();
  const campo = FM_CONFIG.polizaCampoPropietario;

  for (const record of records) {
    const valor = getFirstValue(record.fieldData, [campo, "Propietario", "propietario"]);
    const texto = textoCampo(valor);
    if (texto) valores.add(texto);
  }

  return [...valores].sort((a, b) => a.localeCompare(b, "es"));
}

async function recordIdPlantillaPoliza(): Promise<string | undefined> {
  const records = await listarRegistrosLayout(FM_CONFIG.layoutPolizas, 1);
  return records[0]?.recordId;
}

/** Limpia caché de metadata/campos del layout API_Polizas (p. ej. tras cambios en FileMaker). */
export function invalidarCacheMetadataPolizas(): void {
  layoutCamposCache.delete(FM_CONFIG.layoutPolizas);
  layoutCamposMetaCache.delete(FM_CONFIG.layoutPolizas);
  valorListaPropiedadCache.clear();
}

/** Valores de la lista FileMaker «Propiedad» (campo Propietario en API_Polizas). */
export async function listarValoresListaPropiedadPoliza(
  recordId?: string,
  opciones?: { forzarRecarga?: boolean }
): Promise<string[]> {
  const cacheKey = `${FM_CONFIG.layoutPolizas}:${recordId ?? ""}:${FM_CONFIG.polizaValuelistPropiedad}`;
  if (opciones?.forzarRecarga) {
    valorListaPropiedadCache.delete(cacheKey);
  }
  const cached = valorListaPropiedadCache.get(cacheKey);
  if (cached && cached.length > 0) return cached;

  if (USE_MOCK) {
    await wait(100);
    valorListaPropiedadCache.set(cacheKey, MOCK_VALORES_PROPIEDAD);
    return MOCK_VALORES_PROPIEDAD;
  }

  const intentosRecordId = new Set<string | undefined>();
  if (recordId) intentosRecordId.add(recordId);
  else {
    try {
      const plantilla = await recordIdPlantillaPoliza();
      if (plantilla) intentosRecordId.add(plantilla);
    } catch (error) {
      debug("No se pudo obtener recordId plantilla para lista Propiedad", error);
    }
  }
  intentosRecordId.add(undefined);

  for (const rid of intentosRecordId) {
    try {
      const valores = await leerValoresListaPropiedadDesdeMetadata(rid);
      if (valores.length > 0) {
        valorListaPropiedadCache.set(cacheKey, valores);
        return valores;
      }
    } catch (error) {
      debug(`Error leyendo metadata lista Propiedad (recordId=${rid ?? "—"})`, error);
    }
  }

  try {
    const fallback = await listarValoresPropietarioDesdeRegistrosPoliza();
    if (fallback.length > 0) {
      valorListaPropiedadCache.set(cacheKey, fallback);
      return fallback;
    }
  } catch (error) {
    debug("No se pudo obtener Propietario desde registros de póliza", error);
  }

  const fallback = FM_CONFIG.polizaValoresPropietarioFallback;
  if (fallback.length > 0) {
    valorListaPropiedadCache.set(cacheKey, fallback);
    return fallback;
  }

  return [];
}

type DetalleCatastroCamposLayout = {
  fkPoliza: string;
  uso: string;
  superficie: string;
  ref?: string;
};

let detalleCatastroCamposCache: DetalleCatastroCamposLayout | null = null;

async function obtenerMetadatosCamposLayout(layout: string): Promise<LayoutCampoMeta[]> {
  const cached = layoutCamposMetaCache.get(layout);
  if (cached) return cached;

  try {
    const data = await fmRequest(layout, "");
    const meta = (data?.response as { fieldMetaData?: unknown } | undefined)?.fieldMetaData;
    const campos = normalizarMetadatosCamposLayout(meta);

    layoutCamposMetaCache.set(layout, campos);
    layoutCamposCache.set(layout, new Set(campos.map((campo) => campo.name)));
    return campos;
  } catch (error) {
    debug(`No se pudo leer metadata del layout ${layout}`, error);
    return [];
  }
}

async function obtenerNombresCamposLayout(layout: string): Promise<Set<string>> {
  const cached = layoutCamposCache.get(layout);
  if (cached) return cached;

  const campos = await obtenerMetadatosCamposLayout(layout);
  return new Set(campos.map((campo) => campo.name));
}

function elegirNombreCampo(disponibles: Set<string>, candidatos: string[]) {
  const encontrado = candidatos.find((nombre) => disponibles.has(nombre));
  if (encontrado) return encontrado;
  if (disponibles.size === 0) return candidatos[0];
  return undefined;
}

async function filtrarFieldDataLayout(layout: string, fieldData: Record<string, string>) {
  const disponibles = await obtenerNombresCamposLayout(layout);
  if (disponibles.size === 0) return fieldData;

  const filtrado = filtrarFieldDataPorLayout(fieldData, disponibles);

  if (Object.keys(filtrado).length === 0) {
    throw new Error(
      `Ningún campo enviado existe en el layout ${layout}. Campos del layout: ${[...disponibles].slice(0, 40).join(", ")}`
    );
  }

  return filtrado;
}

const POLIZA_CAMPOS_ALIASES: Record<string, string[]> = {
  CodPostalC: [FM_CONFIG.polizaCampoCodPostalC, "CodPostalC", "CodigoPostalC"],
  PoblacionC: ["PoblacionC", "Poblacion_C", "PoblacionCatastro"],
  CodigoMunicipioCatastro: [
    "polizas_CAT_CODIGO_MUNICIPIOS::Codigo",
    "polizas_CAT_CODIGO_MUNICIPIOS:Codigo",
    "Polizas_CAT_CODIGO_MUNICIPIOS::Codigo",
    "CAT_CODIGO_MUNICIPIOS::Codigo",
  ],
  ProvinciaC: ["ProvinciaC", "Provincia_C", "ProvinciaCatastro"],
  ViaC: ["ViaC", "Via_C", "TipoViaC"],
  DireccionC: ["DireccionC", "Direccion_C"],
  NombreViaC: ["NombreViaC", "Nombre_ViaC"],
  NumeroCalleC: ["NumeroCalleC", "Numero_CalleC", "NumeroC"],
  BloqueC: ["BloqueC", "Bloque_C"],
  EscaleraC: ["EscaleraC", "Escalera_C"],
  PlantaC: ["PlantaC", "Planta_C"],
  PuertaC: ["PuertaC", "Puerta_C"],
  Catastro: ["Catastro", "ReferenciaCatastral", "RefCatastral"],
  AnoConstruccion: ["AnoConstruccion", "AñoConstruccion", "Ano_Construccion"],
  UsosParcelaJSON: [
    FM_CONFIG.polizaCampoUsosParcelaJson,
    "UsosParcelaJSON",
    "UsosParcelaJson",
  ],
  UsosJSON: ["UsosJSON", "UsosJson"],
  SupConstruidaTotal: [
    FM_CONFIG.polizaCampoSupConstruidaTotal,
    "SupConstruidaTotal",
  ],
};

type CampoCatastroPoliza = {
  getValor: (poliza: Poliza) => unknown;
  nombresFm: string[];
};

function camposDireccionCatastroPoliza(poliza: Poliza): CampoCatastroPoliza[] {
  return [
    { getValor: (p) => p.codigoPostalC, nombresFm: nombresCodPostalCPoliza() },
    { getValor: (p) => p.poblacionC, nombresFm: nombresPoblacionCPoliza() },
    { getValor: (p) => p.provinciaC, nombresFm: nombresProvinciaCPoliza() },
    { getValor: (p) => p.nombreViaC, nombresFm: nombresNombreViaCPoliza() },
    { getValor: (p) => p.viaC, nombresFm: nombresViaCPoliza() },
    { getValor: (p) => p.direccionC, nombresFm: nombresDireccionCPoliza() },
    { getValor: (p) => p.numeroCalleC, nombresFm: nombresNumeroCalleCPoliza() },
    { getValor: (p) => p.bloqueC, nombresFm: nombresBloqueCPoliza() },
    { getValor: (p) => p.escaleraC, nombresFm: nombresEscaleraCPoliza() },
    { getValor: (p) => p.plantaC, nombresFm: nombresPlantaCPoliza() },
    { getValor: (p) => p.puertaC, nombresFm: nombresPuertaCPoliza() },
    { getValor: (p) => p.catastro, nombresFm: nombresCatastroPoliza() },
    { getValor: (p) => p.anoConstruccion, nombresFm: nombresAnoConstruccionPoliza() },
    { getValor: (p) => p.supConstruidaTotal, nombresFm: POLIZA_CAMPOS_ALIASES.SupConstruidaTotal },
  ];
}

function fusionarPolizaTrasGuardar(guardada: Poliza, enviada: Poliza): Poliza {
  const preferir = (remoto: unknown, local: unknown) => textoCampo(remoto) || textoCampo(local);

  return {
    ...guardada,
    codigoPostalC: preferir(guardada.codigoPostalC, enviada.codigoPostalC),
    poblacionC: preferir(guardada.poblacionC, enviada.poblacionC),
    provinciaC: preferir(guardada.provinciaC, enviada.provinciaC),
    nombreViaC: preferir(guardada.nombreViaC, enviada.nombreViaC),
    viaC: preferir(guardada.viaC, enviada.viaC),
    direccionC: preferir(guardada.direccionC, enviada.direccionC),
    numeroCalleC: preferir(guardada.numeroCalleC, enviada.numeroCalleC),
    bloqueC: preferir(guardada.bloqueC, enviada.bloqueC),
    escaleraC: preferir(guardada.escaleraC, enviada.escaleraC),
    plantaC: preferir(guardada.plantaC, enviada.plantaC),
    puertaC: preferir(guardada.puertaC, enviada.puertaC),
    catastro: preferir(guardada.catastro, enviada.catastro),
    anoConstruccion: preferir(guardada.anoConstruccion, enviada.anoConstruccion),
    supConstruidaTotal: preferir(guardada.supConstruidaTotal, enviada.supConstruidaTotal),
    totalSuperficie: preferir(
      guardada.totalSuperficie,
      enviada.totalSuperficie ?? enviada.supConstruidaTotal
    ),
  };
}

async function patchPolizaConReintento(recordId: string, fieldData: Record<string, string>) {
  try {
    await fmRequest(FM_CONFIG.layoutPolizas, `/records/${encodeURIComponent(recordId)}`, {
      method: "PATCH",
      body: JSON.stringify({ fieldData }),
    });
    return;
  } catch (error) {
    if (!isFieldSkippablePatchError(error)) throw error;

    const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutPolizas);
    const reducido = await filtrarFieldDataParaEscritura(
      FM_CONFIG.layoutPolizas,
      disponibles.size > 0 ? filtrarFieldDataPorLayout(fieldData, disponibles) : fieldData
    );

    if (Object.keys(reducido).length === 0) throw error;

    try {
      await fmRequest(FM_CONFIG.layoutPolizas, `/records/${encodeURIComponent(recordId)}`, {
        method: "PATCH",
        body: JSON.stringify({ fieldData: reducido }),
      });
      return;
    } catch (retryError) {
      if (!isFieldSkippablePatchError(retryError)) throw retryError;
      await patchPolizaCampoPorCampo(recordId, reducido);
    }
  }
}

async function postPolizaConReintento(fieldData: Record<string, string>) {
  try {
    return await fmRequest(FM_CONFIG.layoutPolizas, "/records", {
      method: "POST",
      body: JSON.stringify({ fieldData }),
    });
  } catch (error) {
    if (!isFieldMissingError(error)) throw error;

    const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutPolizas);
    const reducido =
      disponibles.size > 0 ? filtrarFieldDataPorLayout(fieldData, disponibles) : fieldData;

    if (Object.keys(reducido).length === 0) throw error;

    return fmRequest(FM_CONFIG.layoutPolizas, "/records", {
      method: "POST",
      body: JSON.stringify({ fieldData: reducido }),
    });
  }
}

async function patchPolizaCampoPorCampo(recordId: string, fieldData: Record<string, string>) {
  const fallos: string[] = [];

  for (const [campo, valor] of Object.entries(fieldData)) {
    try {
      await fmRequest(FM_CONFIG.layoutPolizas, `/records/${encodeURIComponent(recordId)}`, {
        method: "PATCH",
        body: JSON.stringify({ fieldData: { [campo]: valor } }),
      });
    } catch (error) {
      if (isFieldSkippablePatchError(error)) {
        fallos.push(campo);
        continue;
      }
      throw error;
    }
  }

  if (fallos.length === Object.keys(fieldData).length) {
    throw new Error(
      `No se pudo guardar la póliza en FileMaker. Campos no válidos en ${FM_CONFIG.layoutPolizas}: ${fallos.join(", ")}`
    );
  }
}

async function polizaFieldDataParaLayout(
  poliza: Poliza,
  includeRelation: boolean,
  enviarVacios = false
): Promise<Record<string, string>> {
  const base = polizaToFieldData(poliza, includeRelation, enviarVacios);
  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutPolizas);
  if (disponibles.size === 0) return base;

  const mapped = { ...filtrarFieldDataPorLayout(base, disponibles) };
  const v = (value?: unknown) => {
    const text = textoCampo(value);
    return enviarVacios ? text : text || undefined;
  };

  for (const campo of camposDireccionCatastroPoliza(poliza)) {
    const valor = textoCampo(campo.getValor(poliza));
    if (!valor && !enviarVacios) continue;
    const fm = elegirNombreCampo(disponibles, campo.nombresFm) ?? campo.nombresFm[0];
    mapped[fm] = enviarVacios ? valor : valor;
  }

  for (const [origen, candidatos] of Object.entries(POLIZA_CAMPOS_ALIASES)) {
    if (candidatos.some((nombre) => nombre in mapped)) continue;
    const valor = base[origen];
    if (valor === undefined && !enviarVacios) continue;
    const nombre = elegirNombreCampo(disponibles, candidatos);
    if (nombre && !(nombre in mapped)) {
      mapped[nombre] = v(valor) ?? "";
    }
  }

  const filtered = filtrarFieldDataPorLayout(mapped, disponibles);

  for (const campo of camposDireccionCatastroPoliza(poliza)) {
    const valor = textoCampo(campo.getValor(poliza));
    if (!valor && !enviarVacios) continue;
    const fm = elegirNombreCampo(disponibles, campo.nombresFm) ?? campo.nombresFm[0];
    filtered[fm] = valor;
  }

  return await filtrarFieldDataParaEscritura(
    FM_CONFIG.layoutPolizas,
    filtered
  );
}

function filtrarFieldDataPorLayout(fieldData: Record<string, string>, disponibles: Set<string>) {
  return Object.fromEntries(Object.entries(fieldData).filter(([key]) => disponibles.has(key)));
}

async function resolverCamposDetalleCatastroLayout(): Promise<DetalleCatastroCamposLayout> {
  if (detalleCatastroCamposCache) return detalleCatastroCamposCache;

  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutDetalleCatastro);

  if (disponibles.size === 0) {
    detalleCatastroCamposCache = {
      fkPoliza: FM_CONFIG.detalleCatastroFkPoliza,
      uso: FM_CONFIG.detalleCatastroCampoTipoUso,
      superficie: FM_CONFIG.detalleCatastroCampoSuperficie,
      ref: FM_CONFIG.detalleCatastroCampoRef,
    };
    return detalleCatastroCamposCache;
  }

  const fkPoliza = elegirNombreCampo(disponibles, [
    FM_CONFIG.detalleCatastroFkPoliza,
    "_kf_ID_Poliza",
    "_kf_ID_Polizas",
  ]);
  const uso = elegirNombreCampo(disponibles, [FM_CONFIG.detalleCatastroCampoTipoUso, "Uso", "TipoUso"]);
  const superficie = elegirNombreCampo(disponibles, [
    FM_CONFIG.detalleCatastroCampoSuperficie,
    "Superficie",
    "SuperficieConstruida",
  ]);
  const ref = elegirNombreCampo(disponibles, [
    FM_CONFIG.detalleCatastroCampoRef,
    "Catastro",
    "ReferenciaCatastral",
    "RefCatastral",
  ]);

  if (!fkPoliza || !uso || !superficie) {
    throw new Error(
      `El layout ${FM_CONFIG.layoutDetalleCatastro} debe incluir relación a póliza (_kf_ID_Poliza o _kf_ID_Polizas), Uso y Superficie. Campos detectados: ${[...disponibles].join(", ")}`
    );
  }

  detalleCatastroCamposCache = { fkPoliza, uso, superficie, ref: ref || undefined };
  return detalleCatastroCamposCache;
}

async function detalleCatastroToFieldData(idPoliza: string, detalle: DetalleCatastroDesdeCatastro) {
  const campos = await resolverCamposDetalleCatastroLayout();
  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutDetalleCatastro);
  const raw = limpiarFieldData({
    [campos.fkPoliza]: idPoliza,
    ...(campos.ref && (!disponibles.size || disponibles.has(campos.ref))
      ? { [campos.ref]: detalle.referenciaCatastral || undefined }
      : {}),
    [campos.uso]: detalle.tipoUso || undefined,
    [campos.superficie]: detalle.superficieConstruida || undefined,
  });

  if (disponibles.size === 0) return raw;

  const filtrado = filtrarFieldDataPorLayout(raw, disponibles);
  if (Object.keys(filtrado).length > 0) return filtrado;

  return filtrarFieldDataPorLayout(
    { [campos.fkPoliza]: idPoliza, [campos.uso]: detalle.tipoUso, [campos.superficie]: detalle.superficieConstruida },
    disponibles
  );
}

async function buscarDetalleCatastroExistente(
  idPoliza: string,
  detalle: DetalleCatastroDesdeCatastro,
  campos: DetalleCatastroCamposLayout
) {
  // Solo buscar por FK: incluir la RC en el find provoca "Field is missing" si no está en el layout.
  const query: Record<string, string> = { [campos.fkPoliza]: idPoliza };

  const data = await findRecords(
    FM_CONFIG.layoutDetalleCatastro,
    { query: [query], limit: "100" },
    true
  );

  const registros = (data?.response?.data ?? []) as FileMakerRecord[];
  const refDetalle = normalizarRefDetalleCatastro(detalle.referenciaCatastral);
  const tipoUso = String(detalle.tipoUso ?? "").trim();
  if (!tipoUso) return null;

  return (
    registros.find((record) => {
      const refRegistro = campos.ref
        ? normalizarRefDetalleCatastro(record.fieldData[campos.ref])
        : "";
      const refOk = !campos.ref || !refDetalle || refRegistro === refDetalle;
      const usoRegistro = String(record.fieldData[campos.uso] ?? "").trim();
      const usoOk =
        normalizarTextoComparacion(usoRegistro) === normalizarTextoComparacion(tipoUso);
      return refOk && usoOk;
    }) ?? null
  );
}

function normalizarTextoComparacion(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

async function escribirDetalleCatastro(
  recordId: string | null,
  fieldData: Record<string, string>,
  metodo: "POST" | "PATCH"
) {
  if (metodo === "POST") {
    await postDetalleCatastroConReintento(fieldData);
    return;
  }

  if (!recordId) throw new Error("No se puede actualizar el detalle catastro sin recordId");

  try {
    await fmRequest(FM_CONFIG.layoutDetalleCatastro, `/records/${encodeURIComponent(recordId)}`, {
      method: "PATCH",
      body: JSON.stringify({ fieldData }),
    });
  } catch (error) {
    if (!isFieldMissingError(error)) throw error;
    await escribirDetalleCatastroPorCampos(recordId, fieldData);
  }
}

async function postDetalleCatastroConReintento(fieldData: Record<string, string>) {
  const intentos: Record<string, string>[] = [fieldData];
  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutDetalleCatastro);

  if (disponibles.size > 0) {
    intentos.push(filtrarFieldDataPorLayout(fieldData, disponibles));
  }

  const sinReferencia = { ...fieldData };
  for (const key of Object.keys(sinReferencia)) {
    if (/catastro|refcat|referencia/i.test(key)) {
      delete sinReferencia[key];
    }
  }
  if (Object.keys(sinReferencia).length > 0) {
    intentos.push(sinReferencia);
  }

  let ultimoError: unknown;

  for (const payload of intentos) {
    const limpio = limpiarFieldData(payload);
    if (Object.keys(limpio).length === 0) continue;

    try {
      await fmRequest(FM_CONFIG.layoutDetalleCatastro, "/records", {
        method: "POST",
        body: JSON.stringify({ fieldData: limpio }),
      });
      return;
    } catch (error) {
      ultimoError = error;
      if (!isFieldMissingError(error)) throw error;
    }
  }

  throw ultimoError instanceof Error
    ? ultimoError
    : new Error("No se pudo crear el detalle catastro en FileMaker");
}

async function escribirDetalleCatastroPorCampos(recordId: string, fieldData: Record<string, string>) {
  const fallos: string[] = [];

  for (const [campo, valor] of Object.entries(fieldData)) {
    try {
      await fmRequest(FM_CONFIG.layoutDetalleCatastro, `/records/${encodeURIComponent(recordId)}`, {
        method: "PATCH",
        body: JSON.stringify({ fieldData: { [campo]: valor } }),
      });
    } catch (error) {
      if (isFieldMissingError(error)) {
        fallos.push(campo);
        continue;
      }
      throw error;
    }
  }

  if (fallos.length === Object.keys(fieldData).length) {
    throw new Error(
      `No se pudo guardar el detalle catastro. Revisa que Uso, Superficie y la relación con póliza estén en el layout ${FM_CONFIG.layoutDetalleCatastro}.`
    );
  }
}

export async function guardarDetalleCatastroPoliza(
  idPoliza: string,
  detalle: DetalleCatastroDesdeCatastro
): Promise<void> {
  if (!idPoliza) {
    throw new Error("Guarda la póliza antes de registrar el detalle catastro");
  }

  if (!detalle.referenciaCatastral && !detalle.tipoUso && !detalle.superficieConstruida) {
    return;
  }

  if (USE_MOCK) {
    await wait(150);
    const clave = `${idPoliza}|${detalle.referenciaCatastral || "sin-ref"}|${detalle.tipoUso || "sin-uso"}`;
    mockDetallesCatastro.set(clave, detalle);
    return;
  }

  const campos = await resolverCamposDetalleCatastroLayout();
  const fieldData = await detalleCatastroToFieldData(idPoliza, detalle);
  const existente = await buscarDetalleCatastroExistente(idPoliza, detalle, campos);

  if (existente?.recordId) {
    await escribirDetalleCatastro(existente.recordId, fieldData, "PATCH");
    return;
  }

  try {
    await escribirDetalleCatastro(null, fieldData, "POST");
  } catch (error) {
    if (!isFieldMissingError(error)) throw error;
    layoutCamposCache.delete(FM_CONFIG.layoutDetalleCatastro);
    detalleCatastroCamposCache = null;
    const fieldDataReintento = await detalleCatastroToFieldData(idPoliza, detalle);
    await escribirDetalleCatastro(null, fieldDataReintento, "POST");
  }
}

export async function guardarDetallesCatastroPoliza(
  idPoliza: string,
  detalles: DetalleCatastroDesdeCatastro[]
): Promise<void> {
  for (const detalle of detalles) {
    await guardarDetalleCatastroPoliza(idPoliza, detalle);
  }
}

function normalizarRefDetalleCatastro(value?: string) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s.-]/g, "");
}

async function listarDetallesCatastroPoliza(
  idPoliza: string,
  campos: DetalleCatastroCamposLayout
): Promise<FileMakerRecord[]> {
  const data = await findRecords(
    FM_CONFIG.layoutDetalleCatastro,
    { query: [{ [campos.fkPoliza]: idPoliza }], limit: "500" },
    true
  );

  return (data?.response?.data ?? []) as FileMakerRecord[];
}

/** Equivalente a CAT_Guardar_Usos_Parcela: sustituye todos los usos agregados de la póliza. */
export async function reemplazarDetallesCatastroPoliza(
  idPoliza: string,
  detalles: DetalleCatastroDesdeCatastro[]
): Promise<void> {
  if (!idPoliza) {
    throw new Error("Guarda la póliza antes de registrar el detalle catastro");
  }

  if (USE_MOCK) {
    await wait(150);
    const prefijo = `${idPoliza}|`;
    for (const clave of [...mockDetallesCatastro.keys()]) {
      if (clave.startsWith(prefijo)) {
        mockDetallesCatastro.delete(clave);
      }
    }
    for (const detalle of detalles) {
      await guardarDetalleCatastroPoliza(idPoliza, detalle);
    }
    return;
  }

  const campos = await resolverCamposDetalleCatastroLayout();
  const existentes = await listarDetallesCatastroPoliza(idPoliza, campos);

  for (const registro of existentes) {
    if (!registro.recordId) continue;
    try {
      await fmRequest(FM_CONFIG.layoutDetalleCatastro, `/records/${encodeURIComponent(registro.recordId)}`, {
        method: "DELETE",
      });
    } catch {
      // Si no se puede borrar, se intentará crear los nuevos registros igualmente.
    }
  }

  for (const detalle of detalles) {
    if (!detalle.tipoUso && !detalle.superficieConstruida) continue;
    const fieldData = await detalleCatastroToFieldData(idPoliza, detalle);
    try {
      await escribirDetalleCatastro(null, fieldData, "POST");
    } catch (error) {
      if (!isFieldMissingError(error)) throw error;
      layoutCamposCache.delete(FM_CONFIG.layoutDetalleCatastro);
      detalleCatastroCamposCache = null;
      const fieldDataReintento = await detalleCatastroToFieldData(idPoliza, detalle);
      await escribirDetalleCatastro(null, fieldDataReintento, "POST");
    }
  }
}

// ── Preexistencia de continente (DETALLECONTINENTE / TIPOLOGIASCONTINENTE) ──

function mapearTipologiaContinente(record: FileMakerRecord): TipologiaContinente {
  const f = record.fieldData;
  return {
    id:
      getFirstValue(f, [
        FM_CONFIG.tipologiaContinenteCampoClave,
        "ClavePrincipal",
        "_kp_ID_Tipologias",
        "_kp_ID_TipologiaContinente",
      ]) || record.recordId,
    recordId: record.recordId,
    nombre: getFirstValue(f, [FM_CONFIG.tipologiaContinenteCampoNombre, "TipoContinente"]),
    precio: getFirstValue(f, [FM_CONFIG.tipologiaContinenteCampoPrecio, "Precio"]),
  };
}

function mapearDetalleContinente(record: FileMakerRecord): DetalleContinente {
  const f = record.fieldData;
  const medicion = getFirstValue(f, [FM_CONFIG.detalleContinenteCampoMedicion, "Medicion"]);
  const precio = getFirstValue(f, [FM_CONFIG.detalleContinenteCampoPrecio, "Precio"]);
  const importeFm = getFirstValue(f, [FM_CONFIG.detalleContinenteCampoImporte, "Importe"]);
  return {
    id:
      getFirstValue(f, [
        FM_CONFIG.detalleContinenteCampoClave,
        "ClavePrincipal",
        "_kp_ID_DetalleContinente",
      ]) || record.recordId,
    recordId: record.recordId,
    idPoliza: getFirstValue(f, [FM_CONFIG.detalleContinenteFkPoliza, "_kf_ID_Poliza"]),
    idTipologia: getFirstValue(f, [FM_CONFIG.detalleContinenteFkTipologia, "_kf_ID_Tipologias"]),
    medicion,
    precio,
    importe: importeFm || calcularImporteContinente(medicion, precio),
  };
}

async function obtenerDetalleContinentePorRecordId(recordId: string): Promise<DetalleContinente | null> {
  const data = await fmRequest(
    FM_CONFIG.layoutDetalleContinente,
    `/records/${encodeURIComponent(recordId)}`
  );
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? mapearDetalleContinente(record) : null;
}

async function detalleContinenteToFieldData(
  idPoliza: string,
  detalle: Pick<DetalleContinente, "idTipologia" | "medicion" | "precio">
): Promise<Record<string, string>> {
  const raw = limpiarFieldData({
    [FM_CONFIG.detalleContinenteFkPoliza]: idPoliza,
    [FM_CONFIG.detalleContinenteFkTipologia]: detalle.idTipologia || undefined,
    [FM_CONFIG.detalleContinenteCampoMedicion]: detalle.medicion || undefined,
    [FM_CONFIG.detalleContinenteCampoPrecio]: detalle.precio || undefined,
  });

  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutDetalleContinente);
  if (disponibles.size === 0) return raw;

  const filtrado = filtrarFieldDataPorLayout(raw, disponibles);
  return Object.keys(filtrado).length > 0 ? filtrado : raw;
}

/** Catálogo de tipologías de continente (TIPOLOGIASCONTINENTE). */
export async function listarTipologiasContinente(limit = 500): Promise<TipologiaContinente[]> {
  if (USE_MOCK) {
    await wait(150);
    return mockTipologiasContinente.map((t) => ({ ...t }));
  }
  const records = await listarRegistrosLayout(FM_CONFIG.layoutTipologiasContinente, limit);
  return records.map(mapearTipologiaContinente).filter((t) => t.nombre);
}

/** Líneas de preexistencia de continente de una póliza. */
export async function listarDetalleContinentePoliza(idPoliza: string): Promise<DetalleContinente[]> {
  if (!idPoliza) return [];
  if (USE_MOCK) {
    await wait(120);
    return [...mockDetalleContinente.values()].filter((d) => d.idPoliza === idPoliza);
  }
  const data = await findRecords(
    FM_CONFIG.layoutDetalleContinente,
    { query: [{ [FM_CONFIG.detalleContinenteFkPoliza]: idPoliza }], limit: "500" },
    true
  );
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearDetalleContinente);
}

export async function crearDetalleContinente(
  idPoliza: string,
  detalle: Pick<DetalleContinente, "idTipologia" | "medicion" | "precio">
): Promise<DetalleContinente> {
  if (!idPoliza) {
    throw new Error("Guarda la póliza antes de añadir preexistencia de continente");
  }

  if (USE_MOCK) {
    await wait(120);
    const id = `DetalleContinente_${Date.now()}`;
    const creado: DetalleContinente = {
      id,
      recordId: id,
      idPoliza,
      idTipologia: detalle.idTipologia,
      medicion: detalle.medicion,
      precio: detalle.precio,
      importe: calcularImporteContinente(detalle.medicion, detalle.precio),
    };
    mockDetalleContinente.set(id, creado);
    return creado;
  }

  const fieldData = await detalleContinenteToFieldData(idPoliza, detalle);
  const data = await fmRequest(FM_CONFIG.layoutDetalleContinente, "/records", {
    method: "POST",
    body: JSON.stringify({ fieldData }),
  });
  const recordId = String(data?.response?.recordId ?? "");
  const recargado = recordId ? await obtenerDetalleContinentePorRecordId(recordId) : null;
  return (
    recargado ?? {
      id: recordId,
      recordId,
      idPoliza,
      idTipologia: detalle.idTipologia,
      medicion: detalle.medicion,
      precio: detalle.precio,
      importe: calcularImporteContinente(detalle.medicion, detalle.precio),
    }
  );
}

export async function actualizarDetalleContinente(
  detalle: DetalleContinente
): Promise<DetalleContinente> {
  if (USE_MOCK) {
    await wait(120);
    const actualizado: DetalleContinente = {
      ...detalle,
      importe: calcularImporteContinente(detalle.medicion, detalle.precio),
    };
    mockDetalleContinente.set(detalle.id, actualizado);
    return actualizado;
  }

  if (!detalle.recordId) {
    throw new Error("No se puede actualizar la preexistencia: falta recordId");
  }

  const fieldData = await detalleContinenteToFieldData(detalle.idPoliza, detalle);
  await fmRequest(
    FM_CONFIG.layoutDetalleContinente,
    `/records/${encodeURIComponent(detalle.recordId)}`,
    { method: "PATCH", body: JSON.stringify({ fieldData }) }
  );
  return (
    (await obtenerDetalleContinentePorRecordId(detalle.recordId)) ?? {
      ...detalle,
      importe: calcularImporteContinente(detalle.medicion, detalle.precio),
    }
  );
}

export async function eliminarDetalleContinente(detalle: DetalleContinente): Promise<void> {
  if (USE_MOCK) {
    await wait(100);
    mockDetalleContinente.delete(detalle.id);
    return;
  }
  if (!detalle.recordId) {
    throw new Error("No se puede borrar la preexistencia: falta recordId");
  }
  await fmRequest(
    FM_CONFIG.layoutDetalleContinente,
    `/records/${encodeURIComponent(detalle.recordId)}`,
    { method: "DELETE" }
  );
}

/** Líneas de detalle catastro (Uso/Superficie) de una póliza, para mostrar y borrar. */
export async function listarDetalleCatastroPoliza(
  idPoliza: string
): Promise<DetalleCatastroPoliza[]> {
  if (!idPoliza) return [];

  if (USE_MOCK) {
    await wait(120);
    const prefijo = `${idPoliza}|`;
    return [...mockDetallesCatastro.entries()]
      .filter(([clave]) => clave.startsWith(prefijo))
      .map(([clave, detalle]) => ({
        recordId: `mock|${clave}`,
        idPoliza,
        uso: detalle.tipoUso,
        superficie: detalle.superficieConstruida,
      }));
  }

  const campos = await resolverCamposDetalleCatastroLayout();
  const registros = await listarDetallesCatastroPoliza(idPoliza, campos);
  return registros.map((registro) => ({
    recordId: registro.recordId,
    idPoliza,
    uso: getFirstValue(registro.fieldData, [campos.uso, "Uso", "TipoUso"]),
    superficie: getFirstValue(registro.fieldData, [campos.superficie, "Superficie", "SuperficieConstruida"]),
  }));
}

export async function eliminarDetalleCatastroPoliza(recordId: string): Promise<void> {
  if (!recordId) return;

  if (USE_MOCK) {
    await wait(100);
    const clave = recordId.startsWith("mock|") ? recordId.slice("mock|".length) : "";
    if (clave) mockDetallesCatastro.delete(clave);
    return;
  }

  await fmRequest(
    FM_CONFIG.layoutDetalleCatastro,
    `/records/${encodeURIComponent(recordId)}`,
    { method: "DELETE" }
  );
}

export async function actualizarSumatoriosParcelaCatastroPoliza(
  poliza: Poliza,
  usosParcelaJson: Record<string, number>,
  supConstruidaTotal: number
): Promise<Poliza> {
  return actualizarSumatoriosCatastroPoliza(poliza, {
    usosParcelaJson,
    supConstruidaTotal,
  });
}

export async function actualizarSumatoriosCatastroPoliza(
  poliza: Poliza,
  sumatorios: {
    supConstruidaTotal?: number;
    usosJson?: Record<string, number>;
    usosParcelaJson?: Record<string, number>;
  }
): Promise<Poliza> {
  const recordId = textoCampo(poliza.recordId);
  const supPendiente =
    sumatorios.supConstruidaTotal != null && sumatorios.supConstruidaTotal > 0;

  if (!recordId) {
    if (supPendiente) {
      throw new Error(
        "No se pudo guardar la superficie en FileMaker: la póliza aún no tiene recordId. Guarda la póliza e inténtalo de nuevo."
      );
    }
    return poliza;
  }

  if (USE_MOCK) {
    await wait(100);
    const valor = supPendiente
      ? formatearSuperficieParaFileMaker(sumatorios.supConstruidaTotal!)
      : "";
    return {
      ...poliza,
      ...(valor
        ? { supConstruidaTotal: valor, totalSuperficie: valor }
        : {}),
    };
  }

  let local: Poliza = { ...poliza, recordId };

  if (sumatorios.usosJson && Object.keys(sumatorios.usosJson).length > 0) {
    const guardado = await patchPrimerCampoValido(
      recordId,
      POLIZA_CAMPOS_ALIASES.UsosJSON,
      JSON.stringify(sumatorios.usosJson)
    );
    if (!guardado) {
      throw new Error(
        `No se pudo guardar UsosJSON en FileMaker. Comprueba que el campo está en el layout ${FM_CONFIG.layoutPolizas}.`
      );
    }
  }

  if (sumatorios.usosParcelaJson && Object.keys(sumatorios.usosParcelaJson).length > 0) {
    const guardado = await patchPrimerCampoValido(
      recordId,
      POLIZA_CAMPOS_ALIASES.UsosParcelaJSON,
      JSON.stringify(sumatorios.usosParcelaJson)
    );
    if (!guardado) {
      throw new Error(
        `No se pudo guardar UsosParcelaJSON en FileMaker. Comprueba que el campo está en el layout ${FM_CONFIG.layoutPolizas}.`
      );
    }
  }

  if (supPendiente) {
    const valor = formatearSuperficieParaFileMaker(sumatorios.supConstruidaTotal!);

    await guardarCampoPolizaObligatorio(
      recordId,
      POLIZA_CAMPOS_ALIASES.SupConstruidaTotal,
      valor,
      "SupConstruidaTotal"
    );

    try {
      await patchCampoPolizaVerificado(
        recordId,
        nombresTotalSuperficiePoliza(),
        valor,
        "TotalSuperficie"
      );
    } catch {
      // TotalSuperficie es opcional; SupConstruidaTotal ya quedó verificado.
    }

    const leidoFinal = await leerValorCampoPoliza(
      recordId,
      POLIZA_CAMPOS_ALIASES.SupConstruidaTotal
    );
    if (!textoCampo(leidoFinal)) {
      throw new Error(
        "SupConstruidaTotal no quedó guardado en FileMaker tras la escritura. Comprueba que el campo es editable en el layout API_Polizas."
      );
    }

    local = {
      ...local,
      supConstruidaTotal: textoCampo(leidoFinal) || valor,
      totalSuperficie: valor,
    };
  }

  const recargada = await obtenerPolizaPorRecordId(recordId);
  return fusionarPolizaTrasGuardar(recargada ?? local, local);
}

function registroDetallePerteneceAReferencia(
  registro: FileMakerRecord,
  refNorm: string,
  campos: DetalleCatastroCamposLayout,
  usosNuevos: Set<string>
) {
  const uso = String(registro.fieldData[campos.uso] ?? "").trim();
  const usoNorm = normalizarTextoComparacion(uso);

  if (/^residencial$/i.test(uso)) return true;

  for (const usoNuevo of usosNuevos) {
    if (normalizarTextoComparacion(usoNuevo) === usoNorm) return true;
  }

  if (!campos.ref || !refNorm) return false;

  const refRegistro = normalizarRefDetalleCatastro(registro.fieldData[campos.ref]);
  if (refRegistro === refNorm) return true;
  if (refRegistro === "" && /^residencial$/i.test(uso)) return true;

  return false;
}

/** Sustituye todos los detalles de una referencia (p. ej. quita Residencial/130 al guardar la unidad elegida). */
export async function reemplazarDetallesCatastroPorReferencia(
  idPoliza: string,
  referenciaCatastral: string,
  detalles: DetalleCatastroDesdeCatastro[]
): Promise<void> {
  if (!idPoliza) {
    throw new Error("Guarda la póliza antes de registrar el detalle catastro");
  }

  const ref = referenciaCatastral.trim();
  if (!ref) {
    await guardarDetallesCatastroPoliza(idPoliza, detalles);
    return;
  }

  if (USE_MOCK) {
    await wait(150);
    const prefijo = `${idPoliza}|${ref}`;
    for (const clave of [...mockDetallesCatastro.keys()]) {
      if (clave.startsWith(prefijo)) {
        mockDetallesCatastro.delete(clave);
      }
    }
    for (const detalle of detalles) {
      await guardarDetalleCatastroPoliza(idPoliza, detalle);
    }
    return;
  }

  const campos = await resolverCamposDetalleCatastroLayout();
  const refNorm = normalizarRefDetalleCatastro(ref);
  const usosNuevos = new Set(
    detalles.map((detalle) => String(detalle.tipoUso ?? "").trim()).filter(Boolean)
  );
  const todos = await listarDetallesCatastroPoliza(idPoliza, campos);
  const existentes = todos.filter((registro) =>
    registroDetallePerteneceAReferencia(registro, refNorm, campos, usosNuevos)
  );

  for (const registro of existentes) {
    if (!registro.recordId) continue;
    try {
      await fmRequest(FM_CONFIG.layoutDetalleCatastro, `/records/${encodeURIComponent(registro.recordId)}`, {
        method: "DELETE",
      });
    } catch {
      // Si no se puede borrar (permisos/registro bloqueado), se actualizará con el POST/upsert posterior.
    }
  }

  for (const detalle of detalles) {
    if (!detalle.referenciaCatastral && !detalle.tipoUso && !detalle.superficieConstruida) continue;
    const fieldData = await detalleCatastroToFieldData(idPoliza, detalle);
    try {
      await escribirDetalleCatastro(null, fieldData, "POST");
    } catch (error) {
      if (!isFieldMissingError(error)) throw error;
      layoutCamposCache.delete(FM_CONFIG.layoutDetalleCatastro);
      detalleCatastroCamposCache = null;
      const fieldDataReintento = await detalleCatastroToFieldData(idPoliza, detalle);
      await escribirDetalleCatastro(null, fieldDataReintento, "POST");
    }
  }
}

type DetalleCatastroParcelaCamposLayout = {
  fkPoliza: string;
  refInmueble?: string;
  usoPrincipal?: string;
  anoConstruccion?: string;
  supConstruida?: string;
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
  usosJson?: string;
  superficieTotal?: string;
};

let detalleCatastroParcelaCamposCache: DetalleCatastroParcelaCamposLayout | null = null;

function numeroCptFileMaker(value?: string) {
  const cpt = Number.parseFloat(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(cpt)) return "";
  return String(cpt / 1_000_000);
}

async function resolverCamposDetalleCatastroParcelaLayout(): Promise<DetalleCatastroParcelaCamposLayout> {
  if (detalleCatastroParcelaCamposCache) return detalleCatastroParcelaCamposCache;

  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutDetalleCatastroParcela);
  const elegir = (candidatos: string[]) =>
    disponibles.size === 0 ? candidatos[0] : elegirNombreCampo(disponibles, candidatos);

  const fkPoliza = elegir([
    FM_CONFIG.detalleCatastroParcelaFkPoliza,
    "_kf_ID_Poliza",
    "_kf_ID_Polizas",
  ]);

  if (disponibles.size > 0 && !fkPoliza) {
    throw new Error(
      `El layout ${FM_CONFIG.layoutDetalleCatastroParcela} debe incluir relación a póliza (_kf_ID_Poliza). Campos detectados: ${[...disponibles].join(", ")}`
    );
  }

  detalleCatastroParcelaCamposCache = {
    fkPoliza: fkPoliza || FM_CONFIG.detalleCatastroParcelaFkPoliza,
    refInmueble: elegir(["RC", FM_CONFIG.detalleCatastroParcelaCampoRef, "Catastro", "RefCatastral"]),
    usoPrincipal: elegir(["UsoPrincipal", "Uso"]),
    anoConstruccion: elegir(["AnoConstruccion", "Antiguedad"]),
    supConstruida: elegir(["SupConstruida", "SuperficieConstruida"]),
    cpt: elegir(["Cpt"]),
    escalera: elegir(["Escalera"]),
    planta: elegir(["Planta"]),
    puerta: elegir(["Puerta"]),
    bloque: elegir(["Bloque"]),
    provincia: elegir(["Provincia"]),
    municipio: elegir(["Municipio", "Poblacion"]),
    tipoVia: elegir(["TipoVia", "Via"]),
    nombreVia: elegir(["NombreVia", "Direccion"]),
    codigoPostal: elegir(["CP", "CodPostal", "CodigoPostal"]),
    numeroVia: elegir(["NumeroVia", "NumeroCalle"]),
    usosJson: elegir(["UsosJSON", "UsosJson"]),
    superficieTotal: elegir([
      "SuperficeConstruidaTotal",
      "SuperficieConstruidaTotal",
      "SupConstruidaTotal",
    ]),
  };
  return detalleCatastroParcelaCamposCache;
}

async function detalleCatastroParcelaToFieldData(
  idPoliza: string,
  inmueble: InmuebleParcelaCatastro
) {
  const campos = await resolverCamposDetalleCatastroParcelaLayout();
  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutDetalleCatastroParcela);
  const usosJson = JSON.stringify(inmueble.usosJson ?? {});

  const raw = limpiarFieldData({
    [campos.fkPoliza]: idPoliza,
    ...(campos.refInmueble ? { [campos.refInmueble]: inmueble.referenciaCatastral || undefined } : {}),
    ...(campos.usoPrincipal ? { [campos.usoPrincipal]: inmueble.usoPrincipal || undefined } : {}),
    ...(campos.anoConstruccion
      ? { [campos.anoConstruccion]: inmueble.anoConstruccion || undefined }
      : {}),
    ...(campos.supConstruida
      ? { [campos.supConstruida]: inmueble.supConstruidaEdificio || undefined }
      : {}),
    ...(campos.cpt ? { [campos.cpt]: numeroCptFileMaker(inmueble.cpt) || undefined } : {}),
    ...(campos.escalera ? { [campos.escalera]: inmueble.escalera || undefined } : {}),
    ...(campos.planta ? { [campos.planta]: inmueble.planta || undefined } : {}),
    ...(campos.puerta ? { [campos.puerta]: inmueble.puerta || undefined } : {}),
    ...(campos.bloque ? { [campos.bloque]: inmueble.bloque || undefined } : {}),
    ...(campos.provincia ? { [campos.provincia]: inmueble.provincia || undefined } : {}),
    ...(campos.municipio ? { [campos.municipio]: inmueble.municipio || undefined } : {}),
    ...(campos.tipoVia ? { [campos.tipoVia]: inmueble.tipoVia || undefined } : {}),
    ...(campos.nombreVia ? { [campos.nombreVia]: inmueble.nombreVia || undefined } : {}),
    ...(campos.codigoPostal ? { [campos.codigoPostal]: inmueble.codigoPostal || undefined } : {}),
    ...(campos.numeroVia ? { [campos.numeroVia]: inmueble.numeroVia || undefined } : {}),
    ...(campos.usosJson ? { [campos.usosJson]: usosJson !== "{}" ? usosJson : undefined } : {}),
    ...(campos.superficieTotal
      ? {
          [campos.superficieTotal]:
            inmueble.superficieConstruidaTotal != null
              ? String(inmueble.superficieConstruidaTotal)
              : undefined,
        }
      : {}),
  });

  if (disponibles.size === 0) return raw;
  const filtrado = filtrarFieldDataPorLayout(raw, disponibles);
  return Object.keys(filtrado).length > 0 ? filtrado : raw;
}

async function listarDetalleCatastroParcelaPoliza(
  idPoliza: string,
  campos: DetalleCatastroParcelaCamposLayout
): Promise<FileMakerRecord[]> {
  const data = await findRecords(
    FM_CONFIG.layoutDetalleCatastroParcela,
    { query: [{ [campos.fkPoliza]: idPoliza }], limit: "500" },
    true
  );

  return (data?.response?.data ?? []) as FileMakerRecord[];
}

async function escribirDetalleCatastroParcela(fieldData: Record<string, string>) {
  const intentos: Record<string, string>[] = [fieldData];
  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutDetalleCatastroParcela);

  if (disponibles.size > 0) {
    intentos.push(filtrarFieldDataPorLayout(fieldData, disponibles));
  }

  let ultimoError: unknown;

  for (const payload of intentos) {
    const limpio = limpiarFieldData(payload);
    if (Object.keys(limpio).length === 0) continue;

    try {
      await fmRequest(FM_CONFIG.layoutDetalleCatastroParcela, "/records", {
        method: "POST",
        body: JSON.stringify({ fieldData: limpio }),
      });
      return;
    } catch (error) {
      ultimoError = error;
      if (!isFieldMissingError(error)) throw error;
    }
  }

  throw ultimoError instanceof Error
    ? ultimoError
    : new Error("No se pudo crear el inmueble de parcela catastral en FileMaker");
}

export async function reemplazarDetalleCatastroParcelaPoliza(
  idPoliza: string,
  referenciaParcela: string,
  inmuebles: InmuebleParcelaCatastro[]
): Promise<void> {
  if (!idPoliza) {
    throw new Error("Guarda la póliza antes de registrar los inmuebles de la parcela catastral");
  }

  const refParcela = referenciaParcela.trim();
  const inmueblesValidos = inmuebles.filter((inmueble) => inmueble.referenciaCatastral?.trim());
  if (!inmueblesValidos.length) return;

  if (USE_MOCK) {
    await wait(150);
    const prefijo = `${idPoliza}|${refParcela || "parcela"}|`;
    for (const clave of [...mockDetallesCatastroParcela.keys()]) {
      if (clave.startsWith(prefijo)) {
        mockDetallesCatastroParcela.delete(clave);
      }
    }
    for (const inmueble of inmueblesValidos) {
      const clave = `${idPoliza}|${refParcela || "parcela"}|${inmueble.referenciaCatastral}`;
      mockDetallesCatastroParcela.set(clave, inmueble);
    }
    return;
  }

  const campos = await resolverCamposDetalleCatastroParcelaLayout();
  const existentes = await listarDetalleCatastroParcelaPoliza(idPoliza, campos);

  for (const registro of existentes) {
    if (!registro.recordId) continue;
    try {
      await fmRequest(
        FM_CONFIG.layoutDetalleCatastroParcela,
        `/records/${encodeURIComponent(registro.recordId)}`,
        { method: "DELETE" }
      );
    } catch {
      // Si no se puede borrar, se intentará crear los nuevos registros igualmente.
    }
  }

  for (const inmueble of inmueblesValidos) {
    const fieldData = await detalleCatastroParcelaToFieldData(idPoliza, {
      ...inmueble,
      referenciaParcela: refParcela || inmueble.referenciaParcela,
    });
    try {
      await escribirDetalleCatastroParcela(fieldData);
    } catch (error) {
      if (!isFieldMissingError(error)) throw error;
      layoutCamposCache.delete(FM_CONFIG.layoutDetalleCatastroParcela);
      detalleCatastroParcelaCamposCache = null;
      const fieldDataReintento = await detalleCatastroParcelaToFieldData(idPoliza, {
        ...inmueble,
        referenciaParcela: refParcela || inmueble.referenciaParcela,
      });
      await escribirDetalleCatastroParcela(fieldDataReintento);
    }
  }
}

export async function calcularYGuardarDistanciaPoliza(
  poliza: Poliza
): Promise<Poliza> {
  if (!poliza.recordId) throw new Error("No se puede guardar: falta recordId de la póliza");

  const metricas = await calcularMetricasDistanciaPoliza(poliza);

  if (USE_MOCK) {
    await wait(300);
    return { ...poliza, ...metricas };
  }

  await guardarMetricasDistanciaPoliza(poliza.recordId, metricas);
  return { ...poliza, ...metricas };
}

async function guardarMetricasDistanciaPoliza(
  recordId: string,
  metricas: { distancia: string; latitud: string; longitud: string }
) {
  const distanciaNombres = nombresUnicos([
    FM_CONFIG.campoDistanciaPoliza,
    "Distancia",
    "DistanciaKm",
    "Distancia_Km",
    "Distancia_km",
  ]);
  const latitudNombres = nombresUnicos([
    FM_CONFIG.campoLatitudPoliza,
    "Latitud",
    "Lat",
    "Latitude",
  ]);
  const longitudNombres = nombresUnicos([
    FM_CONFIG.campoLongitudPoliza,
    "Longitud",
    "Lng",
    "Long",
    "Longitude",
  ]);

  const fallos: string[] = [];

  const guardadoDistancia = await patchPrimerCampoValido(
    recordId,
    distanciaNombres,
    metricas.distancia
  );
  if (!guardadoDistancia) fallos.push("Distancia");

  const guardadoLatitud = await patchPrimerCampoValido(
    recordId,
    latitudNombres,
    metricas.latitud
  );
  if (!guardadoLatitud) fallos.push("Latitud");

  const guardadoLongitud = await patchPrimerCampoValido(
    recordId,
    longitudNombres,
    metricas.longitud
  );
  if (!guardadoLongitud) fallos.push("Longitud");

  if (fallos.length === 3) {
    throw new Error(
      "No se encontraron los campos Distancia, Latitud o Longitud en el layout API_Polizas. Añádelos al layout o configura VITE_FM_POLIZA_CAMPO_DISTANCIA, VITE_FM_POLIZA_CAMPO_LATITUD y VITE_FM_POLIZA_CAMPO_LONGITUD en .env.local"
    );
  }

  if (fallos.length > 0) {
    throw new Error(
      `No se pudieron guardar en FileMaker: ${fallos.join(", ")}. Comprueba que existan en el layout API_Polizas.`
    );
  }
}

async function patchPrimerCampoValido(
  recordId: string,
  nombresCampo: string[],
  valor: string
): Promise<boolean> {
  for (const nombre of nombresCampo) {
    try {
      const data = await fmRequest(FM_CONFIG.layoutPolizas, `/records/${encodeURIComponent(recordId)}`, {
        method: "PATCH",
        body: JSON.stringify({ fieldData: { [nombre]: valor } }),
      });
      const code = String(data?.messages?.[0]?.code ?? "0");
      if (code !== "0") continue;
      return true;
    } catch (error) {
      if (isFieldMissingError(error)) {
        layoutCamposCache.delete(FM_CONFIG.layoutPolizas);
        continue;
      }
      throw error;
    }
  }
  return false;
}

function formatearSuperficieParaFileMaker(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(2)));
}

function valoresSuperficieCoinciden(esperado: string, leido: string): boolean {
  const a = Number.parseFloat(esperado.replace(",", "."));
  const b = Number.parseFloat(String(leido ?? "").replace(",", "."));
  if (Number.isFinite(a) && Number.isFinite(b)) return Math.abs(a - b) < 0.01;
  return textoCampo(esperado) === textoCampo(leido);
}

async function leerValorCampoPoliza(recordId: string, nombresCampo: string[]): Promise<string> {
  const data = await fmRequest(
    FM_CONFIG.layoutPolizas,
    `/records/${encodeURIComponent(recordId)}`
  );
  const fieldData =
    (data?.response?.data?.[0] as FileMakerRecord | undefined)?.fieldData ?? {};
  return getFirstValue(fieldData, nombresCampo);
}

async function patchCampoPolizaVerificado(
  recordId: string,
  nombresCampo: string[],
  valor: string,
  etiquetaCampo: string
): Promise<void> {
  const texto = valor.trim();
  if (!texto) return;

  const numero = Number.parseFloat(texto.replace(",", "."));
  const candidatosValor: unknown[] = [texto];
  if (Number.isFinite(numero)) {
    candidatosValor.push(numero);
    if (Number.isInteger(numero)) candidatosValor.push(String(numero));
  }

  let ultimoError: Error | null = null;

  for (const nombre of nombresCampo) {
    for (const payload of candidatosValor) {
      if (payload === "" || payload === "NaN") continue;
      try {
        const data = await fmRequest(
          FM_CONFIG.layoutPolizas,
          `/records/${encodeURIComponent(recordId)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ fieldData: { [nombre]: payload } }),
          }
        );
        const code = String(data?.messages?.[0]?.code ?? "0");
        if (code !== "0") {
          throw new Error(getFileMakerErrorMessage(data) || `Error FileMaker ${code}`);
        }

        const leido = await leerValorCampoPoliza(recordId, nombresCampo);
        if (valoresSuperficieCoinciden(texto, leido)) return;

        ultimoError = new Error(
          `${etiquetaCampo} no se reflejó en FileMaker (enviado ${texto}, leído ${leido || "vacío"}). ` +
            "Puede ser un campo calculado o de solo lectura."
        );
      } catch (error) {
        if (isFieldMissingError(error)) {
          layoutCamposCache.delete(FM_CONFIG.layoutPolizas);
          ultimoError =
            error instanceof Error ? error : new Error(`No se pudo guardar ${etiquetaCampo}`);
          continue;
        }
        throw error;
      }
    }
  }

  throw (
    ultimoError ??
    new Error(
      `No se pudo guardar ${etiquetaCampo} en FileMaker. Comprueba que el campo está en el layout ${FM_CONFIG.layoutPolizas}.`
    )
  );
}

async function guardarCampoPolizaObligatorio(
  recordId: string,
  nombresCampo: string[],
  valor: string,
  etiquetaCampo: string
): Promise<void> {
  await patchCampoPolizaVerificado(recordId, nombresCampo, valor, etiquetaCampo);
}

function nombresUnicos(nombres: string[]) {
  return [...new Set(nombres.map((nombre) => nombre.trim()).filter(Boolean))];
}

function nombresCodPostalCPoliza() {
  return nombresUnicos([
    FM_CONFIG.polizaCampoCodPostalC,
    "CodPostalC",
    "CodigoPostalC",
    "CP_C",
    "Cod_Postal_C",
  ]);
}

function nombresPoblacionCPoliza() {
  return nombresUnicos(["PoblacionC", "Poblacion_C", "PoblacionCatastro"]);
}

function nombresProvinciaCPoliza() {
  return nombresUnicos(["ProvinciaC", "Provincia_C", "ProvinciaCatastro"]);
}

function nombresNombreViaCPoliza() {
  return nombresUnicos(["NombreViaC", "Nombre_ViaC"]);
}

function nombresViaCPoliza() {
  return nombresUnicos(["ViaC", "Via_C", "TipoViaC"]);
}

function nombresDireccionCPoliza() {
  return nombresUnicos(["DireccionC", "Direccion_C"]);
}

function nombresNumeroCalleCPoliza() {
  return nombresUnicos(["NumeroCalleC", "Numero_CalleC", "NumeroC"]);
}

function nombresBloqueCPoliza() {
  return nombresUnicos(["BloqueC", "Bloque_C"]);
}

function nombresEscaleraCPoliza() {
  return nombresUnicos(["EscaleraC", "Escalera_C"]);
}

function nombresPlantaCPoliza() {
  return nombresUnicos(["PlantaC", "Planta_C"]);
}

function nombresPuertaCPoliza() {
  return nombresUnicos(["PuertaC", "Puerta_C"]);
}

function nombresCatastroPoliza() {
  return nombresUnicos(["Catastro", "ReferenciaCatastral", "RefCatastral"]);
}

/** Relación polizas_CAT_CODIGO_MUNICIPIOS (debe estar en layout API_Polizas). */
function nombresCodigoMunicipioCatastroPoliza() {
  return nombresUnicos([
    "polizas_CAT_CODIGO_MUNICIPIOS::Codigo",
    "polizas_CAT_CODIGO_MUNICIPIOS:Codigo",
    "Polizas_CAT_CODIGO_MUNICIPIOS::Codigo",
    "Polizas_CAT_CODIGO_MUNICIPIOS:Codigo",
    "CAT_CODIGO_MUNICIPIOS::Codigo",
    "CAT_CODIGO_MUNICIPIOS:Codigo",
    "CodigoMunicipioCatastro",
  ]);
}

function nombresAnoConstruccionPoliza() {
  return nombresUnicos(["AnoConstruccion", "AñoConstruccion", "Ano_Construccion"]);
}

function nombresTotalSuperficiePoliza() {
  return nombresUnicos(["TotalSuperficie", "SuperficieTotal", "Total_Superficie"]);
}

async function guardarCamposDireccionCatastroPoliza(recordId: string, poliza: Poliza) {
  for (const campo of camposDireccionCatastroPoliza(poliza)) {
    const valor = textoCampo(campo.getValor(poliza));
    if (!valor) continue;
    await patchPrimerCampoValido(recordId, campo.nombresFm, valor);
  }
}

export async function obtenerPoliza(
  idPoliza?: string
): Promise<Poliza | null> {
  if (!idPoliza) return null;

  if (USE_MOCK) {
    await wait(150);

    return (
      polizasMock.find((p) => p.id === idPoliza || p.recordId === idPoliza) ??
      null
    );
  }

  const data = await findRecords(
    FM_CONFIG.layoutPolizas,
    {
      query: [{ _kp_ID_Poliza: idPoliza }],
      limit: "1",
    },
    true
  );

  const record =
    data?.response?.data?.[0] as
      | FileMakerRecord
      | undefined;

  if (!record) {
    const recordById = await obtenerPolizaPorRecordId(idPoliza).catch(() => null);
    return recordById ? enriquecerPoliza(recordById) : null;
  }

  return enriquecerPoliza(
    mapearPoliza(record)
  );
}
export async function obtenerPolizaPorRecordId(recordId: string): Promise<Poliza | null> {
  const data = await fmRequest(FM_CONFIG.layoutPolizas, `/records/${encodeURIComponent(recordId)}`);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  if (!record) return null;
  return enriquecerPoliza(mapearPoliza(record));
}
async function enriquecerPoliza(poliza: Poliza): Promise<Poliza> {
  const [polizaConRamo, compania] = await Promise.all([
    enriquecerPolizaConRamo(poliza),
    poliza.idCompania ? obtenerCompania(poliza.idCompania) : Promise.resolve(null),
  ]);

  let resultado = compania?.nombre
    ? { ...polizaConRamo, compania: compania.nombre }
    : polizaConRamo;

  if (!textoCampo(resultado.codigoMunicipioCatastro) && textoCampo(resultado.poblacionC)) {
    const { resolverCodigoMunicipioCatastro } = await import("@/lib/codigosMunicipiosCatastro");
    const codigo = await resolverCodigoMunicipioCatastro(resultado.poblacionC);
    if (codigo) {
      resultado = { ...resultado, codigoMunicipioCatastro: codigo };
    }
  }

  return resultado;
}
async function enriquecerPolizaConRamo(poliza: Poliza): Promise<Poliza> { if (!poliza.idRamo || poliza.ramo || poliza.tipoRamo) return poliza; const ramo = await obtenerRamo(poliza.idRamo); return ramo ? { ...poliza, ramo: ramo.ramo, tipoRamo: ramo.tipoRamo } : poliza; }
async function obtenerRamo(idRamo: string): Promise<Ramo | null> { if (!idRamo) return null; const cached = ramoCache.get(idRamo); if (cached) return cached; const data = await findRecords(FM_CONFIG.layoutRamos, { query: [{ _kp_ID_Ramo: idRamo }], limit: "1" }, true).catch(() => null); const record = data?.response?.data?.[0] as FileMakerRecord | undefined; if (!record) return null; const ramo = mapearRamo(record); ramoCache.set(idRamo, ramo); return ramo; }
async function obtenerCompania(idCompania: string): Promise<Compania | null> {
  if (!idCompania) return null;
  if (USE_MOCK) {
    await wait(100);
    return companiasMock.find((c) => c.id === idCompania || c.recordId === idCompania) ?? null;
  }

  const cached = companiaCache.get(idCompania);
  if (cached) return cached;

  const data = await findRecords(FM_CONFIG.layoutCompanias, { query: [{ _kp_ID_Compania: idCompania }], limit: "1" }, true).catch(() => null);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  if (!record) return null;

  const compania = mapearCompania(record);
  companiaCache.set(idCompania, compania);
  return compania;
}
export async function obtenerSiniestrosAsegurado(idAsegurado?: string): Promise<Siniestro[]> { if (!idAsegurado) return []; if (USE_MOCK) { await wait(150); return siniestrosMock; } const data = await findRecords(FM_CONFIG.layoutSiniestros, { query: [{ _kf_ID_Asegurado: idAsegurado }], limit: "100" }, true); return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearSiniestro); }
async function buscarRegistrosSiniestrosLayout(
  layout: string,
  limit = 500
): Promise<FileMakerRecord[]> {
  const porRecordId = new Map<string, FileMakerRecord>();

  const acumularLote = (lote: FileMakerRecord[]) => {
    for (const registro of lote) {
      porRecordId.set(registro.recordId, registro);
    }
  };

  const buscarConConsulta = async (query: Record<string, string>) => {
    let offset = 1;
    while (true) {
      const data = await findRecords(
        layout,
        { query: [query], limit: String(limit), offset: String(offset) },
        true
      );
      const lote = (data?.response?.data ?? []) as FileMakerRecord[];
      if (!lote.length) break;
      acumularLote(lote);
      if (lote.length < limit) break;
      offset += lote.length;
    }
  };

  const consultas: Array<Record<string, string>> = [
    { NumeroSiniestro: "*" },
    { _kp_ID_Siniestro: "*" },
    { Asegurado: "*" },
    { FechaRecepcion: "*" },
    { [FM_CONFIG.filtroEnCursoCampo]: FM_CONFIG.filtroEnCursoValor },
    { FechaCierre: "*" },
  ];

  for (const query of consultas) {
    try {
      await buscarConConsulta(query);
    } catch {
      // Probar la siguiente consulta.
    }
  }

  if (porRecordId.size > 0) return [...porRecordId.values()];

  if (!FALLBACK_LISTAR_REGISTROS) return [];

  try {
    return await listarRegistrosLayout(layout, limit);
  } catch {
    return [];
  }
}

async function buscarRegistrosEnCurso(): Promise<FileMakerRecord[]> {
  const layouts = [FM_CONFIG.layoutSiniestros, FM_CONFIG.layout].filter(
    (layout, index, all) => Boolean(layout) && all.indexOf(layout) === index
  );

  for (const layout of layouts) {
    try {
      const data = await findRecords(
        layout,
        { query: [{ [FM_CONFIG.filtroEnCursoCampo]: FM_CONFIG.filtroEnCursoValor }], limit: "500" },
        true
      );
      const registros = (data?.response?.data ?? []) as FileMakerRecord[];
      if (registros.length > 0) return registros;
    } catch {
      // Probar el siguiente layout o el fallback de listado completo.
    }
  }

  return [];
}

function construirDireccionCalleSiniestro(f: Record<string, string>): string {
  return [
    f.Via,
    f.Direccion,
    f.NumeroCalle,
    f.Bloque,
    f.Escalera,
    f.Planta,
    f.Puerta,
  ]
    .map((parte) => textoCampo(parte))
    .filter(Boolean)
    .join(" ");
}

function candidatosAliasCompaniaSiniestro(f: Record<string, string>): string[] {
  const desdeLayout = Object.keys(f).filter(
    (key) =>
      key === "Alias" ||
      key === "Compania" ||
      key === "Compañia" ||
      /(?:^|::|:)Alias$/i.test(key) ||
      /(?:^|::|:)Compania$/i.test(key) ||
      /(?:^|::|:)Compañia$/i.test(key)
  );

  return Array.from(
    new Set(
      [
        FM_CONFIG.siniestroCampoAlias,
        "Alias",
        "Compania",
        "Compañia",
        ...desdeLayout,
        "siniestros_polizas_COMPANIAS::Alias",
        "siniestros_polizas_COMPANIAS:Alias",
        "siniestros_polizas_COMPANIAS::Compania",
        "siniestros_polizas_COMPANIAS:Compania",
        "siniestros_polizas::Alias",
        "siniestros_polizas:Alias",
        "polizas_COMPANIAS::Alias",
        "polizas_COMPANIAS:Alias",
        "polizas_COMPANIAS::Compania",
        "polizas_COMPANIAS:Compania",
        "COMPANIAS::Alias",
        "COMPANIAS:Alias",
        "COMPANIAS::Compania",
        "COMPANIAS:Compania",
        "siniestros_COMPANIAS::Alias",
        "siniestros_COMPANIAS:Alias",
        "siniestros_COMPANIAS::Compania",
        "siniestros_COMPANIAS:Compania",
      ].filter(Boolean)
    )
  );
}

function aliasCompaniaSiniestro(f: Record<string, string>): string {
  return getFirstValue(f, candidatosAliasCompaniaSiniestro(f));
}

function esSiniestroEnCursoRecord(record: FileMakerRecord): boolean {
  const f = record.fieldData;
  const fechaCierre = getFirstValue(f, [FM_CONFIG.filtroEnCursoCampo, "FechaCierre", "Fecha_Cierre", "F_Cierre"]);
  return String(fechaCierre ?? "").trim() === "";
}

function esSiniestroEnCurso(siniestro: Siniestro): boolean {
  return String(siniestro.fechaCierre ?? "").trim() === "";
}

function mapearSiniestro(record: FileMakerRecord): Siniestro {
  const f = record.fieldData;
  const alias = aliasCompaniaSiniestro(f);
  const direccionCalle =
    construirDireccionCalleSiniestro(f) ||
    getFirstValue(f, ["zVistaDireccionCrawfordEnLinea", "DireccionCompleta", "DireccCompleta", "Direccion"]);
  const fechaRecepcion = getFirstValue(f, ["FechaRecepcion", "Fecha_Recepcion"]);

  return {
    id: getFirstValue(f, ["_kp_ID_Siniestro", "id"]) || record.recordId,
    recordId: record.recordId,
    idSiniestro: getFirstValue(f, ["_kp_ID_Siniestro", "id"]),
    idAsegurado: f._kf_ID_Asegurado ?? "",
    idPoliza: f._kf_ID_Poliza ?? "",
    numero: f.NumeroSiniestro ?? "",
    numeroSiniestro2: getFirstValue(f, ["NumeroSiniestro2", "Numero_Siniestro_2"]),
    crawfordSini: getFirstValue(f, ["CrawfordSini", "Crawford_Sini"]),
    alias,
    compania: alias || getFirstValue(f, ["Compania", "Compañia"]),
    asegurado: f.Asegurado ?? getFirstValue(f, ["NombreAseg", "RazonSocial", "NombreCompleto"]),
    direccionCalle,
    via: getFirstValue(f, ["Via"]),
    calle: getFirstValue(f, ["Direccion"]),
    numeroCalle: getFirstValue(f, ["NumeroCalle", "Numero"]),
    bloque: getFirstValue(f, ["Bloque"]),
    escalera: getFirstValue(f, ["Escalera"]),
    planta: getFirstValue(f, ["Planta"]),
    puerta: getFirstValue(f, ["Puerta"]),
    distancia: getFirstValue(f, ["Distancia"]),
    direccion: [direccionCalle, f.Poblacion, f.CodPostal ?? f.CodigoPostal].filter(Boolean).join(" · ") || direccionCalle,
    poblacion: f.Poblacion ?? "",
    codPostal: getFirstValue(f, ["CodPostal", "CodigoPostal", "Cod_Postal"]),
    provincia: getFirstValue(f, ["Provincia"]),
    fechaRecepcion,
    horaRecepcion: getFirstValue(f, ["HoraRecepcion", "Hora_Recepcion"]),
    horaAsignacion: getFirstValue(f, ["HoraAsignacion", "Hora_Asignacion", "HAsig", "H_Asig"]),
    fechaEfectoPoliza: getFirstValue(f, [
      "FechaEfecto",
      "Fecha_Efecto",
      "siniestros_polizas::FechaEfecto",
      "siniestros_polizas:FechaEfecto",
    ]),
    descripcionRiesgo: getFirstValue(f, ["Descripcion", "DescripcionRiesgo", "Descripcion_riesgo"]),
    relatoSiniestro: getFirstValue(f, [
      "RelatoSiniestro",
      "Relato",
      "VersionSiniestro",
      "DescripcionSiniestro",
    ]),
    notasTramitacion: getFirstValue(f, ["NotasTramitacion", "Notas_Tramitacion", "CausaCrawford"]),
    fechaApertura:
      fechaRecepcion ||
      getFirstValue(f, ["FechaApertura", "FechaAlta", "FechaEncargo"]) ||
      new Date().toISOString(),
    fechaAsignacion: getFirstValue(f, [
      "FechaAsignacion",
      "Fecha_Asignacion",
      "FechaEncargo",
      "Fecha_Encargo",
      "FechaAlta",
      "FechaRecepcion",
      "FechaApertura",
    ]),
    diasAbierto: getFirstValue(f, ["DiasAbierto", "Dias_Abierto"]),
    diasUltimoPrevio: getFirstValue(f, ["DiasUltimoPrevio", "Dias_Ultimo_Previo"]),
    siguientePrevio: getFirstValue(f, ["SiguientePrevio", "Siguiente_Previo"]),
    zSumaPrevio: getFirstValue(f, ["zSumaPrevio", "SumaPrevio"]),
    zTotalCrawford: getFirstValue(f, ["zTotalCrawford", "TotalCrawford"]),
    tipo: f.TipoSiniestro ?? "",
    ramo: f.Ramo ?? "",
    numeroPoliza: getFirstValue(f, ["siniestros_polizas::NumeroPoliza", "siniestros_polizas:NumeroPoliza", "NumeroPoliza", "Poliza"]),
    fechaOcurrencia: getFirstValue(f, ["FechaOcurrencia", "Fecha_Ocurrencia", "F_Ocurrencia", "FechaSiniestro", "Fecha_Siniestro", "FechaDelSiniestro"]),
    fechaCierre: f.FechaCierre ?? "",
    valoracionTotal: f["ValoraciónTotal"] ?? f.ValoracionTotal ?? "",
    excluido: f.Excluido ?? "0",
  };
}
export async function obtenerDetalleSiniestro(siniestro: Siniestro): Promise<Siniestro> {
  if (USE_MOCK) {
    await wait(200);
    return siniestro;
  }
  const id = siniestro.idSiniestro || siniestro.id;
  if (!id) return siniestro;
  const data = await findRecords(
    FM_CONFIG.layoutSiniestros,
    { query: [{ _kp_ID_Siniestro: id }], limit: "1" },
    true
  );
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? { ...siniestro, ...mapearSiniestro(record) } : siniestro;
}

async function obtenerSiniestroPorRecordId(recordId: string): Promise<Siniestro | null> {
  const data = await fmRequest(FM_CONFIG.layoutSiniestros, `/records/${encodeURIComponent(recordId)}`);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? mapearSiniestro(record) : null;
}

function siniestroFieldDataBase(siniestro: Siniestro): Record<string, string> {
  return limpiarFieldData({
    NumeroSiniestro: textoCampo(siniestro.numero),
    NumeroSiniestro2: textoCampo(siniestro.numeroSiniestro2),
    CrawfordSini: textoCampo(siniestro.crawfordSini),
    Asegurado: textoCampo(siniestro.asegurado),
    Via: textoCampo(siniestro.via),
    Direccion: textoCampo(siniestro.calle),
    NumeroCalle: textoCampo(siniestro.numeroCalle),
    Numero: textoCampo(siniestro.numeroCalle),
    Bloque: textoCampo(siniestro.bloque),
    Escalera: textoCampo(siniestro.escalera),
    Planta: textoCampo(siniestro.planta),
    Puerta: textoCampo(siniestro.puerta),
    CodPostal: textoCampo(siniestro.codPostal),
    Poblacion: textoCampo(siniestro.poblacion),
    Provincia: textoCampo(siniestro.provincia),
    FechaRecepcion: textoCampo(siniestro.fechaRecepcion),
    HoraRecepcion: textoCampo(siniestro.horaRecepcion),
    TipoSiniestro: textoCampo(siniestro.tipo),
    FechaOcurrencia: textoCampo(siniestro.fechaOcurrencia),
    Descripcion: textoCampo(siniestro.descripcionRiesgo),
    RelatoSiniestro: textoCampo(siniestro.relatoSiniestro),
    NotasTramitacion: textoCampo(siniestro.notasTramitacion),
    _kf_ID_Asegurado: textoCampo(siniestro.idAsegurado),
    _kf_ID_Poliza: textoCampo(siniestro.idPoliza),
  });
}

async function siniestroFieldDataParaLayout(siniestro: Siniestro): Promise<Record<string, string>> {
  return filtrarFieldDataLayout(FM_CONFIG.layoutSiniestros, siniestroFieldDataBase(siniestro));
}

export async function crearSiniestro(siniestro: Siniestro): Promise<Siniestro> {
  if (!textoCampo(siniestro.numero)) {
    throw new Error("El número de siniestro es obligatorio");
  }

  if (USE_MOCK) {
    await wait(300);
    const id = `SIN-${Date.now()}`;
    return { ...siniestro, id, idSiniestro: id, recordId: `${Date.now()}` };
  }

  const fieldData = await siniestroFieldDataParaLayout(siniestro);
  const data = await fmRequest(FM_CONFIG.layoutSiniestros, "/records", {
    method: "POST",
    body: JSON.stringify({ fieldData }),
  });
  const recordId = String(data?.response?.recordId ?? "");
  return (recordId ? await obtenerSiniestroPorRecordId(recordId) : null) ?? siniestro;
}

export async function actualizarSiniestro(siniestro: Siniestro): Promise<Siniestro> {
  if (!siniestro.recordId) throw new Error("No se puede actualizar: falta recordId del siniestro");
  if (!textoCampo(siniestro.numero)) {
    throw new Error("El número de siniestro es obligatorio");
  }

  if (USE_MOCK) {
    await wait(300);
    return siniestro;
  }

  const fieldData = await siniestroFieldDataParaLayout(siniestro);
  await fmRequest(FM_CONFIG.layoutSiniestros, `/records/${encodeURIComponent(siniestro.recordId)}`, {
    method: "PATCH",
    body: JSON.stringify({ fieldData }),
  });
  return (await obtenerSiniestroPorRecordId(siniestro.recordId)) ?? siniestro;
}

export async function borrarSiniestro(siniestro: Siniestro): Promise<void> {
  if (!siniestro.recordId) throw new Error("No se puede borrar: falta recordId del siniestro");

  if (USE_MOCK) {
    await wait(200);
    return;
  }

  await fmRequest(FM_CONFIG.layoutSiniestros, `/records/${encodeURIComponent(siniestro.recordId)}`, {
    method: "DELETE",
  });
}

function mapearAsegurado(record: FileMakerRecord): Asegurado {
  const f = record.fieldData;
  const nombre = textoCampo(f.Nombre);
  const apellido1 = textoCampo(f.Apellido1);
  const apellido2 = textoCampo(f.Apellido2);
  const nombreCompleto = getFirstValue(f, ["NombreCompleto", "Apellidos"]);
  const razonSocial = textoCampo(f.RazonSocial);
  const displayName = razonSocial || nombreCompleto || [nombre, apellido1, apellido2].filter(Boolean).join(" ");
  const tipoPersona = tipoPersonaDesdeIsCIF(f.is_CIF, getFirstValue(f, ["TipoAseg", "TipoPersona"]));

  return {
    id: f._kp_ID_Asegurado || record.recordId,
    recordId: record.recordId,
    nif: textoCampo(f.NIF),
    tipoPersona,
    clientePrivado: normalizarBooleanoFM(getFirstValue(f, ["Is_ClientePrivado", "Is:ClientePrivado"])),
    aplicaRetencion: normalizarBooleanoFM(f.Is_Retencion),
    nombre,
    apellido1,
    apellido2,
    nombreCompleto,
    razonSocial,
    displayName,
    via: textoCampo(f.Via),
    direccion: textoCampo(f.Direccion),
    numeroCalle: textoCampo(f.NumeroCalle),
    bloque: textoCampo(f.Bloque),
    escalera: textoCampo(f.Escalera),
    planta: textoCampo(f.Planta),
    puerta: textoCampo(f.Puerta),
    codigoPostal: textoCampo(f.CodPostal ?? f.CodigoPostal),
    poblacion: textoCampo(f.Poblacion),
    provincia: textoCampo(f.Provincia),
    pais: textoCampo(f.Pais),
    direccionCompleta: getFirstValue(f, ["DireccCompleta", "DireccionCompleta"]),
    email: getFirstContacto(f, ["email", "Email", "Mail"]),
    telefono: getFirstContacto(f, ["TelefonoP", "Telefono", "Movil", "Tlf"]),
    telefonoSecundario: getFirstContacto(f, ["TelefonoS", "Telefono2"]),
  };
}

const ASEGURADO_CAMPOS_ALIASES: Record<string, string[]> = {
  Is_ClientePrivado: ["Is_ClientePrivado", "Is:ClientePrivado"],
  email: ["email", "Email", "Mail"],
  TelefonoP: ["TelefonoP", "Telefono", "Movil", "Tlf"],
  TelefonoS: ["TelefonoS", "Telefono2"],
  DireccCompleta: ["DireccCompleta", "DireccionCompleta"],
  CodPostal: ["CodPostal", "CodigoPostal"],
};

function buildDireccionCompletaAsegurado(asegurado: Asegurado): string {
  return (
    asegurado.direccionCompleta ||
    [asegurado.via, asegurado.direccion, asegurado.numeroCalle, asegurado.codigoPostal, asegurado.poblacion, asegurado.provincia]
      .filter(Boolean)
      .join(" ")
  );
}

function asignarCampoAseguradoFm(
  mapped: Record<string, string>,
  disponibles: Set<string>,
  candidatos: string[],
  valor: unknown,
  opts?: { enviarVacio?: boolean }
) {
  if (valor === undefined || valor === null) return;
  const texto = textoCampo(valor);
  if (!opts?.enviarVacio && texto === "") return;
  const nombre = elegirNombreCampo(disponibles, candidatos);
  if (nombre) mapped[nombre] = texto;
}

async function aseguradoFieldDataParaLayout(asegurado: Asegurado): Promise<Record<string, string>> {
  const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutAsegurados);
  const base = aseguradoToFieldData(asegurado, true);
  if (disponibles.size === 0) {
    return {
      ...base,
      DireccCompleta: buildDireccionCompletaAsegurado(asegurado),
    };
  }

  const mapped: Record<string, string> = {};
  const campos: Array<[string, string | undefined, boolean?]> = [
    ["NIF", asegurado.nif],
    ["is_CIF", isCIFDesdeTipoPersona(asegurado.tipoPersona), true],
    ["Is_ClientePrivado", asegurado.clientePrivado === "1" ? "1" : "0", true],
    ["Is_Retencion", asegurado.clientePrivado === "1" && asegurado.aplicaRetencion === "1" ? "1" : "0", true],
    ["Nombre", asegurado.nombre],
    ["Apellido1", asegurado.apellido1],
    ["Apellido2", asegurado.apellido2],
    ["RazonSocial", asegurado.razonSocial],
    ["Via", asegurado.via],
    ["Direccion", asegurado.direccion],
    ["NumeroCalle", asegurado.numeroCalle],
    ["Bloque", asegurado.bloque],
    ["Escalera", asegurado.escalera],
    ["Planta", asegurado.planta],
    ["Puerta", asegurado.puerta],
    ["CodPostal", asegurado.codigoPostal],
    ["Poblacion", asegurado.poblacion],
    ["Provincia", asegurado.provincia],
    ["Pais", asegurado.pais],
    ["DireccCompleta", buildDireccionCompletaAsegurado(asegurado)],
    ["email", asegurado.email],
    ["TelefonoP", asegurado.telefono],
    ["TelefonoS", asegurado.telefonoSecundario],
  ];

  for (const [logico, valor, enviarVacio] of campos) {
    const candidatos = ASEGURADO_CAMPOS_ALIASES[logico] ?? [logico];
    asignarCampoAseguradoFm(mapped, disponibles, candidatos, valor, { enviarVacio });
  }

  return filtrarFieldDataPorLayout(mapped, disponibles);
}

async function patchAseguradoConReintento(recordId: string, fieldData: Record<string, string>) {
  try {
    await fmRequest(FM_CONFIG.layoutAsegurados, `/records/${encodeURIComponent(recordId)}`, {
      method: "PATCH",
      body: JSON.stringify({ fieldData }),
    });
  } catch (error) {
    if (!isFieldMissingError(error)) throw error;

    const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutAsegurados);
    const reducido =
      disponibles.size > 0 ? filtrarFieldDataPorLayout(fieldData, disponibles) : fieldData;
    if (Object.keys(reducido).length === 0) throw error;

    await fmRequest(FM_CONFIG.layoutAsegurados, `/records/${encodeURIComponent(recordId)}`, {
      method: "PATCH",
      body: JSON.stringify({ fieldData: reducido }),
    });
  }
}

async function postAseguradoConReintento(fieldData: Record<string, string>) {
  try {
    return await fmRequest(FM_CONFIG.layoutAsegurados, "/records", {
      method: "POST",
      body: JSON.stringify({ fieldData }),
    });
  } catch (error) {
    if (!isFieldMissingError(error)) throw error;

    const disponibles = await obtenerNombresCamposLayout(FM_CONFIG.layoutAsegurados);
    const reducido =
      disponibles.size > 0 ? filtrarFieldDataPorLayout(fieldData, disponibles) : fieldData;
    if (Object.keys(reducido).length === 0) throw error;

    return fmRequest(FM_CONFIG.layoutAsegurados, "/records", {
      method: "POST",
      body: JSON.stringify({ fieldData: reducido }),
    });
  }
}

function aseguradoToFieldData(a: Asegurado, includeOptionalClientFields = true): Record<string, string> { return limpiarFieldData({ NIF: textoCampo(a.nif), is_CIF: isCIFDesdeTipoPersona(a.tipoPersona), ...(includeOptionalClientFields ? { Is_ClientePrivado: a.clientePrivado === "1" ? "1" : "0", Is_Retencion: a.clientePrivado === "1" && a.aplicaRetencion === "1" ? "1" : "0" } : {}), Nombre: textoCampo(a.nombre), Apellido1: textoCampo(a.apellido1), Apellido2: textoCampo(a.apellido2), RazonSocial: textoCampo(a.razonSocial), Via: textoCampo(a.via), Direccion: textoCampo(a.direccion), NumeroCalle: textoCampo(a.numeroCalle), Bloque: textoCampo(a.bloque), Escalera: textoCampo(a.escalera), Planta: textoCampo(a.planta), Puerta: textoCampo(a.puerta), CodPostal: textoCampo(a.codigoPostal), Poblacion: textoCampo(a.poblacion), Provincia: textoCampo(a.provincia), Pais: textoCampo(a.pais), DireccCompleta: buildDireccionCompletaAsegurado(a), email: textoCampo(a.email), TelefonoP: textoCampo(a.telefono), TelefonoS: textoCampo(a.telefonoSecundario) }); }
function contactoToFieldData(c: ContactoAsegurado, includeRelation: boolean): Record<string, string> { return limpiarFieldData({ ...(includeRelation ? { _kf_ID_Asegurado: c.idAsegurado } : {}), Nombre: c.nombre, Cargo: c.cargo, Telefono: c.telefono, Telefono2: c.telefono2, Movil: c.movil, Mail: c.mail, Notas: c.notas }); }
function polizaToFieldData(p: Poliza, includeRelation: boolean, enviarVacios = false): Record<string, string> {
  const v = (value?: unknown) => {
    const text = textoCampo(value);
    return enviarVacios ? text : text || undefined;
  };
  const vRelacion = (value?: unknown) => textoCampo(value) || undefined;

  return limpiarFieldData({
    ...(includeRelation ? { _kf_ID_Asegurado: vRelacion(p.idAsegurado) } : {}),
    _kf_ID_Ramo: vRelacion(p.idRamo),
    _kf_ID_Compania: vRelacion(p.idCompania),
    NumeroPoliza: v(p.numeroPoliza),
    Via: v(p.via),
    Direccion: v(p.direccion),
    NumeroCalle: v(p.numeroCalle),
    Bloque: v(p.bloque),
    Escalera: v(p.escalera),
    Planta: v(p.planta),
    Puerta: v(p.puerta),
    CodPostal: v(p.codigoPostal),
    Poblacion: v(p.poblacion),
    Provincia: v(p.provincia),
    NombreViaC: v(p.nombreViaC),
    ViaC: v(p.viaC),
    DireccionC: v(p.direccionC),
    NumeroCalleC: v(p.numeroCalleC),
    BloqueC: v(p.bloqueC),
    EscaleraC: v(p.escaleraC),
    PlantaC: v(p.plantaC),
    PuertaC: v(p.puertaC),
    [FM_CONFIG.polizaCampoCodPostalC]: v(p.codigoPostalC),
    PoblacionC: v(p.poblacionC),
    ProvinciaC: v(p.provinciaC),
    Catastro: v(p.catastro),
    AnoConstruccion: v(p.anoConstruccion),
    [FM_CONFIG.polizaCampoSupConstruidaTotal]: v(p.supConstruidaTotal),
    SupConstruidaTotal: v(p.supConstruidaTotal),
    FechaEfecto: v(p.fechaEfecto),
    Agente: v(p.agente),
    TlfAgente: v(p.telefonoAgente),
    EmailAgente: v(p.emailAgente),
    Descripcion: v(p.descripcion),
    Informacion: v(p.informacion),
    Comentarios: v(p.comentarios),
    MedidasPCI: v(p.medidasPci),
    MedidasRobo: v(p.medidasRobo),
    CtePoliza: v(p.ctePoliza),
    CtdoPoliza: v(p.ctdoPoliza),
    MobYMaqPoliza: v(p.mobYMaqPoliza),
    ExistenciasPoliza: v(p.existenciasPoliza),
    Embarcacion: v(p.embarcacion),
    CapitalPEMPoliza: v(p.capitalPemPoliza),
    CapitalRCPoliza: v(p.capitalRcPoliza),
    FacturacionDeclarada: v(p.facturacionDeclarada),
    Propietario: v(p.propietario),
    TotalContinente: v(p.totalContinente),
    CteVN: v(p.cteVn),
    DepreciaCte: v(p.depreciaCte),
    CteVR: v(p.cteVr),
    PrimerRiesgo: v(p.primerRiesgo),
    CoefInfraCte: v(p.coefInfraCte),
    CoefInfraCteVR: v(p.coefInfraCteVr),
    InfraseguroCrawfordCte: v(p.infraseguroCrawfordCte),
    CtdoVN: v(p.ctdoVn),
    DepreciaCtdo: v(p.depreciaCtdo),
    CtdoVR: v(p.ctdoVr),
    CoefInfraCtdo: v(p.coefInfraCtdo),
    CoefInfraCtdoVR: v(p.coefInfraCtdoVr),
    InfraseguroCrawfordCtdo: v(p.infraseguroCrawfordCtdo),
    MobYMaqVN: v(p.mobYMaqVn),
    DepreciaMobYMaq: v(p.depreciaMobYMaq),
    MobYMaqVR: v(p.mobYMaqVr),
    CoefInfraMobYMaqVN: v(p.coefInfraMobYMaqVn),
    CoefInfraMobYMaqVR: v(p.coefInfraMobYMaqVr),
    InfraseguroCrawfordMob: v(p.infraseguroCrawfordMob),
    ExistenciasReales: v(p.existenciasReales),
    CoefInfraExistencias: v(p.coefInfraExistencias),
    InfraseguroCrawfordExist: v(p.infraseguroCrawfordExist),
    EmbarcacionVR: v(p.embarcacionVr),
    CoefInfraEmbarcacion: v(p.coefInfraEmbarcacion),
    CapitalPEM: v(p.capitalPem),
    FacturacionReal: v(p.facturacionReal),
  });
}
function mapearContactoAsegurado(record: FileMakerRecord): ContactoAsegurado { const f = record.fieldData; return { id: f._kp_ID_ContactoAseg || record.recordId, recordId: record.recordId, idAsegurado: f._kf_ID_Asegurado ?? "", nombre: f.Nombre ?? "", nombreCompleto: f.NombreCompleto ?? f.Nombre ?? "", cargo: f.Cargo ?? "", telefono: f.Telefono ?? "", telefono2: f.Telefono2 ?? "", movil: f.Movil ?? "", mail: f.Mail ?? f.email ?? "", notas: f.Notas ?? "" }; }
function mapearPoliza(record: FileMakerRecord): Poliza {
  const f = record.fieldData;

  return normalizarPoliza({
    id: f._kp_ID_Poliza || record.recordId,
    recordId: record.recordId,
    idAsegurado: f._kf_ID_Asegurado ?? "",
    idRamo: f._kf_ID_Ramo ?? "",
    idCompania: f._kf_ID_Compania ?? f._kf_ID_Compañia ?? "",
    asegurado: getFirstValue(f, ["Asegurado", "NombreAseg", "RazonSocial", "NombreCompleto", "polizas_asegurados::NombreCompleto", "polizas_asegurados:RazonSocial"]),
    compania: getFirstValue(f, ["Compania", "Compañia", "polizas_companias::Compania", "polizas_companias:Compania", "polizas_COMPANIAS::Compania", "polizas_COMPANIAS:Compania", "polizas_companias_COMPANIAS::Compania", "polizas_companias_COMPANIAS:Compania"]),
    numeroPoliza: getFirstValue(f, ["NumeroPoliza", "NumeroPol", "Poliza"]),
    ramo: getFirstValue(f, ["Ramo", "polizas_ramos::Ramo", "polizas_ramos:Ramo"]),
    tipoRamo: getFirstValue(f, ["TipoRamo", "polizas_ramos::TipoRamo", "polizas_ramos:TipoRamo"]),
    direccionCompleta: getFirstValue(f, ["zVistaDireccionLinea", "DireccionCompleta", "DireccCompleta", "Direccion"]),
    via: f.Via ?? "",
    direccion: f.Direccion ?? "",
    numeroCalle: f.NumeroCalle ?? "",
    bloque: f.Bloque ?? "",
    escalera: f.Escalera ?? "",
    planta: f.Planta ?? "",
    puerta: f.Puerta ?? "",
    codigoPostal: f.CodPostal ?? f.CodigoPostal ?? "",
    poblacion: f.Poblacion ?? "",
    provincia: f.Provincia ?? "",
    nombreViaC: f.NombreViaC ?? "",
    viaC: f.ViaC ?? "",
    direccionC: f.DireccionC ?? "",
    numeroCalleC: f.NumeroCalleC ?? "",
    bloqueC: f.BloqueC ?? "",
    escaleraC: f.EscaleraC ?? "",
    plantaC: f.PlantaC ?? "",
    puertaC: f.PuertaC ?? "",
    codigoPostalC: getFirstValue(f, nombresCodPostalCPoliza()),
    poblacionC: getFirstValue(f, nombresPoblacionCPoliza()),
    provinciaC: getFirstValue(f, nombresProvinciaCPoliza()),
    codigoMunicipioCatastro: getFirstValue(f, nombresCodigoMunicipioCatastroPoliza()),
    catastro: getFirstValue(f, nombresCatastroPoliza()) || f.Catastro || "",
    anoConstruccion: f.AnoConstruccion ?? "",
    totalSuperficie: getFirstValue(f, ["TotalSuperficie", "SuperficieTotal", "Total_Superficie"]),
    supConstruidaTotal: getFirstValue(f, [
      FM_CONFIG.polizaCampoSupConstruidaTotal,
      "SupConstruidaTotal",
    ]),
    antiguedad: getFirstValue(f, ["Antiguedad", "Antigüedad", "Antiguedad"]),
    fechaEfecto: getFirstValue(f, ["FechaEfecto", "Fecha_Efecto", "F_Efecto"]),
    nSiniestros: f.NSiniestros ?? "",
    agente: f.Agente ?? "",
    telefonoAgente: f.TlfAgente ?? f.TlfAgente2 ?? "",
    emailAgente: f.EmailAgente ?? "",
    descripcion: f.Descripcion ?? "",
    informacion: f.Informacion ?? "",
    comentarios: f.Comentarios ?? "",
    medidasPci: getFirstValue(f, ["MedidasPCI", "MedidasPci", "Medidas_PCI"]),
    medidasRobo: getFirstValue(f, ["MedidasRobo", "Medidas_Robo"]),
    ctePoliza: getFirstValue(f, ["CtePoliza", "Cte_Poliza"]),
    ctdoPoliza: getFirstValue(f, ["CtdoPoliza", "Ctdo_Poliza"]),
    mobYMaqPoliza: getFirstValue(f, ["MobYMaqPoliza", "MobYMaq_Poliza"]),
    existenciasPoliza: getFirstValue(f, ["ExistenciasPoliza", "Existencias_Poliza"]),
    embarcacion: getFirstValue(f, ["Embarcacion", "Embarcación"]),
    capitalPemPoliza: getFirstValue(f, ["CapitalPEMPoliza", "CapitalPEM_Poliza"]),
    capitalRcPoliza: getFirstValue(f, ["CapitalRCPoliza", "CapitalRC_Poliza"]),
    facturacionDeclarada: getFirstValue(f, ["FacturacionDeclarada", "Facturacion_Declarada"]),
    propietario: getFirstValue(f, ["Propietario"]),
    totalContinente: getFirstValue(f, ["TotalContinente", "Total_Continente"]),
    cteVn: getFirstValue(f, ["CteVN", "Cte_VN"]),
    depreciaCte: getFirstValue(f, ["DepreciaCte", "Deprecia_Cte"]),
    cteVr: getFirstValue(f, ["CteVR", "Cte_VR"]),
    primerRiesgo: getFirstValue(f, ["PrimerRiesgo", "Primer_Riesgo"]),
    coefInfraCte: getFirstValue(f, ["CoefInfraCte", "Coef_InfraCte"]),
    coefInfraCteVr: getFirstValue(f, ["CoefInfraCteVR", "CoefInfraCte_VR"]),
    infraseguroCrawfordCte: getFirstValue(f, ["InfraseguroCrawfordCte", "Infraseguro_Crawford_Cte"]),
    ctdoVn: getFirstValue(f, ["CtdoVN", "Ctdo_VN"]),
    depreciaCtdo: getFirstValue(f, ["DepreciaCtdo", "Deprecia_Ctdo"]),
    ctdoVr: getFirstValue(f, ["CtdoVR", "Ctdo_VR"]),
    coefInfraCtdo: getFirstValue(f, ["CoefInfraCtdo", "Coef_InfraCtdo"]),
    coefInfraCtdoVr: getFirstValue(f, ["CoefInfraCtdoVR", "CoefInfraCtdo_VR"]),
    infraseguroCrawfordCtdo: getFirstValue(f, ["InfraseguroCrawfordCtdo", "Infraseguro_Crawford_Ctdo"]),
    mobYMaqVn: getFirstValue(f, ["MobYMaqVN", "MobYMaq_VN"]),
    depreciaMobYMaq: getFirstValue(f, ["DepreciaMobYMaq", "Deprecia_MobYMaq"]),
    mobYMaqVr: getFirstValue(f, ["MobYMaqVR", "MobYMaq_VR"]),
    coefInfraMobYMaqVn: getFirstValue(f, ["CoefInfraMobYMaqVN", "CoefInfraMobYMaq_VN"]),
    coefInfraMobYMaqVr: getFirstValue(f, ["CoefInfraMobYMaqVR", "CoefInfraMobYMaq_VR"]),
    infraseguroCrawfordMob: getFirstValue(f, ["InfraseguroCrawfordMob", "Infraseguro_Crawford_Mob"]),
    existenciasReales: getFirstValue(f, ["ExistenciasReales", "Existencias_Reales"]),
    coefInfraExistencias: getFirstValue(f, ["CoefInfraExistencias", "Coef_InfraExistencias"]),
    infraseguroCrawfordExist: getFirstValue(f, ["InfraseguroCrawfordExist", "Infraseguro_Crawford_Exist"]),
    embarcacionVr: getFirstValue(f, ["EmbarcacionVR", "Embarcacion_VR"]),
    coefInfraEmbarcacion: getFirstValue(f, ["CoefInfraEmbarcacion", "Coef_InfraEmbarcacion"]),
    capitalPem: getFirstValue(f, ["CapitalPEM", "Capital_PEM"]),
    facturacionReal: getFirstValue(f, ["FacturacionReal", "Facturacion_Real"]),
    distancia: extraerDistanciaFieldData(f),
    latitud: extraerCoordenadaFieldData(f, "lat"),
    longitud: extraerCoordenadaFieldData(f, "lng"),
  });
}
function extraerCoordenadaFieldData(f: Record<string, string>, tipo: "lat" | "lng"): string {
  const keys =
    tipo === "lat"
      ? [FM_CONFIG.campoLatitudPoliza, "Latitud", "latitud", "Lat", "Latitude"]
      : [FM_CONFIG.campoLongitudPoliza, "Longitud", "longitud", "Lng", "Long", "Longitude"];
  const direct = getFirstValue(f, keys);
  if (direct) return direct;

  const pattern = tipo === "lat" ? /latitud|^lat$/i : /longitud|^lng$|^long$/i;
  for (const [key, value] of Object.entries(f)) {
    if (pattern.test(key) && String(value ?? "").trim()) {
      return String(value).trim();
    }
  }

  return "";
}
function extraerDistanciaFieldData(f: Record<string, string>): string {
  const direct = getFirstValue(f, [
    "Distancia",
    "DistanciaPoliza",
    "Distancia_Km",
    "DistanciaKm",
    "Distancia_km",
    "zDistancia",
    "zDistanciaKm",
  ]);
  if (direct) return direct;

  for (const [key, value] of Object.entries(f)) {
    if (/distancia/i.test(key) && String(value ?? "").trim()) {
      return String(value).trim();
    }
  }

  return "";
}
function mapearRamo(record: FileMakerRecord): Ramo {
  const f = record.fieldData;
  return {
    id: f._kp_ID_Ramo || record.recordId,
    recordId: record.recordId,
    idCompania: f._kf_ID_Compania ?? f._kf_ID_Compañia ?? "",
    ramo: f.Ramo ?? "",
    tipoRamo: f.TipoRamo ?? "",
  };
}

export async function listarRamosPorCompania(idCompania: string, limit = 200): Promise<Ramo[]> {
  if (!idCompania) return [];
  if (USE_MOCK) return [];
  const data = await findRecords(
    FM_CONFIG.layoutRamos,
    { query: [{ _kf_ID_Compania: idCompania }], limit: String(limit) },
    true
  );
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearRamo);
}
function mapearCompania(record: FileMakerRecord): Compania {
  const f = record.fieldData;

  return {
    id: f._kp_ID_Compania || record.recordId,
    recordId: record.recordId,
    nombre: getFirstValue(f, ["Compania", "Compañia"]),
    alias: getFirstValue(f, ["Alias", "AliasCompania", "AliasCompañia"]),
  };
}

export async function ejecutarScriptEnviarEnlace(numeroSiniestro: string, movil: string): Promise<EnviarEnlaceResult> { const movilNormalizado = normalizarMovil(movil); if (!movilNormalizado) throw new Error("Introduce un numero de movil valido"); if (USE_MOCK) { await wait(800); const texto = `Enlace de subida de documentacion para el siniestro ${numeroSiniestro}: https://example.com/subida/${encodeURIComponent(numeroSiniestro)}`; return { ok: true, movil: movilNormalizado, texto, url: crearWhatsAppUrl(movilNormalizado, texto) }; } const scriptParam = { numeroSiniestro, movil: movilNormalizado }; const url = `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layout}/script/${encodeURIComponent(FM_CONFIG.scriptEnviarEnlace)}?script.param=${encodeURIComponent(JSON.stringify(scriptParam))}`; const res = await fetch(url, { headers: { [AUTH_HEADER]: authToken() } }); if (!res.ok) throw new Error("No se pudo ejecutar el script"); const data = await res.json(); const scriptResult = data?.response?.scriptResult; if (!scriptResult) return { ok: true, raw: data }; try { const parsed = JSON.parse(scriptResult) as EnviarEnlaceResult; return { ...parsed, ok: parsed.ok ?? true, movil: parsed.movil ?? movilNormalizado, url: parsed.url ?? (parsed.texto ? crearWhatsAppUrl(parsed.movil ?? movilNormalizado, parsed.texto) : undefined), raw: data }; } catch { return { ok: true, texto: scriptResult, movil: movilNormalizado, raw: data }; } }
export function abrirWhatsApp(result: EnviarEnlaceResult) { const url = result.url ?? (result.movil && result.texto ? crearWhatsAppUrl(result.movil, result.texto) : undefined); if (!url) return false; window.location.href = url; return true; }

export async function ejecutarScriptWebCatastro(
  poliza: Poliza,
  referenciaCatastral: string
): Promise<{ scriptResult?: string }> {
  const ref = referenciaCatastral.trim();
  if (!ref) throw new Error("Falta la referencia catastral");

  if (USE_MOCK) {
    await wait(400);
    return { scriptResult: JSON.stringify({ ok: true, referenciaCatastral: ref }) };
  }

  if (!poliza.recordId) {
    throw new Error("Guarda la póliza antes de abrir el catastro con el guión WebCatastro");
  }

  const scriptParam = {
    recordId: poliza.recordId,
    idPoliza: poliza.id,
    referenciaCatastral: ref,
    RefCat: ref,
    catastro: ref,
    poblacionC: poliza.poblacionC,
    imprimirCroquis: true,
  };

  const qs = new URLSearchParams({
    script: FM_CONFIG.scriptWebCatastro,
    "script.param": JSON.stringify(scriptParam),
  });

  const data = await fmRequest(
    FM_CONFIG.layoutPolizas,
    `/records/${encodeURIComponent(poliza.recordId)}?${qs.toString()}`,
    { method: "GET" }
  );

  const scriptResult = data?.response?.scriptResult;
  return { scriptResult: scriptResult != null ? String(scriptResult) : undefined };
}

export async function ejecutarScriptRellenarDireccionAsegurado(poliza: Poliza): Promise<void> {
  if (USE_MOCK) {
    await wait(300);
    return;
  }

  if (!poliza.recordId) {
    throw new Error("No se puede ejecutar: falta recordId de la póliza");
  }

  const scriptParam = {
    recordId: poliza.recordId,
    polizaRecordId: poliza.recordId,
    idPoliza: poliza.id,
    polizaId: poliza.id,
    idAsegurado: poliza.idAsegurado,
    aseguradoId: poliza.idAsegurado,
  };

  // Importante: este script depende de la relación Pólizas→Asegurados.
  // Por eso lo ejecutamos *en el contexto del registro* de la póliza (records/{recordId}),
  // no en el endpoint /script/ (que no fija registro actual).
  const qs = new URLSearchParams({
    script: FM_CONFIG.scriptRellenarDireccionAsegurado,
    "script.param": JSON.stringify(scriptParam),
  });

  await fmRequest(
    FM_CONFIG.layoutPolizas,
    `/records/${encodeURIComponent(poliza.recordId)}?${qs.toString()}`,
    { method: "GET" }
  );
}

function tipoPersonaDesdeIsCIF(isCIF: string | undefined, fallback = "") { const valor = String(isCIF ?? "").trim(); if (valor === "1") return "Persona jurídica"; if (valor === "0") return "Persona física"; return fallback || "Persona física"; }
function isCIFDesdeTipoPersona(tipoPersona: string) { return tipoPersona.toLowerCase().includes("jur") ? "1" : "0"; }
function normalizarBooleanoFM(value: string | undefined) { return String(value ?? "").trim() === "1" ? "1" : "0"; }
function isFieldMissingError(error: unknown) { return error instanceof Error && (error.message.includes("102") || error.message.toLowerCase().includes("field is missing") || error.message.toLowerCase().includes("field missing") || error.message.toLowerCase().includes("file missing")); }
function isFieldNotModifiableError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("201") ||
      error.message.toLowerCase().includes("cannot be modified") ||
      error.message.toLowerCase().includes("no se puede modificar") ||
      error.message.toLowerCase().includes("field cannot be modified"))
  );
}
function isFieldSkippablePatchError(error: unknown) {
  return isFieldMissingError(error) || isFieldNotModifiableError(error);
}
function limpiarFieldData(data: Record<string, string | undefined>) { return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Record<string, string>; }
function calcularNombreCompleto(a: Asegurado) { return [a.nombre, a.apellido1, a.apellido2].filter(Boolean).join(" "); }
function calcularDisplayName(a: Asegurado) { return a.razonSocial || a.nombreCompleto || calcularNombreCompleto(a); }
function calcularNombreContacto(c: ContactoAsegurado) { return c.nombreCompleto || c.nombre; }
function calcularDireccionCompleta(a: Asegurado) { return [[a.via, a.direccion, a.numeroCalle].filter(Boolean).join(" "), [a.bloque ? `Bloque ${a.bloque}` : "", a.escalera ? `Esc. ${a.escalera}` : "", a.planta ? `Planta ${a.planta}` : "", a.puerta ? `Puerta ${a.puerta}` : ""].filter(Boolean).join(" "), [a.codigoPostal, a.poblacion].filter(Boolean).join(" "), a.provincia, a.pais].filter(Boolean).join(" · "); }
function completarAseguradoLocal(a: Asegurado): Asegurado { return { ...a, nombreCompleto: calcularNombreCompleto(a), displayName: calcularDisplayName(a), direccionCompleta: calcularDireccionCompleta(a), aplicaRetencion: a.clientePrivado === "1" ? a.aplicaRetencion : "0" }; }
function fusionarAseguradoTrasGuardar(guardado: Asegurado, enviado: Asegurado): Asegurado {
  const preferir = (remoto: string, local: string) =>
    valorContactoVisible(remoto) || valorContactoVisible(local) || textoCampo(remoto) || textoCampo(local);

  return completarAseguradoLocal({
    ...guardado,
    telefono: preferir(guardado.telefono, enviado.telefono),
    telefonoSecundario: preferir(guardado.telefonoSecundario, enviado.telefonoSecundario),
    email: preferir(guardado.email, enviado.email),
    via: textoCampo(guardado.via) || textoCampo(enviado.via),
    direccion: textoCampo(guardado.direccion) || textoCampo(enviado.direccion),
    numeroCalle: textoCampo(guardado.numeroCalle) || textoCampo(enviado.numeroCalle),
    codigoPostal: textoCampo(guardado.codigoPostal) || textoCampo(enviado.codigoPostal),
    poblacion: textoCampo(guardado.poblacion) || textoCampo(enviado.poblacion),
    provincia: textoCampo(guardado.provincia) || textoCampo(enviado.provincia),
    pais: textoCampo(guardado.pais) || textoCampo(enviado.pais),
    direccionCompleta:
      textoCampo(guardado.direccionCompleta) || textoCampo(enviado.direccionCompleta),
  });
}

function getFirstContacto(fieldData: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = valorContactoVisible(fieldData[key]);
    if (value) return value;
  }
  return "";
}

function getFirstValue(fieldData: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = fieldData[key];
    if (value !== undefined && value !== null && value !== "") return textoCampo(value);
  }
  return "";
}
function getFileMakerErrorMessage(data: unknown) { const messages = (data as { messages?: { code: string; message: string }[] } | null)?.messages; return messages?.length ? messages.map((m) => `${m.code}: ${m.message}`).join(" · ") : ""; }
function crearWhatsAppUrl(movil: string, texto: string) { return `https://wa.me/${normalizarMovil(movil)}?text=${encodeURIComponent(texto)}`; }
function normalizarMovil(movil: string) { const limpio = movil.replace(/[^0-9+]/g, ""); if (!limpio) return ""; if (limpio.startsWith("+")) return limpio.slice(1); if (limpio.startsWith("00")) return limpio.slice(2); if (limpio.length === 9) return `34${limpio}`; return limpio; }
function debug(message: string, data?: unknown) { if (!DEBUG_FM) return; console.log(`[FileMaker] ${message}`, data ?? ""); }
function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
