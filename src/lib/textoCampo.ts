/** Normaliza valores de FileMaker o formularios (p. ej. CP numérico) a string. */
export function textoCampo(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Minúsculas con la primera letra de cada palabra en mayúscula (p. ej. nombres y poblaciones). */
export function formatearTituloEs(value?: unknown): string {
  const texto = textoCampo(value);
  if (!texto) return "";
  const lower = texto.toLocaleLowerCase("es");
  return lower.replace(/(^|[\s,]+)([^\s,])/g, (_, separador, caracter) =>
    separador + caracter.toLocaleUpperCase("es")
  );
}

/** Omite marcadores vacíos que FileMaker devuelve en campos de contacto. */
export function valorContactoVisible(value: unknown): string {
  const texto = textoCampo(value);
  if (!texto || /^[_\-—.]+$/.test(texto)) return "";
  return texto;
}
