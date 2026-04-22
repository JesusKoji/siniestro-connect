/**
 * Cliente FileMaker Data API.
 *
 * NOTA: Actualmente devuelve datos de ejemplo (mock). Cuando despliegues la web
 * en el mismo Mac mini que FileMaker Server, descomenta las llamadas reales.
 * Al estar en el mismo origen NO tendrás problemas de CORS.
 *
 * Configura FM_CONFIG con tus datos reales:
 *  - host: vacío si la web corre en el mismo servidor (rutas relativas)
 *  - database: nombre del archivo .fmp12
 *  - layout: layout expuesto para la API con los campos necesarios
 *  - scriptEnviarEnlace: nombre exacto del script de FileMaker
 */
import { Siniestro, siniestrosMock } from "@/data/siniestros";

export const FM_CONFIG = {
  host: "", // ej: "https://localhost" o vacío para mismo origen
  database: "Siniestros",
  layout: "API_Siniestros",
  scriptEnviarEnlace: "EnviarEnlace",
};

const USE_MOCK = true; // Cambiar a false cuando se conecte FileMaker real

let token: string | null = null;

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
  // Ejemplo real:
  // const res = await fetch(`${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layout}/_find`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  //   body: JSON.stringify({ query: [{ estado: "En curso" }], limit: "200" }),
  // });
  // const data = await res.json();
  // return data.response.data.map(mapearRegistro);
  return [];
}

export async function ejecutarScriptEnviarEnlace(numeroSiniestro: string) {
  if (USE_MOCK) {
    await wait(800);
    return { ok: true };
  }
  const url = `${FM_CONFIG.host}/fmi/data/vLatest/databases/${FM_CONFIG.database}/layouts/${FM_CONFIG.layout}/script/${encodeURIComponent(
    FM_CONFIG.scriptEnviarEnlace
  )}?script.param=${encodeURIComponent(numeroSiniestro)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("No se pudo ejecutar el script");
  return { ok: true };
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
