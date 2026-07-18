import { Siniestro } from "@/data/siniestros";
import { formatFecha, parseFechaToDate } from "@/lib/fechas";
import { direccionVistaDisplaySiniestro } from "@/lib/direccionSiniestro";
import { poblacionDisplaySiniestro } from "@/lib/siniestroListado";
import { formatearTituloEs, textoCampo } from "@/lib/textoCampo";

export function fechaRecepcionDisplaySiniestro(siniestro: Siniestro): string {
  return formatFecha(siniestro.fechaRecepcion || siniestro.fechaApertura);
}

export function horaRecepcionDisplaySiniestro(siniestro: Siniestro): string {
  return textoCampo(siniestro.horaRecepcion);
}

export function fechaAsignacionDisplaySiniestro(siniestro: Siniestro): string {
  return formatFecha(siniestro.fechaAsignacion);
}

export function horaAsignacionDisplaySiniestro(siniestro: Siniestro): string {
  return textoCampo(siniestro.horaAsignacion);
}

export function fechaEfectoPolizaDisplaySiniestro(siniestro: Siniestro): string {
  return formatFecha(siniestro.fechaEfectoPoliza);
}

export function fechaOcurrenciaDisplaySiniestro(siniestro: Siniestro): string {
  return formatFecha(siniestro.fechaOcurrencia);
}

export function estadoSiniestroDisplay(siniestro: Siniestro): string {
  return textoCampo(siniestro.fechaCierre) ? "Cerrado" : "En curso";
}

export function campoDireccionDisplay(value?: string): string {
  return formatearTituloEs(value);
}

export function provinciaDisplaySiniestro(siniestro: Siniestro): string {
  return formatearTituloEs(siniestro.provincia);
}

export function codPostalDisplaySiniestro(siniestro: Siniestro): string {
  return textoCampo(siniestro.codPostal);
}

/** Calle + interior + CP + población + provincia en una sola línea. */
export function direccionCompletaDisplaySiniestro(siniestro: Siniestro): string {
  return direccionVistaDisplaySiniestro(siniestro);
}

export function filtrarSiniestrosGeneral(siniestros: Siniestro[], query: string): Siniestro[] {
  const q = query.trim().toLowerCase();
  if (!q) return siniestros;

  return siniestros.filter((s) =>
    [
      s.numero,
      s.numeroSiniestro2,
      s.crawfordSini,
      fechaRecepcionDisplaySiniestro(s),
      horaRecepcionDisplaySiniestro(s),
      direccionVistaDisplaySiniestro(s),
      codPostalDisplaySiniestro(s),
      poblacionDisplaySiniestro(s),
      provinciaDisplaySiniestro(s),
    ]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}

export function compararSiniestrosGeneralPorRecepcion(a: Siniestro, b: Siniestro): number {
  const fa = parseFechaToDate(a.fechaRecepcion || a.fechaApertura)?.getTime() ?? 0;
  const fb = parseFechaToDate(b.fechaRecepcion || b.fechaApertura)?.getTime() ?? 0;
  return fb - fa;
}
