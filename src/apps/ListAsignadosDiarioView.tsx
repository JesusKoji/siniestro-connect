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
  filasGraficoAsignadosDiario,
  nombreMesCompleto,
  type PuntoAsignadosDiario,
} from "@/lib/asignadosSiniestros";
import { listarAsignadosDiariosMesEnCurso } from "@/lib/filemaker";
import { BarChart3, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const COLORES = {
  occidente: "hsl(172 66% 38%)",
  resto: "hsl(32 95% 52%)",
  total: "hsl(var(--foreground))",
} as const;

const chartConfig = {
  occidente: { label: GRUPO_OCCIDENT_ETIQUETA, color: COLORES.occidente },
  resto: { label: "Resto", color: COLORES.resto },
} satisfies ChartConfig;

function etiquetaSegmento(valor: number) {
  return valor > 0 ? valor.toLocaleString("es-ES") : "";
}

type ListAsignadosDiarioViewProps = {
  onVolver: () => void;
};

export const ListAsignadosDiarioView = ({ onVolver }: ListAsignadosDiarioViewProps) => {
  const [puntos, setPuntos] = useState<PuntoAsignadosDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const diaHoy = new Date().getDate();

  useEffect(() => {
    setLoading(true);
    listarAsignadosDiariosMesEnCurso()
      .then(setPuntos)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar los asignados");
      })
      .finally(() => setLoading(false));
  }, []);

  const mes = puntos[0]?.mes ?? new Date().getMonth() + 1;
  const anio = puntos[0]?.anio ?? new Date().getFullYear();
  const tituloMes = nombreMesCompleto(mes, anio);
  const datos = useMemo(() => filasGraficoAsignadosDiario(puntos), [puntos]);
  const maxTotal = Math.max(...datos.map((fila) => fila.total), 1);
  const totalMes = datos.reduce((suma, fila) => suma + fila.total, 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="outline" onClick={onVolver} className="mb-4 rounded-xl">
            Volver al menú
          </Button>
          <h1 className="text-3xl font-bold">Siniestros asignados por día</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {tituloMes}. Cada barra muestra el total, {GRUPO_OCCIDENT_ETIQUETA} y Resto.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total del mes
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-accent">
            {loading ? "…" : totalMes.toLocaleString("es-ES")}
          </p>
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
            <p>No hay datos diarios para mostrar.</p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="w-full [&>div]:!aspect-auto"
              style={{ height: 480 }}
            >
              <BarChart data={datos} margin={{ top: 28, right: 8, left: 4, bottom: 8 }} barGap={2}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="hsl(var(--border) / 0.7)"
                />
                <XAxis
                  dataKey="etiqueta"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={({ x, y, payload }) => {
                    const esHoy = Number(payload.value) === diaHoy;
                    return (
                      <text
                        x={x}
                        y={y + 14}
                        textAnchor="middle"
                        fill={esHoy ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"}
                        fontSize={esHoy ? 12 : 11}
                        fontWeight={esHoy ? 800 : 500}
                      >
                        {payload.value}
                      </text>
                    );
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  domain={[0, Math.ceil(maxTotal * 1.25)]}
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
                        return `Día ${fila.dia} · Total ${fila.total.toLocaleString("es-ES")}`;
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
                  dataKey="occidente"
                  name={GRUPO_OCCIDENT_ETIQUETA}
                  stackId="dia"
                  fill={COLORES.occidente}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={18}
                >
                  <LabelList
                    dataKey="occidente"
                    position="center"
                    formatter={etiquetaSegmento}
                    style={{ fontSize: 9, fontWeight: 700, fill: "hsl(0 0% 100%)" }}
                  />
                </Bar>
                <Bar
                  dataKey="resto"
                  name="Resto"
                  stackId="dia"
                  fill={COLORES.resto}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                >
                  <LabelList
                    dataKey="resto"
                    position="center"
                    formatter={etiquetaSegmento}
                    style={{ fontSize: 9, fontWeight: 700, fill: "hsl(24 45% 18%)" }}
                  />
                  <LabelList
                    dataKey="total"
                    position="top"
                    offset={6}
                    formatter={(valor: number) => (valor > 0 ? valor.toLocaleString("es-ES") : "")}
                    style={{ fontSize: 10, fontWeight: 700, fill: COLORES.total }}
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
