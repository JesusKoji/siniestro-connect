import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  GRUPO_OCCIDENT_ETIQUETA,
  filasGraficoAsignadosMensual,
  type PuntoAsignadosMensualComparado,
} from "@/lib/asignadosSiniestros";
import { listarAsignadosMensualesComparados } from "@/lib/filemaker";
import { BarChart3, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const COLORES = {
  occidente: "hsl(172 66% 38%)",
  resto: "hsl(32 95% 52%)",
  total: "hsl(var(--foreground))",
  totalAnterior: "hsl(var(--muted-foreground))",
} as const;

const chartConfig = {
  ant_occidente: { label: GRUPO_OCCIDENT_ETIQUETA, color: COLORES.occidente },
  ant_resto: { label: "Resto", color: COLORES.resto },
  act_occidente: { label: GRUPO_OCCIDENT_ETIQUETA, color: COLORES.occidente },
  act_resto: { label: "Resto", color: COLORES.resto },
} satisfies ChartConfig;

function etiquetaSegmento(valor: number) {
  return valor > 0 ? valor.toLocaleString("es-ES") : "";
}

type ListAsignadosMensualViewProps = {
  onVolver: () => void;
};

export const ListAsignadosMensualView = ({ onVolver }: ListAsignadosMensualViewProps) => {
  const [puntos, setPuntos] = useState<PuntoAsignadosMensualComparado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listarAsignadosMensualesComparados()
      .then(setPuntos)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar los asignados");
      })
      .finally(() => setLoading(false));
  }, []);

  const anioActual = puntos[0]?.anioActual ?? new Date().getFullYear();
  const anioAnterior = puntos[0]?.anioAnterior ?? anioActual - 1;
  const datos = useMemo(() => filasGraficoAsignadosMensual(puntos), [puntos]);
  const maxTotal = Math.max(
    ...datos.flatMap((fila) => [fila.totalAnterior, fila.totalActual]),
    1
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="outline" onClick={onVolver} className="mb-4 rounded-xl">
            Volver al menú
          </Button>
          <h1 className="text-3xl font-bold">Siniestros asignados por mes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparativa {anioAnterior} vs {anioActual}. Cada barra muestra el total, {GRUPO_OCCIDENT_ETIQUETA}{" "}
            y Resto.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 font-medium">
            {anioAnterior}: barras atenuadas
          </span>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-medium text-accent">
            {anioActual}: barras intensas
          </span>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
          </div>
        ) : datos.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center text-muted-foreground">
            <BarChart3 className="mb-3 h-10 w-10 opacity-40" />
            <p>No hay datos mensuales para mostrar.</p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="w-full [&>div]:!aspect-auto"
              style={{ height: 480 }}
            >
            <BarChart data={datos} margin={{ top: 28, right: 8, left: 4, bottom: 8 }} barGap={4}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border) / 0.7)" />
              <XAxis
                dataKey="etiqueta"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                domain={[0, Math.ceil(maxTotal * 1.2)]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(valor) => valor.toLocaleString("es-ES")}
                label={{
                  value: "Asignados",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const fila = payload?.[0]?.payload as (typeof datos)[number] | undefined;
                      if (!fila) return "";
                      const esActual = payload?.some((item) =>
                        String(item.dataKey ?? "").startsWith("act_")
                      );
                      const bloque = esActual ? fila.actual : fila.anterior;
                      const anio = esActual ? anioActual : anioAnterior;
                      return `${fila.etiqueta} ${anio} · Total ${bloque.total.toLocaleString("es-ES")}`;
                    }}
                    formatter={(value, name) => {
                      const clave = String(name);
                      const etiqueta = clave.includes("occidente")
                        ? GRUPO_OCCIDENT_ETIQUETA
                        : "Resto";
                      return [`${Number(value).toLocaleString("es-ES")}`, etiqueta];
                    }}
                  />
                }
              />

              <Bar
                dataKey="ant_occidente"
                name={`${anioAnterior} · ${GRUPO_OCCIDENT_ETIQUETA}`}
                stackId="anterior"
                fill={COLORES.occidente}
                fillOpacity={0.55}
                radius={[0, 0, 0, 0]}
                maxBarSize={22}
              >
                <LabelList
                  dataKey="ant_occidente"
                  position="center"
                  formatter={etiquetaSegmento}
                  style={{ fontSize: 10, fontWeight: 700, fill: "hsl(0 0% 100%)" }}
                />
              </Bar>
              <Bar
                dataKey="ant_resto"
                name={`${anioAnterior} · Resto`}
                stackId="anterior"
                fill={COLORES.resto}
                fillOpacity={0.55}
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              >
                <LabelList
                  dataKey="ant_resto"
                  position="center"
                  formatter={etiquetaSegmento}
                  style={{ fontSize: 10, fontWeight: 700, fill: "hsl(24 45% 18%)" }}
                />
                <LabelList
                  dataKey="totalAnterior"
                  position="top"
                  offset={6}
                  formatter={(valor: number) => valor.toLocaleString("es-ES")}
                  style={{ fontSize: 11, fontWeight: 600, fill: COLORES.totalAnterior }}
                />
              </Bar>

              <Bar
                dataKey="act_occidente"
                name={`${anioActual} · ${GRUPO_OCCIDENT_ETIQUETA}`}
                stackId="actual"
                fill={COLORES.occidente}
                radius={[0, 0, 0, 0]}
                maxBarSize={22}
              >
                <LabelList
                  dataKey="act_occidente"
                  position="center"
                  formatter={etiquetaSegmento}
                  style={{ fontSize: 10, fontWeight: 700, fill: "hsl(0 0% 100%)" }}
                />
              </Bar>
              <Bar
                dataKey="act_resto"
                name={`${anioActual} · Resto`}
                stackId="actual"
                fill={COLORES.resto}
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              >
                <LabelList
                  dataKey="act_resto"
                  position="center"
                  formatter={etiquetaSegmento}
                  style={{ fontSize: 10, fontWeight: 700, fill: "hsl(24 45% 18%)" }}
                />
                <LabelList
                  dataKey="totalActual"
                  position="top"
                  offset={6}
                  formatter={(valor: number) => valor.toLocaleString("es-ES")}
                  style={{ fontSize: 11, fontWeight: 700, fill: COLORES.total }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border/60 pt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2.5">
                <span
                  className="inline-flex h-5 min-w-[2rem] items-center justify-center rounded border px-1.5 text-[10px] font-bold"
                  style={{ borderColor: COLORES.total, color: COLORES.total }}
                >
                  n
                </span>
                Total
              </span>
              <span className="inline-flex items-center gap-2.5">
                <span
                  className="h-3.5 w-3.5 rounded-sm"
                  style={{ backgroundColor: COLORES.occidente }}
                />
                {GRUPO_OCCIDENT_ETIQUETA}
              </span>
              <span className="inline-flex items-center gap-2.5">
                <span
                  className="h-3.5 w-3.5 rounded-sm"
                  style={{ backgroundColor: COLORES.resto }}
                />
                Resto
              </span>
            </div>
          </>
        )}
      </section>
    </>
  );
};
