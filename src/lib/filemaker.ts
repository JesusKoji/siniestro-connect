import {
  Asegurado,
  aseguradoMock,
  ContactoAsegurado,
  contactosAseguradoMock,
  Poliza,
  polizasMock,
  Siniestro,
  siniestrosMock,
} from "@/data/siniestros";

export const FM_CONFIG = {
  host: import.meta.env.VITE_FM_HOST ?? "",
  database: import.meta.env.VITE_FM_DATABASE ?? "GestionPericial",
  layout: import.meta.env.VITE_FM_LAYOUT ?? "API_EnlacesSiniestros",
  layoutSiniestros: import.meta.env.VITE_FM_LAYOUT_SINIESTROS ?? "API_Siniestros",
  layoutAsegurados: import.meta.env.VITE_FM_LAYOUT_ASEGURADOS ?? "API_Asegurados",
  layoutContactosAsegurado: import.meta.env.VITE_FM_LAYOUT_CONTACTOS_ASEGURADO ?? "API_ContactosAsegurado",
  layoutPolizas: import.meta.env.VITE_FM_LAYOUT_POLIZAS ?? "API_Polizas",
  scriptEnviarEnlace: import.meta.env.VITE_FM_SCRIPT_ENVIAR_ENLACE ?? "SMS",
  filtroEnCursoCampo: import.meta.env.VITE_FM_FILTRO_EN_CURSO_CAMPO ?? "FechaCierre",
  filtroEnCursoValor: import.meta.env.VITE_FM_FILTRO_EN_CURSO_VALOR ?? "=",
};

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";
const DEBUG_FM = (import.meta.env.VITE_DEBUG_FM ?? "false") === "true";
const FALLBACK_LISTAR_REGISTROS = (import.meta.env.VITE_FM_FALLBACK_LISTAR_REGISTROS ?? "true") !== "false";

let token: string | null = null;

export interface EnviarEnlaceResult {
  ok: boolean;
  url?: string;
  texto?: string;
  movil?: string;
  raw?: unknown;
}

type FileMakerRecord = {
  recordId: string;
  fieldData: Record<string, string>;
};

async function login(usuario: string, password: string): Promise<string> {
  if (USE_MOCK) {
    await wait(600);
    if (!usuario || !password) throw new Error("Credenciales requeridas");
    token = "mock-token";
    return token;
  }

  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${usuario}:${password}`),
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) throw new Error("Usuario o contraseña incorrectos");
  const data = await res.json();
  token = data.response.token;
  return token!;
}

export async function autenticar(usuario: string, password: string) {
  return login(usuario, password);
}

export function cerrarSesion() {
  token = null;
}

export async function listarSiniestrosEnCurso(): Promise<Siniestro[]> {
  if (USE_MOCK) {
    await wait(400);
    return siniestrosMock;
  }

  const registrosFiltrados = await buscarRegistrosEnCurso();
  if (registrosFiltrados.length > 0) return registrosFiltrados.map(mapearSiniestro);
  if (!FALLBACK_LISTAR_REGISTROS) return [];

  debug("La busqueda por FechaCierre no devolvio registros. Probando lectura y filtro en cliente.");
  const registros = await listarRegistrosLayout(FM_CONFIG.layout, 200);
  const campoFiltro = FM_CONFIG.filtroEnCursoCampo;
  const filtradosEnCliente = registros.filter((record) => {
    const valor = record.fieldData[campoFiltro];
    return valor === undefined || valor === null || String(valor).trim() === "";
  });
  debug("Fallback registros", { total: registros.length, filtrados: filtradosEnCliente.length, campoFiltro });
  return filtradosEnCliente.map(mapearSiniestro);
}

export async function listarAsegurados(limit = 100): Promise<Asegurado[]> {
  if (USE_MOCK) {
    await wait(250);
    return [aseguradoMock];
  }
  const registros = await listarRegistrosLayout(FM_CONFIG.layoutAsegurados, limit);
  return registros.map(mapearAsegurado);
}

export async function obtenerAsegurado(idAsegurado?: string): Promise<Asegurado | null> {
  if (!idAsegurado) return null;
  if (USE_MOCK) {
    await wait(250);
    return aseguradoMock;
  }
  const body = { query: [{ _kp_ID_Asegurado: idAsegurado }], limit: "1" };
  debug("Find asegurado", { layout: FM_CONFIG.layoutAsegurados, body });
  const data = await findRecords(FM_CONFIG.layoutAsegurados, body, true);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? mapearAsegurado(record) : null;
}

async function obtenerAseguradoPorRecordId(recordId: string): Promise<Asegurado | null> {
  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layoutAsegurados}/records/${recordId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => null);
  debug("Get asegurado by recordId response", data);
  if (!res.ok) throw new Error(getFileMakerErrorMessage(data) || "No se pudo leer el asegurado guardado");
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? mapearAsegurado(record) : null;
}

export async function buscarAsegurados(texto: string): Promise<Asegurado[]> {
  const q = texto.trim();
  if (!q) return [];
  if (USE_MOCK) {
    await wait(200);
    return [aseguradoMock].filter((a) =>
      [a.displayName, a.nif, a.direccionCompleta, a.poblacion, a.provincia].join(" ").toLowerCase().includes(q.toLowerCase())
    );
  }
  const body = {
    query: [
      { NIF: `*${q}*` },
      { NombreCompleto: `*${q}*` },
      { RazonSocial: `*${q}*` },
      { DireccCompleta: `*${q}*` },
      { Poblacion: `*${q}*` },
    ],
    limit: "100",
  };
  debug("Find asegurados", { layout: FM_CONFIG.layoutAsegurados, body });
  const data = await findRecords(FM_CONFIG.layoutAsegurados, body, true);
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearAsegurado);
}

export async function crearAsegurado(asegurado: Asegurado): Promise<Asegurado> {
  const fieldData = aseguradoToFieldData(asegurado);
  if (USE_MOCK) {
    await wait(300);
    return completarAseguradoLocal({ ...asegurado, id: asegurado.id || `Asegurado_${Date.now()}`, recordId: `${Date.now()}` });
  }
  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layoutAsegurados}/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fieldData }),
  });
  const data = await res.json().catch(() => null);
  debug("Create asegurado response", data);
  if (!res.ok) throw new Error(getFileMakerErrorMessage(data) || "No se pudo crear el asegurado");
  const recordId = String(data?.response?.recordId ?? "");
  return (recordId ? await obtenerAseguradoPorRecordId(recordId) : null) ?? completarAseguradoLocal({ ...asegurado, recordId });
}

export async function actualizarAsegurado(asegurado: Asegurado): Promise<Asegurado> {
  if (!asegurado.recordId) throw new Error("No se puede actualizar: falta recordId del asegurado");
  const fieldData = aseguradoToFieldData(asegurado);
  if (USE_MOCK) {
    await wait(300);
    return completarAseguradoLocal(asegurado);
  }
  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layoutAsegurados}/records/${asegurado.recordId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fieldData }),
  });
  const data = await res.json().catch(() => null);
  debug("Update asegurado response", data);
  if (!res.ok) throw new Error(getFileMakerErrorMessage(data) || "No se pudo actualizar el asegurado");
  return (await obtenerAseguradoPorRecordId(asegurado.recordId)) ?? completarAseguradoLocal(asegurado);
}

export async function obtenerContactosAsegurado(idAsegurado?: string): Promise<ContactoAsegurado[]> {
  if (!idAsegurado) return [];
  if (USE_MOCK) {
    await wait(150);
    return contactosAseguradoMock;
  }
  const body = { query: [{ _kf_ID_Asegurado: idAsegurado }], limit: "100" };
  debug("Find contactos asegurado", { layout: FM_CONFIG.layoutContactosAsegurado, body });
  const data = await findRecords(FM_CONFIG.layoutContactosAsegurado, body, true);
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearContactoAsegurado);
}

export async function obtenerPolizasAsegurado(idAsegurado?: string): Promise<Poliza[]> {
  if (!idAsegurado) return [];
  if (USE_MOCK) {
    await wait(150);
    return polizasMock;
  }
  const body = { query: [{ _kf_ID_Asegurado: idAsegurado }], limit: "100" };
  debug("Find polizas asegurado", { layout: FM_CONFIG.layoutPolizas, body });
  const data = await findRecords(FM_CONFIG.layoutPolizas, body, true);
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearPoliza);
}

export async function obtenerSiniestrosAsegurado(idAsegurado?: string): Promise<Siniestro[]> {
  if (!idAsegurado) return [];
  if (USE_MOCK) {
    await wait(150);
    return siniestrosMock;
  }
  const body = { query: [{ _kf_ID_Asegurado: idAsegurado }], limit: "100" };
  debug("Find siniestros asegurado", { layout: FM_CONFIG.layoutSiniestros, body });
  const data = await findRecords(FM_CONFIG.layoutSiniestros, body, true);
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearSiniestro);
}

async function buscarRegistrosEnCurso(): Promise<FileMakerRecord[]> {
  const body = { query: [{ [FM_CONFIG.filtroEnCursoCampo]: FM_CONFIG.filtroEnCursoValor }], limit: "200" };
  debug("Find siniestros", { layout: FM_CONFIG.layout, body });
  const data = await findRecords(FM_CONFIG.layout, body);
  debug("Find siniestros response", data);
  return data?.response?.data ?? [];
}

async function findRecords(layout: string, body: object, emptyIsOk = false) {
  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${layout}/_find`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const code = data?.messages?.[0]?.code;
    if (emptyIsOk && code === "401") return { response: { data: [] }, messages: data?.messages };
    throw new Error(getFileMakerErrorMessage(data) || `No se pudo consultar el layout ${layout}`);
  }
  const code = data?.messages?.[0]?.code;
  if (emptyIsOk && code === "401") return { response: { data: [] }, messages: data?.messages };
  return data;
}

async function listarRegistrosLayout(layout: string, limit = 200): Promise<FileMakerRecord[]> {
  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${layout}/records?_limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => null);
  debug(`List records response ${layout}`, data);
  if (!res.ok) throw new Error(getFileMakerErrorMessage(data) || `No se pudieron listar registros del layout ${layout}`);
  return data?.response?.data ?? [];
}

function mapearSiniestro(record: FileMakerRecord): Siniestro {
  const fieldData = record.fieldData;
  return {
    id: getFirstValue(fieldData, ["_kp_ID_Siniestro", "id"]) || record.recordId,
    idSiniestro: getFirstValue(fieldData, ["_kp_ID_Siniestro", "id"]),
    idAsegurado: fieldData._kf_ID_Asegurado ?? "",
    idPoliza: fieldData._kf_ID_Poliza ?? "",
    numero: fieldData.NumeroSiniestro ?? "",
    compania: getFirstValue(fieldData, ["siniestros_polizas_COMPANIAS::Alias", "siniestros_polizas_COMPANIAS:Alias", "Alias"]),
    asegurado: fieldData.Asegurado ?? getFirstValue(fieldData, ["NombreAseg", "RazonSocial", "NombreCompleto"]),
    direccion: fieldData.zVistaDireccionCrawfordEnLinea ?? getFirstValue(fieldData, ["DireccionCompleta", "DireccCompleta", "Direccion"]),
    fechaApertura: getFirstValue(fieldData, ["FechaApertura", "FechaAlta", "FechaEncargo", "FechaRecepcion"]) || new Date().toISOString(),
    tipo: fieldData.TipoSiniestro ?? "",
  };
}

export async function obtenerDetalleSiniestro(siniestro: Siniestro): Promise<Siniestro> {
  if (siniestro.idAsegurado && siniestro.idPoliza) return siniestro;
  if (USE_MOCK) {
    await wait(200);
    return siniestro;
  }
  const idSiniestro = siniestro.idSiniestro || siniestro.id;
  const body = { query: [{ _kp_ID_Siniestro: idSiniestro }], limit: "1" };
  debug("Find detalle siniestro", { layout: FM_CONFIG.layoutSiniestros, body });
  const data = await findRecords(FM_CONFIG.layoutSiniestros, body, true);
  debug("Find detalle siniestro response", data);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? { ...siniestro, ...mapearSiniestro(record) } : siniestro;
}

function mapearAsegurado(record: FileMakerRecord): Asegurado {
  const fieldData = record.fieldData;
  const nombre = fieldData.Nombre ?? "";
  const apellido1 = fieldData.Apellido1 ?? "";
  const apellido2 = fieldData.Apellido2 ?? "";
  const nombreCompleto = getFirstValue(fieldData, ["NombreCompleto", "Apellidos"]);
  const razonSocial = fieldData.RazonSocial ?? "";
  const displayName = razonSocial || nombreCompleto || [nombre, apellido1, apellido2].filter(Boolean).join(" ");
  return {
    id: fieldData._kp_ID_Asegurado || record.recordId,
    recordId: record.recordId,
    nif: fieldData.NIF ?? "",
    tipoPersona: getFirstValue(fieldData, ["TipoAseg", "TipoPersona"]),
    nombre,
    apellido1,
    apellido2,
    nombreCompleto,
    razonSocial,
    displayName,
    via: fieldData.Via ?? "",
    direccion: fieldData.Direccion ?? "",
    numeroCalle: fieldData.NumeroCalle ?? "",
    codigoPostal: fieldData.CodPostal ?? "",
    poblacion: fieldData.Poblacion ?? "",
    provincia: fieldData.Provincia ?? "",
    pais: fieldData.Pais ?? "",
    direccionCompleta: getFirstValue(fieldData, ["DireccCompleta", "DireccionCompleta"]),
    email: fieldData.email ?? fieldData.Email ?? "",
    telefono: fieldData.Telefono ?? "",
  };
}

function aseguradoToFieldData(asegurado: Asegurado): Record<string, string> {
  return limpiarFieldData({
    NIF: asegurado.nif,
    TipoAseg: asegurado.tipoPersona,
    Nombre: asegurado.nombre,
    Apellido1: asegurado.apellido1,
    Apellido2: asegurado.apellido2,
    RazonSocial: asegurado.razonSocial,
    Via: asegurado.via,
    Direccion: asegurado.direccion,
    NumeroCalle: asegurado.numeroCalle,
    CodPostal: asegurado.codigoPostal,
    Poblacion: asegurado.poblacion,
    Provincia: asegurado.provincia,
    Pais: asegurado.pais,
    email: asegurado.email,
    Telefono: asegurado.telefono,
  });
}

function limpiarFieldData(data: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Record<string, string>;
}

function calcularNombreCompleto(asegurado: Asegurado) {
  return [asegurado.nombre, asegurado.apellido1, asegurado.apellido2].filter(Boolean).join(" ");
}

function calcularDisplayName(asegurado: Asegurado) {
  return asegurado.razonSocial || asegurado.nombreCompleto || calcularNombreCompleto(asegurado);
}

function calcularDireccionCompleta(asegurado: Asegurado) {
  return [
    [asegurado.via, asegurado.direccion, asegurado.numeroCalle].filter(Boolean).join(" "),
    [asegurado.codigoPostal, asegurado.poblacion].filter(Boolean).join(" "),
    asegurado.provincia,
    asegurado.pais,
  ].filter(Boolean).join(" · ");
}

function completarAseguradoLocal(asegurado: Asegurado): Asegurado {
  return {
    ...asegurado,
    nombreCompleto: calcularNombreCompleto(asegurado),
    displayName: calcularDisplayName(asegurado),
    direccionCompleta: calcularDireccionCompleta(asegurado),
  };
}

function mapearContactoAsegurado(record: FileMakerRecord): ContactoAsegurado {
  const f = record.fieldData;
  return {
    id: f._kp_ID_ContactoAseg || record.recordId,
    idAsegurado: f._kf_ID_Asegurado ?? "",
    nombre: f.Nombre ?? "",
    nombreCompleto: f.NombreCompleto ?? f.Nombre ?? "",
    cargo: f.Cargo ?? "",
    telefono: f.Telefono ?? "",
    telefono2: f.Telefono2 ?? "",
    movil: f.Movil ?? "",
    mail: f.Mail ?? f.email ?? "",
    notas: f.Notas ?? "",
  };
}

function mapearPoliza(record: FileMakerRecord): Poliza {
  const f = record.fieldData;
  return {
    id: f._kp_ID_Poliza || record.recordId,
    idAsegurado: f._kf_ID_Asegurado ?? "",
    numeroPoliza: f.NumeroPoliza ?? "",
    direccionCompleta: getFirstValue(f, ["DireccionCompleta", "DireccCompleta", "Direccion"]),
    poblacion: f.Poblacion ?? "",
    provincia: f.Provincia ?? "",
    agente: f.Agente ?? "",
    telefonoAgente: f.TlfAgente ?? f.TlfAgente2 ?? "",
    emailAgente: f.EmailAgente ?? "",
  };
}

export async function ejecutarScriptEnviarEnlace(numeroSiniestro: string, movil: string): Promise<EnviarEnlaceResult> {
  const movilNormalizado = normalizarMovil(movil);
  if (!movilNormalizado) throw new Error("Introduce un numero de movil valido");
  if (USE_MOCK) {
    await wait(800);
    const texto = `Enlace de subida de documentacion para el siniestro ${numeroSiniestro}: https://example.com/subida/${encodeURIComponent(numeroSiniestro)}`;
    return { ok: true, movil: movilNormalizado, texto, url: crearWhatsAppUrl(movilNormalizado, texto) };
  }
  const scriptParam = { numeroSiniestro, movil: movilNormalizado };
  const url = `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layout}/script/${encodeURIComponent(FM_CONFIG.scriptEnviarEnlace)}?script.param=${encodeURIComponent(JSON.stringify(scriptParam))}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("No se pudo ejecutar el script");
  const data = await res.json();
  const scriptResult = data?.response?.scriptResult;
  if (!scriptResult) return { ok: true, raw: data };
  try {
    const parsed = JSON.parse(scriptResult) as EnviarEnlaceResult;
    return {
      ...parsed,
      ok: parsed.ok ?? true,
      movil: parsed.movil ?? movilNormalizado,
      url: parsed.url ?? (parsed.texto ? crearWhatsAppUrl(parsed.movil ?? movilNormalizado, parsed.texto) : undefined),
      raw: data,
    };
  } catch {
    return { ok: true, texto: scriptResult, movil: movilNormalizado, raw: data };
  }
}

export function abrirWhatsApp(result: EnviarEnlaceResult) {
  const url = result.url ?? (result.movil && result.texto ? crearWhatsAppUrl(result.movil, result.texto) : undefined);
  if (!url) return false;
  window.location.href = url;
  return true;
}

function getFirstValue(fieldData: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = fieldData[key];
    if (value) return value;
  }
  return "";
}

function getFileMakerErrorMessage(data: unknown) {
  const messages = (data as { messages?: { code: string; message: string }[] } | null)?.messages;
  if (!messages?.length) return "";
  return messages.map((m) => `${m.code}: ${m.message}`).join(" · ");
}

function crearWhatsAppUrl(movil: string, texto: string) {
  return `https://wa.me/${normalizarMovil(movil)}?text=${encodeURIComponent(texto)}`;
}

function normalizarMovil(movil: string) {
  const limpio = movil.replace(/[^0-9+]/g, "");
  if (!limpio) return "";
  if (limpio.startsWith("+")) return limpio.slice(1);
  if (limpio.startsWith("00")) return limpio.slice(2);
  if (limpio.length === 9) return `34${limpio}`;
  return limpio;
}

function debug(message: string, data?: unknown) {
  if (!DEBUG_FM) return;
  console.log(`[FileMaker] ${message}`, data ?? "");
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
