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

type FileMakerRecord = { recordId: string; fieldData: Record<string, string> };

async function login(usuario: string, password: string): Promise<string> {
  if (USE_MOCK) {
    await wait(600);
    if (!usuario || !password) throw new Error("Credenciales requeridas");
    token = "mock-token";
    return token;
  }
  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${usuario}:${password}`) },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Usuario o contraseña incorrectos");
  const data = await res.json();
  token = data.response.token;
  return token!;
}

export async function autenticar(usuario: string, password: string) { return login(usuario, password); }
export function cerrarSesion() { token = null; }

async function fmRequest(layout: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${layout}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const data = await res.json().catch(() => null);
  debug(`FM ${layout}${path}`, data);
  if (!res.ok) throw new Error(getFileMakerErrorMessage(data) || `Error FileMaker ${res.status}`);
  return data;
}

export async function listarSiniestrosEnCurso(): Promise<Siniestro[]> {
  if (USE_MOCK) { await wait(400); return siniestrosMock; }
  const registrosFiltrados = await buscarRegistrosEnCurso();
  if (registrosFiltrados.length > 0) return registrosFiltrados.map(mapearSiniestro);
  if (!FALLBACK_LISTAR_REGISTROS) return [];
  const registros = await listarRegistrosLayout(FM_CONFIG.layout, 200);
  const campoFiltro = FM_CONFIG.filtroEnCursoCampo;
  return registros.filter((record) => String(record.fieldData[campoFiltro] ?? "").trim() === "").map(mapearSiniestro);
}

export async function listarAsegurados(limit = 100): Promise<Asegurado[]> {
  if (USE_MOCK) { await wait(250); return [aseguradoMock]; }
  return (await listarRegistrosLayout(FM_CONFIG.layoutAsegurados, limit)).map(mapearAsegurado);
}

export async function obtenerAsegurado(idAsegurado?: string): Promise<Asegurado | null> {
  if (!idAsegurado) return null;
  if (USE_MOCK) { await wait(250); return aseguradoMock; }
  const data = await findRecords(FM_CONFIG.layoutAsegurados, { query: [{ _kp_ID_Asegurado: idAsegurado }], limit: "1" }, true);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? mapearAsegurado(record) : null;
}

async function obtenerAseguradoPorRecordId(recordId: string): Promise<Asegurado | null> {
  const data = await fmRequest(FM_CONFIG.layoutAsegurados, `/records/${recordId}`);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? mapearAsegurado(record) : null;
}

export async function buscarAsegurados(texto: string): Promise<Asegurado[]> {
  const q = texto.trim();
  if (!q) return [];
  if (USE_MOCK) {
    await wait(200);
    return [aseguradoMock].filter((a) => [a.displayName, a.nif, a.direccionCompleta, a.poblacion, a.provincia].join(" ").toLowerCase().includes(q.toLowerCase()));
  }
  const body = { query: [{ NIF: `*${q}*` }, { NombreCompleto: `*${q}*` }, { RazonSocial: `*${q}*` }, { DireccCompleta: `*${q}*` }, { Poblacion: `*${q}*` }], limit: "100" };
  const data = await findRecords(FM_CONFIG.layoutAsegurados, body, true);
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearAsegurado);
}

export async function crearAsegurado(asegurado: Asegurado): Promise<Asegurado> {
  const fieldData = aseguradoToFieldData(asegurado);
  if (USE_MOCK) { await wait(300); return completarAseguradoLocal({ ...asegurado, id: asegurado.id || `Asegurado_${Date.now()}`, recordId: `${Date.now()}` }); }
  const data = await fmRequest(FM_CONFIG.layoutAsegurados, "/records", { method: "POST", body: JSON.stringify({ fieldData }) });
  const recordId = String(data?.response?.recordId ?? "");
  return (recordId ? await obtenerAseguradoPorRecordId(recordId) : null) ?? completarAseguradoLocal({ ...asegurado, recordId });
}

export async function actualizarAsegurado(asegurado: Asegurado): Promise<Asegurado> {
  if (!asegurado.recordId) throw new Error("No se puede actualizar: falta recordId del asegurado");
  const fieldData = aseguradoToFieldData(asegurado);
  if (USE_MOCK) { await wait(300); return completarAseguradoLocal(asegurado); }
  await fmRequest(FM_CONFIG.layoutAsegurados, `/records/${asegurado.recordId}`, { method: "PATCH", body: JSON.stringify({ fieldData }) });
  return (await obtenerAseguradoPorRecordId(asegurado.recordId)) ?? completarAseguradoLocal(asegurado);
}

export async function obtenerContactosAsegurado(idAsegurado?: string): Promise<ContactoAsegurado[]> {
  if (!idAsegurado) return [];
  if (USE_MOCK) { await wait(150); return contactosAseguradoMock; }
  const data = await findRecords(FM_CONFIG.layoutContactosAsegurado, { query: [{ _kf_ID_Asegurado: idAsegurado }], limit: "100" }, true);
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearContactoAsegurado);
}

export async function crearContactoAsegurado(contacto: ContactoAsegurado): Promise<ContactoAsegurado> {
  if (!contacto.idAsegurado) throw new Error("Falta el asegurado relacionado");
  const nuevo = { ...contacto, id: contacto.id || `ContactoAseg_${Date.now()}` };
  if (USE_MOCK) { await wait(200); return { ...nuevo, nombreCompleto: calcularNombreContacto(nuevo) }; }
  const data = await fmRequest(FM_CONFIG.layoutContactosAsegurado, "/records", { method: "POST", body: JSON.stringify({ fieldData: contactoToFieldData(nuevo, true) }) });
  const recordId = String(data?.response?.recordId ?? "");
  return (recordId ? await obtenerContactoPorRecordId(recordId) : null) ?? { ...nuevo, nombreCompleto: calcularNombreContacto(nuevo) };
}

export async function actualizarContactoAsegurado(contacto: ContactoAsegurado): Promise<ContactoAsegurado> {
  const recordId = await resolverRecordIdContacto(contacto);
  if (!recordId) throw new Error("No se puede actualizar: no se localiza el recordId del contacto");
  if (USE_MOCK) { await wait(200); return { ...contacto, nombreCompleto: calcularNombreContacto(contacto) }; }
  await fmRequest(FM_CONFIG.layoutContactosAsegurado, `/records/${recordId}`, { method: "PATCH", body: JSON.stringify({ fieldData: contactoToFieldData(contacto, false) }) });
  return (await obtenerContactoPorRecordId(recordId)) ?? { ...contacto, nombreCompleto: calcularNombreContacto(contacto) };
}

export async function borrarContactoAsegurado(contacto: ContactoAsegurado): Promise<void> {
  const recordId = await resolverRecordIdContacto(contacto);
  if (!recordId) throw new Error("No se puede borrar: no se localiza el recordId del contacto");
  if (USE_MOCK) { await wait(200); return; }
  await fmRequest(FM_CONFIG.layoutContactosAsegurado, `/records/${recordId}`, { method: "DELETE" });
}

async function resolverRecordIdContacto(contacto: ContactoAsegurado): Promise<string> {
  const posibleRecordId = (contacto as ContactoAsegurado & { recordId?: string }).recordId;
  if (posibleRecordId) return posibleRecordId;
  if (USE_MOCK) return contacto.id;
  const data = await findRecords(FM_CONFIG.layoutContactosAsegurado, { query: [{ _kp_ID_ContactoAseg: contacto.id }], limit: "1" }, true);
  return String(data?.response?.data?.[0]?.recordId ?? "");
}

async function obtenerContactoPorRecordId(recordId: string): Promise<ContactoAsegurado | null> {
  const data = await fmRequest(FM_CONFIG.layoutContactosAsegurado, `/records/${recordId}`);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? mapearContactoAsegurado(record) : null;
}

export async function obtenerPolizasAsegurado(idAsegurado?: string): Promise<Poliza[]> {
  if (!idAsegurado) return [];
  if (USE_MOCK) { await wait(150); return polizasMock; }
  const data = await findRecords(FM_CONFIG.layoutPolizas, { query: [{ _kf_ID_Asegurado: idAsegurado }], limit: "100" }, true);
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearPoliza);
}

export async function obtenerSiniestrosAsegurado(idAsegurado?: string): Promise<Siniestro[]> {
  if (!idAsegurado) return [];
  if (USE_MOCK) { await wait(150); return siniestrosMock; }
  const data = await findRecords(FM_CONFIG.layoutSiniestros, { query: [{ _kf_ID_Asegurado: idAsegurado }], limit: "100" }, true);
  return ((data?.response?.data ?? []) as FileMakerRecord[]).map(mapearSiniestro);
}

async function buscarRegistrosEnCurso(): Promise<FileMakerRecord[]> {
  const data = await findRecords(FM_CONFIG.layout, { query: [{ [FM_CONFIG.filtroEnCursoCampo]: FM_CONFIG.filtroEnCursoValor }], limit: "200" });
  return data?.response?.data ?? [];
}

async function findRecords(layout: string, body: object, emptyIsOk = false) {
  try {
    const data = await fmRequest(layout, "/_find", { method: "POST", body: JSON.stringify(body) });
    const code = data?.messages?.[0]?.code;
    if (emptyIsOk && code === "401") return { response: { data: [] }, messages: data?.messages };
    return data;
  } catch (error) {
    if (emptyIsOk && error instanceof Error && error.message.includes("401")) return { response: { data: [] } };
    throw error;
  }
}

async function listarRegistrosLayout(layout: string, limit = 200): Promise<FileMakerRecord[]> {
  const data = await fmRequest(layout, `/records?_limit=${limit}`);
  return data?.response?.data ?? [];
}

function mapearSiniestro(record: FileMakerRecord): Siniestro {
  const f = record.fieldData;
  return {
    id: getFirstValue(f, ["_kp_ID_Siniestro", "id"]) || record.recordId,
    idSiniestro: getFirstValue(f, ["_kp_ID_Siniestro", "id"]),
    idAsegurado: f._kf_ID_Asegurado ?? "",
    idPoliza: f._kf_ID_Poliza ?? "",
    numero: f.NumeroSiniestro ?? "",
    compania: getFirstValue(f, ["siniestros_polizas_COMPANIAS::Alias", "siniestros_polizas_COMPANIAS:Alias", "Alias"]),
    asegurado: f.Asegurado ?? getFirstValue(f, ["NombreAseg", "RazonSocial", "NombreCompleto"]),
    direccion: f.zVistaDireccionCrawfordEnLinea ?? getFirstValue(f, ["DireccionCompleta", "DireccCompleta", "Direccion"]),
    fechaApertura: getFirstValue(f, ["FechaApertura", "FechaAlta", "FechaEncargo", "FechaRecepcion"]) || new Date().toISOString(),
    tipo: f.TipoSiniestro ?? "",
  };
}

export async function obtenerDetalleSiniestro(siniestro: Siniestro): Promise<Siniestro> {
  if (siniestro.idAsegurado && siniestro.idPoliza) return siniestro;
  if (USE_MOCK) { await wait(200); return siniestro; }
  const data = await findRecords(FM_CONFIG.layoutSiniestros, { query: [{ _kp_ID_Siniestro: siniestro.idSiniestro || siniestro.id }], limit: "1" }, true);
  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? { ...siniestro, ...mapearSiniestro(record) } : siniestro;
}

function mapearAsegurado(record: FileMakerRecord): Asegurado {
  const f = record.fieldData;
  const nombre = f.Nombre ?? "";
  const apellido1 = f.Apellido1 ?? "";
  const apellido2 = f.Apellido2 ?? "";
  const nombreCompleto = getFirstValue(f, ["NombreCompleto", "Apellidos"]);
  const razonSocial = f.RazonSocial ?? "";
  const displayName = razonSocial || nombreCompleto || [nombre, apellido1, apellido2].filter(Boolean).join(" ");
  const tipoPersona = tipoPersonaDesdeIsCIF(f.is_CIF, getFirstValue(f, ["TipoAseg", "TipoPersona"]));
  return { id: f._kp_ID_Asegurado || record.recordId, recordId: record.recordId, nif: f.NIF ?? "", tipoPersona, clientePrivado: normalizarBooleanoFM(f["Is:ClientePrivado"]), aplicaRetencion: normalizarBooleanoFM(f.Is_Retencion), nombre, apellido1, apellido2, nombreCompleto, razonSocial, displayName, via: f.Via ?? "", direccion: f.Direccion ?? "", numeroCalle: f.NumeroCalle ?? "", bloque: f.Bloque ?? "", escalera: f.Escalera ?? "", planta: f.Planta ?? "", puerta: f.Puerta ?? "", codigoPostal: f.CodPostal ?? "", poblacion: f.Poblacion ?? "", provincia: f.Provincia ?? "", pais: f.Pais ?? "", direccionCompleta: getFirstValue(f, ["DireccCompleta", "DireccionCompleta"]), email: f.email ?? f.Email ?? "", telefono: f.Telefono ?? "" };
}

function aseguradoToFieldData(a: Asegurado): Record<string, string> {
  return limpiarFieldData({ NIF: a.nif, is_CIF: isCIFDesdeTipoPersona(a.tipoPersona), "Is:ClientePrivado": a.clientePrivado === "1" ? "1" : "0", Is_Retencion: a.clientePrivado === "1" && a.aplicaRetencion === "1" ? "1" : "0", Nombre: a.nombre, Apellido1: a.apellido1, Apellido2: a.apellido2, RazonSocial: a.razonSocial, Via: a.via, Direccion: a.direccion, NumeroCalle: a.numeroCalle, Bloque: a.bloque, Escalera: a.escalera, Planta: a.planta, Puerta: a.puerta, CodPostal: a.codigoPostal, Poblacion: a.poblacion, Provincia: a.provincia, Pais: a.pais, email: a.email, Telefono: a.telefono });
}

function contactoToFieldData(c: ContactoAsegurado, includeRelation: boolean): Record<string, string> {
  return limpiarFieldData({
    ...(includeRelation ? { _kf_ID_Asegurado: c.idAsegurado } : {}),
    Nombre: c.nombre,
    Cargo: c.cargo,
    Telefono: c.telefono,
    Telefono2: c.telefono2,
    Movil: c.movil,
    Mail: c.mail,
    Notas: c.notas,
  });
}

function tipoPersonaDesdeIsCIF(isCIF: string | undefined, fallback = "") {
  const valor = String(isCIF ?? "").trim();
  if (valor === "1") return "Persona jurídica";
  if (valor === "0") return "Persona física";
  return fallback || "Persona física";
}

function isCIFDesdeTipoPersona(tipoPersona: string) {
  return tipoPersona.toLowerCase().includes("jur") ? "1" : "0";
}

function normalizarBooleanoFM(value: string | undefined) {
  return String(value ?? "").trim() === "1" ? "1" : "0";
}

function limpiarFieldData(data: Record<string, string | undefined>) { return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Record<string, string>; }
function calcularNombreCompleto(a: Asegurado) { return [a.nombre, a.apellido1, a.apellido2].filter(Boolean).join(" "); }
function calcularDisplayName(a: Asegurado) { return a.razonSocial || a.nombreCompleto || calcularNombreCompleto(a); }
function calcularNombreContacto(c: ContactoAsegurado) { return c.nombreCompleto || c.nombre; }
function calcularDireccionCompleta(a: Asegurado) { return [[a.via, a.direccion, a.numeroCalle].filter(Boolean).join(" "), [a.bloque ? `Bloque ${a.bloque}` : "", a.escalera ? `Esc. ${a.escalera}` : "", a.planta ? `Planta ${a.planta}` : "", a.puerta ? `Puerta ${a.puerta}` : ""].filter(Boolean).join(" "), [a.codigoPostal, a.poblacion].filter(Boolean).join(" "), a.provincia, a.pais].filter(Boolean).join(" · "); }
function completarAseguradoLocal(a: Asegurado): Asegurado { return { ...a, nombreCompleto: calcularNombreCompleto(a), displayName: calcularDisplayName(a), direccionCompleta: calcularDireccionCompleta(a), aplicaRetencion: a.clientePrivado === "1" ? a.aplicaRetencion : "0" }; }

function mapearContactoAsegurado(record: FileMakerRecord): ContactoAsegurado {
  const f = record.fieldData;
  return { id: f._kp_ID_ContactoAseg || record.recordId, recordId: record.recordId, idAsegurado: f._kf_ID_Asegurado ?? "", nombre: f.Nombre ?? "", nombreCompleto: f.NombreCompleto ?? f.Nombre ?? "", cargo: f.Cargo ?? "", telefono: f.Telefono ?? "", telefono2: f.Telefono2 ?? "", movil: f.Movil ?? "", mail: f.Mail ?? f.email ?? "", notas: f.Notas ?? "" };
}

function mapearPoliza(record: FileMakerRecord): Poliza {
  const f = record.fieldData;
  return { id: f._kp_ID_Poliza || record.recordId, idAsegurado: f._kf_ID_Asegurado ?? "", numeroPoliza: f.NumeroPoliza ?? "", direccionCompleta: getFirstValue(f, ["DireccionCompleta", "DireccCompleta", "Direccion"]), poblacion: f.Poblacion ?? "", provincia: f.Provincia ?? "", agente: f.Agente ?? "", telefonoAgente: f.TlfAgente ?? f.TlfAgente2 ?? "", emailAgente: f.EmailAgente ?? "" };
}

export async function ejecutarScriptEnviarEnlace(numeroSiniestro: string, movil: string): Promise<EnviarEnlaceResult> {
  const movilNormalizado = normalizarMovil(movil);
  if (!movilNormalizado) throw new Error("Introduce un numero de movil valido");
  if (USE_MOCK) { await wait(800); const texto = `Enlace de subida de documentacion para el siniestro ${numeroSiniestro}: https://example.com/subida/${encodeURIComponent(numeroSiniestro)}`; return { ok: true, movil: movilNormalizado, texto, url: crearWhatsAppUrl(movilNormalizado, texto) }; }
  const scriptParam = { numeroSiniestro, movil: movilNormalizado };
  const url = `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layout}/script/${encodeURIComponent(FM_CONFIG.scriptEnviarEnlace)}?script.param=${encodeURIComponent(JSON.stringify(scriptParam))}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("No se pudo ejecutar el script");
  const data = await res.json();
  const scriptResult = data?.response?.scriptResult;
  if (!scriptResult) return { ok: true, raw: data };
  try { const parsed = JSON.parse(scriptResult) as EnviarEnlaceResult; return { ...parsed, ok: parsed.ok ?? true, movil: parsed.movil ?? movilNormalizado, url: parsed.url ?? (parsed.texto ? crearWhatsAppUrl(parsed.movil ?? movilNormalizado, parsed.texto) : undefined), raw: data }; } catch { return { ok: true, texto: scriptResult, movil: movilNormalizado, raw: data }; }
}

export function abrirWhatsApp(result: EnviarEnlaceResult) { const url = result.url ?? (result.movil && result.texto ? crearWhatsAppUrl(result.movil, result.texto) : undefined); if (!url) return false; window.location.href = url; return true; }
function getFirstValue(fieldData: Record<string, string>, keys: string[]) { for (const key of keys) { const value = fieldData[key]; if (value) return value; } return ""; }
function getFileMakerErrorMessage(data: unknown) { const messages = (data as { messages?: { code: string; message: string }[] } | null)?.messages; return messages?.length ? messages.map((m) => `${m.code}: ${m.message}`).join(" · ") : ""; }
function crearWhatsAppUrl(movil: string, texto: string) { return `https://wa.me/${normalizarMovil(movil)}?text=${encodeURIComponent(texto)}`; }
function normalizarMovil(movil: string) { const limpio = movil.replace(/[^0-9+]/g, ""); if (!limpio) return ""; if (limpio.startsWith("+")) return limpio.slice(1); if (limpio.startsWith("00")) return limpio.slice(2); if (limpio.length === 9) return `34${limpio}`; return limpio; }
function debug(message: string, data?: unknown) { if (!DEBUG_FM) return; console.log(`[FileMaker] ${message}`, data ?? ""); }
function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
