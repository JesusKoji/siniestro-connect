import { ListAsignadosDiarioView } from "@/apps/ListAsignadosDiarioView";
import { ListAsignadosMensualView } from "@/apps/ListAsignadosMensualView";
import { useEffect, useMemo, useState } from "react";
import { AppHeader, type VistaDesktop } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  type PeriodoListadoAsignados,
  type PuntoAsignadosAnual,
} from "@/lib/asignadosSiniestros";
import { listarAsignadosAnuales } from "@/lib/filemaker";
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

type ListAsignadosAppProps = {
  periodo: PeriodoListadoAsignados;
  onNavigate: (vista: VistaDesktop) => void;
  onVolver: () => void;
  onLogout: () => void;
};

const chartConfig = {
  total: {
    label: "Siniestros asignados",
    color: "hsl(var(--accent))",
  },
  tendencia: {
    label: "Tendencia",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export const ListAsignadosApp = ({ periodo, onNavigate, onVolver, onLogout }: ListAsignadosAppProps) => {
  const [puntosAnuales, setPuntosAnuales] = useState<PuntoAsignadosAnual[]>([]);
  const [loading, setLoading] = useState(true);
  const anioActual = new Date().getFullYear();

  useEffect(() => {
    if (periodo !== "anual") return;
    setLoading(true);
    listarAsignadosAnuales()
      .then(setPuntosAnuales)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar los asignados");
      })
      .finally(() => setLoading(false));
  }, [periodo]);

  const totalGeneral = puntosAnuales.reduce((suma, punto) => suma + punto.total, 0);
  /** Cronológico izquierda → derecha (año antiguo a reciente). */
  const datosGrafico = useMemo(
    () => [...puntosAnuales].sort((a, b) => a.anio - b.anio),
    [puntosAnuales]
  );
  const maxTotal = Math.max(...datosGrafico.map((punto) => punto.total), 1);
  const alturaGrafico = Math.max(380, 280 + Math.min(datosGrafico.length, 8) * 8);

  if (periodo === "mensual") {
    return (
      <div className="min-h-screen gradient-surface text-foreground">
        <AppHeader active={null} onNavigate={onNavigate} onLogout={onLogout} />
        <main className="mx-auto max-w-7xl px-8 py-8">
          <ListAsignadosMensualView onVolver={onVolver} />
        </main>
      </div>
    );
  }

  if (periodo === "diario") {
    return (
      <div className="min-h-screen gradient-surface text-foreground">
        <AppHeader active={null} onNavigate={onNavigate} onLogout={onLogout} />
        <main className="mx-auto max-w-7xl px-8 py-8">
          <ListAsignadosDiarioView onVolver={onVolver} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-surface text-foreground">
      <AppHeader active={null} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button variant="outline" onClick={onVolver} className="mb-4 rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al menú
            </Button>
            <h1 className="text-3xl font-bold">Siniestros asignados por año</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Evolución anual de siniestros asignados (año actual a la derecha).
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total asignados
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-accent">
              {loading ? "…" : totalGeneral.toLocaleString("es-ES")}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          ) : puntosAnuales.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-muted-foreground">
              <BarChart3 className="mb-3 h-10 w-10 opacity-40" />
              <p>No hay siniestros con fecha de asignación para mostrar.</p>
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="w-full [&>div]:!aspect-auto"
              style={{ height: alturaGrafico }}
            >
              <ComposedChart
                data={datosGrafico}
                margin={{ top: 28, right: 12, left: 4, bottom: 8 }}
                barCategoryGap="20%"
              >
                <defs>
                  <linearGradient id="area-asignados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="hsl(var(--border) / 0.7)"
                />
                <XAxis
                  dataKey="etiqueta"
                  tickLine={false}
                  axisLine={false}
                  tick={({ x, y, payload }) => {
                    const esActual = Number(payload.value) === anioActual;
                    return (
                      <text
                        x={x}
                        y={y + 14}
                        textAnchor="middle"
                        fill={esActual ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"}
                        fontSize={esActual ? 13 : 12}
                        fontWeight={esActual ? 800 : 500}
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
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(valor) => valor.toLocaleString("es-ES")}
                  domain={[0, Math.ceil(maxTotal * 1.18)]}
                  label={{
                    value: "Siniestros",
                    angle: -90,
                    position: "insideLeft",
                    offset: 12,
                    style: { fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 },
                  }}
                />
                <ChartTooltip
                  cursor={{ stroke: "hsl(var(--accent) / 0.25)", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => `Año ${label}`}
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString("es-ES")} siniestros`,
                        name === "tendencia" ? "Tendencia" : "Asignados",
                      ]}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  fill="url(#area-asignados)"
                  stroke="none"
                  isAnimationActive
                />
                <Bar
                  dataKey="total"
                  fill="hsl(var(--accent))"
                  radius={[10, 10, 0, 0]}
                  maxBarSize={52}
                  opacity={0.92}
                  isAnimationActive
                >
                  <LabelList
                    dataKey="total"
                    position="top"
                    offset={10}
                    className="fill-foreground"
                    formatter={(valor: number) => valor.toLocaleString("es-ES")}
                    style={{ fontSize: 12, fontWeight: 700 }}
                  />
                </Bar>
                <Line
                  type="monotone"
                  dataKey="total"
                  name="tendencia"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 6 }}
                  isAnimationActive
                />
              </ComposedChart>
            </ChartContainer>
          )}
        </section>
      </main>
    </div>
  );
};
