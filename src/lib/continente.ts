/**
 * Utilidades para la preexistencia de continente (tablas DETALLECONTINENTE y
 * TIPOLOGIASCONTINENTE). El importe de cada línea es Medicion × Precio.
 */

/** Convierte un número en formato español ("1.234,56") o inglés a número. */
export function parseNumeroEs(value?: string | number | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const texto = String(value ?? "").trim();
  if (!texto) return 0;

  const tieneComa = texto.includes(",");
  const tienePunto = texto.includes(".");

  let normalizado = texto;
  if (tieneComa && tienePunto) {
    // "1.234,56" → el punto es separador de miles y la coma decimal.
    normalizado = texto.replace(/\./g, "").replace(",", ".");
  } else if (tieneComa) {
    normalizado = texto.replace(",", ".");
  } else if (tienePunto && /^-?\d{1,3}(\.\d{3})+$/.test(texto)) {
    // "1.234" / "1.234.567" → el punto es separador de miles (no decimal).
    normalizado = texto.replace(/\./g, "");
  }

  const n = Number(normalizado.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Formatea un número como importe en euros (es-ES, 2 decimales). */
export function formatImporteEs(n: number): string {
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Calcula el importe (Medicion × Precio) y lo devuelve formateado. */
export function calcularImporteContinente(medicion?: string, precio?: string): string {
  const importe = parseNumeroEs(medicion) * parseNumeroEs(precio);
  return formatImporteEs(importe);
}
