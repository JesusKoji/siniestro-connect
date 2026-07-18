import { format, isValid, parse } from "date-fns";

function normalizeYear(year: string) {
  return year.length === 2 ? `20${year}` : year;
}

export function formatFecha(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+.*)?$/);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    const firstNumber = Number(first);
    const secondNumber = Number(second);
    const fullYear = normalizeYear(year);
    const [day, month] = firstNumber > 12
      ? [first, second]
      : secondNumber > 12
        ? [second, first]
        : [second, first];

    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${fullYear}`;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsed);
  }

  return raw;
}

export function parseFechaToDate(value?: string): Date | undefined {
  const normalized = formatFecha(value);
  if (!normalized) return undefined;

  const parsed = parse(normalized, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function formatFechaFromDate(date: Date) {
  return format(date, "dd/MM/yyyy");
}
