import type { Siniestro } from "@/data/siniestros";
import { parseFechaToDate } from "@/lib/fechas";

export type PeriodoListadoAsignados = "anual" | "mensual" | "diario";

export type PuntoAsignadosAnual = {
  anio: number;
  etiqueta: string;
  total: number;
};

export const COMPANIAS_ASIGNADOS_SEGUIMIENTO = [
  { id: "Cia_0001", clave: "cia0001", etiqueta: "Cia_0001" },
  { id: "Cia_0002", clave: "cia0002", etiqueta: "Cia_0002" },
  { id: "Cia_0210", clave: "cia0210", etiqueta: "Cia_0210" },
  { id: "Cia_0003", clave: "cia0003", etiqueta: "Cia_0003" },
  { id: "Cia_0347", clave: "cia0347", etiqueta: "Cia_0347" },
] as const;

export type ClaveCompaniaAsignados =
  (typeof COMPANIAS_ASIGNADOS_SEGUIMIENTO)[number]["clave"] | "resto";

export type DesgloseCompaniaAsignados = {
  total: number;
  cia0001: number;
  cia0002: number;
  cia0210: number;
  cia0003: number;
  cia0347: number;
  resto: number;
};

export type PuntoAsignadosMensualComparado = {
  mes: number;
  etiqueta: string;
  anioActual: number;
  anioAnterior: number;
  actual: DesgloseCompaniaAsignados;
  anterior: DesgloseCompaniaAsignados;
};

export type PuntoAsignadosDiario = {
  dia: number;
  etiqueta: string;
  mes: number;
  anio: number;
  desglose: DesgloseCompaniaAsignados;
};

export type FilaGraficoAsignadosDiario = {
  dia: number;
  etiqueta: string;
  total: number;
  occidente: number;
  resto: number;
  desglose: DesgloseCompaniaAsignados;
};

export type FilaGraficoAsignadosMensual = {
  mes: number;
  etiqueta: string;
  totalAnterior: number;
  totalActual: number;
  anterior: DesgloseCompaniaAsignados;
  actual: DesgloseCompaniaAsignados;
} & Record<string, number | string>;

export type FormatoBusquedaAnioFecha =
  | "mdy-rango"
  | "mdy-rango-corto"
  | "dmy-rango"
  | "iso-rango"
  | "anio-solo"
  | "mes-anio";

export type CandidatoBusquedaAnioFecha = {
  formato: FormatoBusquedaAnioFecha;
  valor: string;
};

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

export function extraerFechaAsignacionSiniestro(siniestro: Siniestro): Date | undefined {
  return parseFechaToDate(siniestro.fechaAsignacion ?? siniestro.fechaApertura);
}

/** @deprecated Usar valorBusquedaAnioFecha con formato detectado. */
export function rangoFechaAnioAsignacion(anio: number): string {
  return valorBusquedaAnioFecha("mdy-rango", anio);
}

export function valorBusquedaAnioFecha(formato: FormatoBusquedaAnioFecha, anio: number): string {
  switch (formato) {
    case "mdy-rango":
      return `01/01/${anio}...12/31/${anio}`;
    case "mdy-rango-corto":
      return `1/1/${anio}...12/31/${anio}`;
    case "dmy-rango":
      return `01/01/${anio}...31/12/${anio}`;
    case "iso-rango":
      return `${anio}-01-01...${anio}-12-31`;
    case "anio-solo":
      return String(anio);
    case "mes-anio":
      return `1/${anio}`;
  }
}

export function candidatosBusquedaAnioFecha(anio: number): CandidatoBusquedaAnioFecha[] {
  const formatos: FormatoBusquedaAnioFecha[] = [
    "mdy-rango",
    "mdy-rango-corto",
    "iso-rango",
    "anio-solo",
    "dmy-rango",
    "mes-anio",
  ];

  return formatos.map((formato) => ({
    formato,
    valor: valorBusquedaAnioFecha(formato, anio),
  }));
}

export function valorBusquedaMesAnioFecha(mes: number, anio: number): string {
  return `${mes}/${anio}`;
}

export function valorBusquedaRangoMes(
  mes: number,
  anio: number,
  formato: FormatoBusquedaAnioFecha
): string {
  if (formato === "mes-anio") return valorBusquedaMesAnioFecha(mes, anio);

  const ultimoDia = new Date(anio, mes, 0).getDate();
  const mm = String(mes).padStart(2, "0");
  const dd = String(ultimoDia).padStart(2, "0");

  switch (formato) {
    case "iso-rango":
      return `${anio}-${mm}-01...${anio}-${mm}-${dd}`;
    case "dmy-rango":
      return `01/${mm}/${anio}...${dd}/${mm}/${anio}`;
    case "mdy-rango-corto":
      return `${mes}/1/${anio}...${mes}/${ultimoDia}/${anio}`;
    case "mdy-rango":
    default:
      return `${mm}/01/${anio}...${mm}/${dd}/${anio}`;
  }
}

export function valorBusquedaDia(
  dia: number,
  mes: number,
  anio: number,
  formato: FormatoBusquedaAnioFecha
): string {
  const mm = String(mes).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");

  switch (formato) {
    case "iso-rango":
      return `${anio}-${mm}-${dd}`;
    case "dmy-rango":
      return `${dd}/${mm}/${anio}`;
    case "mdy-rango-corto":
    case "mes-anio":
      return `${mes}/${dia}/${anio}`;
    case "mdy-rango":
    case "anio-solo":
    default:
      return `${mm}/${dd}/${anio}`;
  }
}

export function candidatosBusquedaDia(dia: number, mes: number, anio: number): string[] {
  const mm = String(mes).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  const formatos: FormatoBusquedaAnioFecha[] = [
    "mdy-rango",
    "mdy-rango-corto",
    "iso-rango",
    "dmy-rango",
    "mes-anio",
  ];

  return [
    ...formatos.map((formato) => valorBusquedaDia(dia, mes, anio, formato)),
    `${mm}/${dd}/${anio}...${mm}/${dd}/${anio}`,
    `${mes}/${dia}/${anio}...${mes}/${dia}/${anio}`,
    `${dd}/${mm}/${anio}...${dd}/${mm}/${anio}`,
    `${anio}-${mm}-${dd}...${anio}-${mm}-${dd}`,
  ];
}

export function diasEnMes(mes: number, anio: number): number {
  return new Date(anio, mes, 0).getDate();
}

export function nombreMesCompleto(mes: number, anio: number): string {
  return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
    new Date(anio, mes - 1, 1)
  );
}

export function desgloseVacio(): DesgloseCompaniaAsignados {
  return {
    total: 0,
    cia0001: 0,
    cia0002: 0,
    cia0210: 0,
    cia0003: 0,
    cia0347: 0,
    resto: 0,
  };
}

export const GRUPO_OCCIDENT_ETIQUETA = "Occident";

export function totalOccidenteAsignados(desglose: DesgloseCompaniaAsignados): number {
  return COMPANIAS_ASIGNADOS_SEGUIMIENTO.reduce(
    (total, compania) => total + desglose[compania.clave],
    0
  );
}

export function filasGraficoAsignadosDiario(
  puntos: PuntoAsignadosDiario[]
): FilaGraficoAsignadosDiario[] {
  return puntos.map((punto) => ({
    dia: punto.dia,
    etiqueta: punto.etiqueta,
    total: punto.desglose.total,
    occidente: totalOccidenteAsignados(punto.desglose),
    resto: punto.desglose.resto,
    desglose: punto.desglose,
  }));
}

export function filasGraficoAsignadosMensual(
  puntos: PuntoAsignadosMensualComparado[]
): FilaGraficoAsignadosMensual[] {
  return puntos.map((punto) => ({
    mes: punto.mes,
    etiqueta: punto.etiqueta,
    totalAnterior: punto.anterior.total,
    totalActual: punto.actual.total,
    anterior: punto.anterior,
    actual: punto.actual,
    ant_occidente: totalOccidenteAsignados(punto.anterior),
    act_occidente: totalOccidenteAsignados(punto.actual),
    ant_resto: punto.anterior.resto,
    act_resto: punto.actual.resto,
  }));
}

export function nombreMes(mes: number) {
  return MESES[mes - 1] ?? String(mes);
}

export function agruparAsignadosAnual(siniestros: Siniestro[]): PuntoAsignadosAnual[] {
  const conteo = new Map<number, number>();

  for (const siniestro of siniestros) {
    const fecha = extraerFechaAsignacionSiniestro(siniestro);
    if (!fecha) continue;
    const anio = fecha.getFullYear();
    conteo.set(anio, (conteo.get(anio) ?? 0) + 1);
  }

  return [...conteo.entries()]
    .sort(([a], [b]) => b - a)
    .map(([anio, total]) => ({
      anio,
      etiqueta: String(anio),
      total,
    }));
}

export function totalAsignadosConFecha(siniestros: Siniestro[]) {
  return siniestros.reduce((total, siniestro) => {
    return extraerFechaAsignacionSiniestro(siniestro) ? total + 1 : total;
  }, 0);
}

export function etiquetaMes(anio: number, mes: number) {
  const nombre = MESES[mes - 1] ?? String(mes);
  return `${nombre} ${anio}`;
}
