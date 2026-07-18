import { Poliza } from "@/data/siniestros";
import { normalizarDireccion } from "@/lib/geocode";

export const DIRECCION_REFERENCIA_OFICINA = "Escritor Rafael Ferreres 2, 46013 Valencia, España";

type DireccionCampos = Pick<
  Poliza,
  | "via"
  | "direccion"
  | "numeroCalle"
  | "codigoPostal"
  | "poblacion"
  | "provincia"
  | "direccionCompleta"
>;

export function construirTextoDireccion(direccion: Partial<DireccionCampos>): string {
  if (direccion.direccionCompleta?.trim()) return direccion.direccionCompleta.trim();

  return [
    direccion.via,
    direccion.direccion,
    direccion.numeroCalle,
    direccion.codigoPostal,
    direccion.poblacion,
    direccion.provincia,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function construirConsultaGeocodificacion(direccion: Partial<DireccionCampos>): string {
  const poblacion = direccion.poblacion?.trim() || "";
  const provincia = direccion.provincia?.trim() || "";
  const codigoPostal = direccion.codigoPostal?.trim() || "";
  const completa = direccion.direccionCompleta?.trim() || "";

  if (completa) {
    const lower = completa.toLowerCase();
    const partes = [completa];
    if (codigoPostal && !completa.includes(codigoPostal)) partes.push(codigoPostal);
    if (poblacion && !lower.includes(poblacion.toLowerCase())) partes.push(poblacion);
    if (provincia && !lower.includes(provincia.toLowerCase())) partes.push(provincia);
    partes.push("España");
    return partes.join(", ");
  }

  const calle = [direccion.via, direccion.direccion, direccion.numeroCalle].filter(Boolean).join(" ").trim();
  if (!calle && !codigoPostal && !poblacion) return "";

  const partes = [calle].filter(Boolean);
  if (codigoPostal) partes.push(codigoPostal);
  if (poblacion) partes.push(poblacion);
  if (provincia && provincia !== poblacion) partes.push(provincia);
  partes.push("España");

  return partes.join(", ");
}

function distanciaKmHaversine(
  origen: { lat: number; lng: number },
  destino: { lat: number; lng: number }
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(destino.lat - origen.lat);
  const dLng = toRad(destino.lng - origen.lng);
  const lat1 = toRad(origen.lat);
  const lat2 = toRad(destino.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanciaKm(km: number): string {
  return (Math.round(km * 10) / 10).toFixed(1);
}

async function obtenerCoordenadas(consulta: string): Promise<{ lat: number; lng: number }> {
  const texto = consulta.trim();
  if (!texto) throw new Error("Falta la dirección para geocodificar");

  const data = await normalizarDireccion(texto);
  const lat = Number(data.latitud);
  const lng = Number(data.longitud);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`No se pudieron obtener coordenadas para: ${texto}`);
  }

  return { lat, lng };
}

let referenciaCoordsCache: Promise<{ lat: number; lng: number }> | null = null;

function obtenerCoordenadasReferencia() {
  if (!referenciaCoordsCache) {
    referenciaCoordsCache = obtenerCoordenadas(DIRECCION_REFERENCIA_OFICINA);
  }
  return referenciaCoordsCache;
}

export async function calcularMetricasDistanciaPoliza(
  poliza: Poliza
): Promise<{ distancia: string; latitud: string; longitud: string }> {
  const consultaPoliza = construirConsultaGeocodificacion(poliza);

  if (!consultaPoliza) {
    throw new Error("La póliza no tiene dirección del riesgo para calcular la distancia");
  }

  const [coordsReferencia, coordsPoliza] = await Promise.all([
    obtenerCoordenadasReferencia(),
    obtenerCoordenadas(consultaPoliza),
  ]);

  const km = distanciaKmHaversine(coordsPoliza, coordsReferencia);

  return {
    distancia: formatDistanciaKm(km),
    latitud: String(coordsPoliza.lat),
    longitud: String(coordsPoliza.lng),
  };
}
