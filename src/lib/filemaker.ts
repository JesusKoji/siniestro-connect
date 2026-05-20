/**
 * Cliente FileMaker Data API.
 *
 * La app puede trabajar en modo mock o contra FileMaker real usando variables de entorno Vite.
 * En desarrollo crea un .env.local basado en .env.example.
 */
import { Asegurado, aseguradoMock, Siniestro, siniestrosMock } from "@/data/siniestros";

export const FM_CONFIG = {
  host: import.meta.env.VITE_FM_HOST ?? "", // ej: "https://localhost" o vacío para mismo origen
  database: import.meta.env.VITE_FM_DATABASE ?? "GestionPericial",
  layout: import.meta.env.VITE_FM_LAYOUT ?? "API_EnlacesSiniestros",
  layoutSiniestros: import.meta.env.VITE_FM_LAYOUT_SINIESTROS ?? "API_Siniestros",
  layoutAsegurados: import.meta.env.VITE_FM_LAYOUT_ASEGURADOS ?? "API_Asegurados",
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

  const res = await fetch(
    `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${usuario}:${password}`),
      },
      body: JSON.stringify({}),
    }
  );

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

  if (registrosFiltrados.length > 0) {
    return registrosFiltrados.map(mapearSiniestro);
  }

  if (!FALLBACK_LISTAR_REGISTROS) {
    return [];
  }

  debug("La búsqueda por FechaCierre no devolvió registros. Probando lectura de registros y filtro en cliente.");
  const registros = await listarRegistrosLayout();
  const campoFiltro = FM_CONFIG.filtroEnCursoCampo;
  const filtradosEnCliente = registros.filter((record) => {
    const valor = record.fieldData[campoFiltro];
    return valor === undefined || valor === null || String(valor).trim() === "";
  });

  debug("Fallback registros", {
    total: registros.length,
    filtrados: filtradosEnCliente.length,
    campoFiltro,
    ejemploCampos: registros[0]?.fieldData ? Object.keys(registros[0].fieldData) : [],
  });

  return filtradosEnCliente.map(mapearSiniestro);
}

async function buscarRegistrosEnCurso(): Promise<FileMakerRecord[]> {
  const body = {
    query: [{ [FM_CONFIG.filtroEnCursoCampo]: FM_CONFIG.filtroEnCursoValor }],
    limit: "200",
  };

  debug("Find siniestros", { layout: FM_CONFIG.layout, body });

  const res = await fetch(
    `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layout}/_find`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json().catch(() => null);
  debug("Find siniestros response", data);

  if (!res.ok) {
    throw new Error(getFileMakerErrorMessage(data) || "No se pudieron cargar los siniestros");
  }

  const code = data?.messages?.[0]?.code;
  if (code === "401") {
    return [];
  }

  return data?.response?.data ?? [];
}

async function listarRegistrosLayout(): Promise<FileMakerRecord[]> {
  const res = await fetch(
    `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layout}/records?_limit=200`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json().catch(() => null);
  debug("List records response", data);

  if (!res.ok) {
    throw new Error(getFileMakerErrorMessage(data) || "No se pudieron listar registros del layout");
  }

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
    compania: getFirstValue(fieldData, [
      "siniestros_polizas_COMPANIAS::Alias",
      "siniestros_polizas_COMPANIAS:Alias",
      "Alias",
    ]),
    asegurado: fieldData.Asegurado ?? getFirstValue(fieldData, ["NombreAseg", "RazonSocial", "NombreCompleto"]),
    direccion: fieldData.zVistaDireccionCrawfordEnLinea ?? getFirstValue(fieldData, ["DireccionCompleta", "DireccCompleta", "Direccion"]),
    fechaApertura: getFirstValue(fieldData, ["FechaApertura", "FechaAlta", "FechaEncargo", "FechaRecepcion"]) || new Date().toISOString(),
    tipo: fieldData.TipoSiniestro ?? "",
  };
}

export async function obtenerDetalleSiniestro(siniestro: Siniestro): Promise<Siniestro> {
  if (siniestro.idAsegurado && siniestro.idPoliza) {
    return siniestro;
  }

  if (USE_MOCK) {
    await wait(200);
    return siniestro;
  }

  const idSiniestro = siniestro.idSiniestro || siniestro.id;
  const body = {
    query: [{ _kp_ID_Siniestro: idSiniestro }],
    limit: "1",
  };

  debug("Find detalle siniestro", { layout: FM_CONFIG.layoutSiniestros, body });

  const res = await fetch(
    `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layoutSiniestros}/_find`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json().catch(() => null);
  debug("Find detalle siniestro response", data);

  if (!res.ok) {
    const code = data?.messages?.[0]?.code;
    if (code === "401") return siniestro;
    throw new Error(getFileMakerErrorMessage(data) || "No se pudo cargar el detalle del siniestro");
  }

  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? { ...siniestro, ...mapearSiniestro(record) } : siniestro;
}

export async function obtenerAsegurado(idAsegurado?: string): Promise<Asegurado | null> {
  if (!idAsegurado) return null;

  if (USE_MOCK) {
    await wait(250);
    return aseguradoMock;
  }

  const body = {
    query: [{ _kp_ID_Asegurado: idAsegurado }],
    limit: "1",
  };

  debug("Find asegurado", { layout: FM_CONFIG.layoutAsegurados, body });

  const res = await fetch(
    `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layoutAsegurados}/_find`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json().catch(() => null);
  debug("Find asegurado response", data);

  if (!res.ok) {
    const code = data?.messages?.[0]?.code;
    if (code === "401") return null;
    throw new Error(getFileMakerErrorMessage(data) || "No se pudo cargar el asegurado");
  }

  const record = data?.response?.data?.[0] as FileMakerRecord | undefined;
  return record ? mapearAsegurado(record) : null;
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

export async function ejecutarScriptEnviarEnlace(
  numeroSiniestro: string,
  movil: string
): Promise<EnviarEnlaceResult> {
  const movilNormalizado = normalizarMovil(movil);

  if (!movilNormalizado) {
    throw new Error("Introduce un número de móvil válido");
  }

  if (USE_MOCK) {
    await wait(800);
    const texto = `Enlace de subida de documentación para el siniestro ${numeroSiniestro}: https://example.com/subida/${encodeURIComponent(
      numeroSiniestro
    )}`;
    return {
      ok: true,
      movil: movilNormalizado,
      texto,
      url: crearWhatsAppUrl(movilNormalizado, texto),
    };
  }

  const scriptParam = {
    numeroSiniestro,
    movil: movilNormalizado,
  };

  const url = `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layout}/script/${encodeURIComponent(
    FM_CONFIG.scriptEnviarEnlace
  )}?script.param=${encodeURIComponent(JSON.stringify(scriptParam))}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("No se pudo ejecutar el script");
  const data = await res.json();
  const scriptResult = data?.response?.scriptResult;

  if (!scriptResult) {
    return { ok: true, raw: data };
  }

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
