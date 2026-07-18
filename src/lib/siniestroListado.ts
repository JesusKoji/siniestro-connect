import { Siniestro } from "@/data/siniestros";
import { formatFecha, parseFechaToDate } from "@/lib/fechas";
import { textoCampo, formatearTituloEs } from "@/lib/textoCampo";

export type OrdenSiniestroEnCurso =
  | "fechaRecepcion"
  | "diasAbierto"
  | "diasUltimoPrevio"
  | "siguientePrevio"
  | "alias";

export type DireccionOrden = "asc" | "desc";

export function parseEnteroSiniestro(value?: string): number {
  const texto = textoCampo(value).replace(/\./g, "").replace(",", ".");
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

export function aliasSiniestro(siniestro: Siniestro): string {
  return textoCampo(siniestro.alias) || textoCampo(siniestro.compania);
}

export function direccionCalleSiniestro(siniestro: Siniestro): string {
  return textoCampo(siniestro.direccionCalle) || textoCampo(siniestro.direccion);
}

export function aseguradoDisplaySiniestro(siniestro: Siniestro): string {
  return formatearTituloEs(siniestro.asegurado);
}

export function direccionCalleDisplaySiniestro(siniestro: Siniestro): string {
  return formatearTituloEs(direccionCalleSiniestro(siniestro));
}

export function poblacionDisplaySiniestro(siniestro: Siniestro): string {
  return formatearTituloEs(siniestro.poblacion);
}

export function fechaRecepcionSiniestro(siniestro: Siniestro): string {
  return formatFecha(siniestro.fechaRecepcion || siniestro.fechaApertura);
}

export function fechaSiguientePrevioSiniestro(siniestro: Siniestro): string {
  return formatFecha(siniestro.siguientePrevio);
}

/** Relleno de celda FechaRecepcion según DiasAbierto. */
export function claseSemaforoFechaRecepcion(diasAbierto: number): string {
  if (diasAbierto < 15) return "bg-emerald-100/90";
  if (diasAbierto <= 25) return "bg-amber-100/90";
  return "bg-red-100/90";
}

/** Color de texto DiasAbierto. */
export function claseSemaforoDiasAbierto(diasAbierto: number): string {
  if (diasAbierto <= 15) return "font-bold text-emerald-700";
  if (diasAbierto <= 25) return "font-bold text-amber-700";
  return "font-bold text-red-700";
}

/** Color de texto DiasUltimoPrevio. */
export function claseSemaforoDiasUltimoPrevio(diasUltimoPrevio: number): string {
  if (diasUltimoPrevio < 10) return "font-bold text-emerald-700";
  if (diasUltimoPrevio > 10 && diasUltimoPrevio < 15) return "font-bold text-amber-700";
  if (diasUltimoPrevio >= 15) return "font-bold text-red-700";
  return "";
}

/** Relleno de celda SiguientePrevio según DiasUltimoPrevio. */
export function claseSemaforoSiguientePrevio(diasUltimoPrevio: number): string {
  if (diasUltimoPrevio < 10) return "bg-emerald-100/90";
  if (diasUltimoPrevio > 10 && diasUltimoPrevio < 15) return "bg-amber-100/90";
  if (diasUltimoPrevio >= 15) return "bg-red-100/90";
  return "";
}

export function compararSiniestrosEnCurso(
  a: Siniestro,
  b: Siniestro,
  campo: OrdenSiniestroEnCurso,
  direccion: DireccionOrden
): number {
  let resultado = 0;

  switch (campo) {
    case "fechaRecepcion": {
      const fa = parseFechaToDate(a.fechaRecepcion || a.fechaApertura)?.getTime() ?? 0;
      const fb = parseFechaToDate(b.fechaRecepcion || b.fechaApertura)?.getTime() ?? 0;
      resultado = fa - fb;
      break;
    }
    case "diasAbierto":
      resultado = parseEnteroSiniestro(a.diasAbierto) - parseEnteroSiniestro(b.diasAbierto);
      break;
    case "diasUltimoPrevio":
      resultado =
        parseEnteroSiniestro(a.diasUltimoPrevio) - parseEnteroSiniestro(b.diasUltimoPrevio);
      break;
    case "siguientePrevio": {
      const fa = parseFechaToDate(a.siguientePrevio)?.getTime() ?? 0;
      const fb = parseFechaToDate(b.siguientePrevio)?.getTime() ?? 0;
      resultado = fa - fb;
      break;
    }
    case "alias":
      resultado = aliasSiniestro(a).localeCompare(aliasSiniestro(b), "es");
      break;
  }

  return direccion === "asc" ? resultado : -resultado;
}

export function filtrarSiniestrosEnCurso(siniestros: Siniestro[], query: string): Siniestro[] {
  const q = query.trim().toLowerCase();
  if (!q) return siniestros;

  return siniestros.filter((s) =>
    [
      s.numero,
      aliasSiniestro(s),
      s.asegurado,
      direccionCalleSiniestro(s),
      s.poblacion,
      s.tipo,
      s.zSumaPrevio,
    ]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}

function leerZTotalCrawford(siniestros: Siniestro[]): number {
  for (const siniestro of siniestros) {
    const texto = textoCampo(siniestro.zTotalCrawford);
    if (texto) return parseEnteroSiniestro(texto);
  }
  return 0;
}

/** Ej.: «39 en curso [ 12 Occident - 27 Crawford ]» (y = zTotalCrawford, x = total − y). */
export function formatearResumenEnCurso(siniestros: Siniestro[]): string {
  const total = siniestros.length;
  if (total === 0) return "0 en curso";

  const y = leerZTotalCrawford(siniestros);
  const x = Math.max(0, total - y);

  return `${total} en curso [ ${x} Occident - ${y} Crawford ]`;
}
