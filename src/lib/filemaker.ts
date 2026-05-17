/**
 * Cliente FileMaker Data API.
 *
 * La app puede trabajar en modo mock o contra FileMaker real usando variables de entorno Vite.
 * En desarrollo crea un .env.local basado en .env.example.
 */
import { Siniestro, siniestrosMock } from "@/data/siniestros";

export const FM_CONFIG = {
  host: import.meta.env.VITE_FM_HOST ?? "", // ej: "https://localhost" o vacío para mismo origen
  database: import.meta.env.VITE_FM_DATABASE ?? "GestionPericial",
  layout: import.meta.env.VITE_FM_LAYOUT ?? "API_EnlacesSiniestros",
  scriptEnviarEnlace: import.meta.env.VITE_FM_SCRIPT_ENVIAR_ENLACE ?? "SMS",
  filtroEnCursoCampo: import.meta.env.VITE_FM_FILTRO_EN_CURSO_CAMPO ?? "FechaCierre",
  filtroEnCursoValor: import.meta.env.VITE_FM_FILTRO_EN_CURSO_VALOR ?? "=",
};

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

let token: string | null = null;

export interface EnviarEnlaceResult {
  ok: boolean;
  url?: string;
  texto?: string;
  movil?: string;
  raw?: unknown;
}

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

  const res = await fetch(
    `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layout}/_find`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: [{ [FM_CONFIG.filtroEnCursoCampo]: FM_CONFIG.filtroEnCursoValor }],
        limit: "200",
      }),
    }
  );

  if (!res.ok) throw new Error("No se pudieron cargar los siniestros");
  const data = await res.json();

  return data.response.data.map((record: { recordId: string; fieldData: Record<string, string> }) => {
    const fieldData = record.fieldData;
    return {
      id: record.recordId,
      numero: fieldData.NumeroSiniestro ?? "",
      compania: getFirstValue(fieldData, [
        "siniestros_polizas_COMPANIAS::Alias",
        "siniestros_polizas_COMPANIAS:Alias",
        "Alias",
      ]),
      asegurado: fieldData.Asegurado ?? "",
      direccion: fieldData.zVistaDireccionCrawfordEnLinea ?? "",
      fechaApertura: getFirstValue(fieldData, ["FechaApertura", "FechaAlta", "FechaEncargo"]) || new Date().toISOString(),
      tipo: fieldData.TipoSiniestro ?? "",
    };
  });
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

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
