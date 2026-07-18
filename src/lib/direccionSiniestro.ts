import { Siniestro } from "@/data/siniestros";
import { DireccionNormalizada } from "@/lib/geocode";
import {
  codPostalDisplaySiniestro,
  provinciaDisplaySiniestro,
} from "@/lib/siniestroGeneralListado";
import { direccionCalleDisplaySiniestro, poblacionDisplaySiniestro } from "@/lib/siniestroListado";
import { formatearTituloEs, textoCampo } from "@/lib/textoCampo";

export function buildDireccionLibreSiniestro(siniestro: Siniestro): string {
  return [
    siniestro.via,
    siniestro.calle,
    siniestro.numeroCalle,
    siniestro.codPostal,
    siniestro.poblacion,
    siniestro.provincia,
  ]
    .map(textoCampo)
    .filter(Boolean)
    .join(" ");
}

export function patchDireccionNormalizadaSiniestro(data: DireccionNormalizada): Partial<Siniestro> {
  return {
    via: data.via || "",
    calle: data.direccion || "",
    numeroCalle: data.numeroCalle || "",
    bloque: data.bloque || "",
    escalera: data.escalera || "",
    planta: data.planta || "",
    puerta: data.puerta || "",
    codPostal: data.codigoPostal || "",
    poblacion: data.poblacion || "",
    provincia: data.provincia || "",
    direccion: data.direccionCompleta || data.direccion || "",
  };
}

/** Blq 3, Esc 2 Pl. 3 Pta 45 */
export function detalleInteriorDisplaySiniestro(siniestro: Siniestro): string {
  const bloque = textoCampo(siniestro.bloque);
  const escalera = textoCampo(siniestro.escalera);
  const planta = textoCampo(siniestro.planta);
  const puerta = textoCampo(siniestro.puerta);

  const bloqueParte = bloque ? `Blq ${bloque}` : "";
  const resto = [
    escalera ? `Esc ${escalera}` : "",
    planta ? `Pl. ${planta}` : "",
    puerta ? `Pta ${puerta}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (bloqueParte && resto) return `${bloqueParte}, ${resto}`;
  return bloqueParte || resto;
}

export function calleDisplaySiniestro(siniestro: Siniestro): string {
  const via = formatearTituloEs(siniestro.via);
  const calle = formatearTituloEs(siniestro.calle);
  const numero = textoCampo(siniestro.numeroCalle);
  const compuesta = [via, calle, numero].filter(Boolean).join(" ");
  return compuesta || direccionCalleDisplaySiniestro(siniestro);
}

export function localidadDisplaySiniestro(siniestro: Siniestro): string {
  return [
    codPostalDisplaySiniestro(siniestro),
    poblacionDisplaySiniestro(siniestro),
    provinciaDisplaySiniestro(siniestro),
  ]
    .filter(Boolean)
    .join(" ");
}

/** Calle · interior · localidad en una sola línea. */
export function direccionVistaDisplaySiniestro(siniestro: Siniestro): string {
  return [calleDisplaySiniestro(siniestro), detalleInteriorDisplaySiniestro(siniestro), localidadDisplaySiniestro(siniestro)]
    .filter(Boolean)
    .join(" · ");
}

/** Dirección postal para la chincheta del mapa (sin bloque, escalera, planta ni puerta). */
export function buildDireccionBusquedaMapaSiniestro(siniestro: Siniestro): string {
  return [calleDisplaySiniestro(siniestro), localidadDisplaySiniestro(siniestro), "España"]
    .filter(Boolean)
    .join(", ");
}
