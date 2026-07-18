import { useEffect, useMemo, useState } from "react";
import { SiniestroFichaSection } from "@/components/SiniestroFichaSection";
import { AppHeader, type VistaDesktop } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Siniestro } from "@/data/siniestros";
import { listarSiniestrosEnCurso, obtenerDetalleSiniestro } from "@/lib/filemaker";
import { direccionVistaDisplaySiniestro } from "@/lib/direccionSiniestro";
import {
  aliasSiniestro,
  aseguradoDisplaySiniestro,
  claseSemaforoDiasAbierto,
  claseSemaforoDiasUltimoPrevio,
  claseSemaforoFechaRecepcion,
  claseSemaforoSiguientePrevio,
  compararSiniestrosEnCurso,
  fechaRecepcionSiniestro,
  fechaSiguientePrevioSiniestro,
  filtrarSiniestrosEnCurso,
  formatearResumenEnCurso,
  parseEnteroSiniestro,
  poblacionDisplaySiniestro,
  type OrdenSiniestroEnCurso,
} from "@/lib/siniestroListado";
import { textoCampo } from "@/lib/textoCampo";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

type SiniestrosAppProps = {
  onNavigate: (vista: VistaDesktop) => void;
  onLogout: () => void;
};

type ColumnaOrdenable = {
  key: OrdenSiniestroEnCurso;
  label: string;
  titulo?: string;
  className?: string;
};

const ENCABEZADOS: Array<
  | { tipo: "orden"; columna: ColumnaOrdenable }
  | { tipo: "texto"; label: string; titulo?: string; className?: string; celdaClassName?: string }
> = [
  { tipo: "orden", columna: { key: "fechaRecepcion", label: "F. recepción", className: "min-w-[7rem]" } },
  { tipo: "texto", label: "Nº siniestro", className: "min-w-[6.5rem]" },
  {
    tipo: "orden",
    columna: { key: "alias", label: "Compañía", className: "w-[9rem] min-w-[9rem] max-w-[9rem]" },
  },
  { tipo: "texto", label: "Asegurado", className: "min-w-[9rem]" },
  { tipo: "texto", label: "Dirección", className: "min-w-[12rem]" },
  { tipo: "texto", label: "Población", className: "min-w-[7rem]" },
  {
    tipo: "orden",
    columna: {
      key: "diasAbierto",
      label: "Duracion",
      titulo: "Días abierto",
      className: "min-w-[4.75rem] max-w-[4.75rem] px-2 text-center",
    },
  },
  {
    tipo: "orden",
    columna: {
      key: "diasUltimoPrevio",
      label: "Ult. previo",
      titulo: "Días último previo",
      className: "min-w-[4.75rem] max-w-[4.75rem] px-2 text-center",
    },
  },
  {
    tipo: "orden",
    columna: {
      key: "siguientePrevio",
      label: "S. Previo",
      titulo: "Siguiente previo",
      className: "w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] border-l border-border/40 pl-4 text-center",
    },
  },
  {
    tipo: "texto",
    label: "Previos",
    titulo: "Suma previo",
    className: "min-w-[4.25rem] max-w-[4.25rem] px-2 text-center",
    celdaClassName: "px-2 text-center",
  },
  {
    tipo: "texto",
    label: "Tipo siniestro",
    className: "min-w-[10rem]",
    celdaClassName: "min-w-[10rem] whitespace-normal",
  },
];

export const SiniestrosApp = ({ onNavigate, onLogout }: SiniestrosAppProps) => {
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [orden, setOrden] = useState<{ campo: OrdenSiniestroEnCurso; dir: "asc" | "desc" }>({
    campo: "fechaRecepcion",
    dir: "desc",
  });
  const [seleccionado, setSeleccionado] = useState<Siniestro | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    setLoading(true);
    listarSiniestrosEnCurso()
      .then(setSiniestros)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar los siniestros");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => filtrarSiniestrosEnCurso(siniestros, query), [siniestros, query]);

  const ordenados = useMemo(
    () =>
      [...filtrados].sort((a, b) => compararSiniestrosEnCurso(a, b, orden.campo, orden.dir)),
    [filtrados, orden]
  );

  const alternarOrden = (campo: OrdenSiniestroEnCurso) => {
    setOrden((actual) =>
      actual.campo === campo
        ? { campo, dir: actual.dir === "asc" ? "desc" : "asc" }
        : { campo, dir: campo === "fechaRecepcion" ? "desc" : "asc" }
    );
  };

  const abrirSiniestro = async (siniestro: Siniestro) => {
    setCargandoDetalle(true);
    try {
      const detalle = await obtenerDetalleSiniestro(siniestro);
      setSeleccionado(detalle);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el siniestro");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const iconoOrden = (campo: OrdenSiniestroEnCurso) => {
    if (orden.campo !== campo) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
    return orden.dir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
    );
  };

  if (seleccionado) {
    return (
      <div className="min-h-screen gradient-surface text-foreground">
        <AppHeader active="siniestros" onNavigate={onNavigate} onLogout={onLogout} />
        <main className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <Button variant="outline" onClick={() => setSeleccionado(null)} className="mb-6 rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al listado
          </Button>
          <SiniestroFichaSection siniestro={seleccionado} mostrarMetricasEnCurso />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-surface text-foreground">
      <AppHeader active="en-curso" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="mx-auto max-w-[1600px] px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button variant="outline" onClick={() => onNavigate("menu")} className="mb-4 rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al menú
            </Button>
            <h1 className="text-2xl font-bold">En curso</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Cargando expedientes..." : formatearResumenEnCurso(siniestros)}
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nº, asegurado, alias, población..."
              className="h-11 rounded-xl pl-10"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card shadow-soft">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          ) : ordenados.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>No hay siniestros en curso</p>
            </div>
          ) : (
            <Table className="min-w-[1180px] table-fixed">
              <colgroup>
                <col className="w-[7rem]" />
                <col className="w-[6.5rem]" />
                <col className="w-[9rem]" />
                <col className="w-[9rem]" />
                <col className="w-[11rem]" />
                <col className="w-[7rem]" />
                <col className="w-[4.75rem]" />
                <col className="w-[4.75rem]" />
                <col className="w-[6.75rem]" />
                <col className="w-[4.25rem]" />
                <col className="w-[10rem]" />
              </colgroup>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {ENCABEZADOS.map((item) =>
                    item.tipo === "orden" ? (
                      <TableHead
                        key={item.columna.key}
                        className={item.columna.className}
                        title={item.columna.titulo ?? item.columna.label}
                      >
                        <button
                          type="button"
                          onClick={() => alternarOrden(item.columna.key)}
                          className={cn(
                            "inline-flex items-center whitespace-nowrap text-xs font-semibold hover:text-foreground",
                            item.columna.className?.includes("text-center") && "mx-auto w-full justify-center"
                          )}
                        >
                          {item.columna.label}
                          {iconoOrden(item.columna.key)}
                        </button>
                      </TableHead>
                    ) : (
                      <TableHead
                        key={item.label}
                        className={item.className}
                        title={item.titulo ?? item.label}
                      >
                        <span className="text-xs font-semibold">{item.label}</span>
                      </TableHead>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenados.map((siniestro) => {
                  const diasAbierto = parseEnteroSiniestro(siniestro.diasAbierto);
                  const diasUltimoPrevio = parseEnteroSiniestro(siniestro.diasUltimoPrevio);

                  return (
                    <TableRow
                      key={siniestro.id}
                      className="cursor-pointer"
                      onClick={() => abrirSiniestro(siniestro)}
                    >
                      <TableCell className={claseSemaforoFechaRecepcion(diasAbierto)}>
                        {fechaRecepcionSiniestro(siniestro) || "-"}
                      </TableCell>
                      <TableCell className="font-semibold text-accent">{siniestro.numero || "-"}</TableCell>
                      <TableCell className="w-[9rem] min-w-[9rem] max-w-[9rem] whitespace-nowrap font-medium text-foreground">
                        <span title={aliasSiniestro(siniestro)}>{aliasSiniestro(siniestro) || "-"}</span>
                      </TableCell>
                      <TableCell>{aseguradoDisplaySiniestro(siniestro) || "-"}</TableCell>
                      <TableCell
                        className="max-w-[12rem] truncate"
                        title={direccionVistaDisplaySiniestro(siniestro)}
                      >
                        {direccionVistaDisplaySiniestro(siniestro) || "-"}
                      </TableCell>
                      <TableCell>{poblacionDisplaySiniestro(siniestro) || "-"}</TableCell>
                      <TableCell
                        className={`px-2 text-center text-sm ${claseSemaforoDiasAbierto(diasAbierto)}`}
                      >
                        {textoCampo(siniestro.diasAbierto) || "-"}
                      </TableCell>
                      <TableCell
                        className={`px-2 text-center text-sm ${claseSemaforoDiasUltimoPrevio(diasUltimoPrevio)}`}
                      >
                        {textoCampo(siniestro.diasUltimoPrevio) || "-"}
                      </TableCell>
                      <TableCell
                        className={`border-l border-border/40 pl-4 text-center text-sm ${claseSemaforoSiguientePrevio(diasUltimoPrevio)}`}
                      >
                        {fechaSiguientePrevioSiniestro(siniestro) || "-"}
                      </TableCell>
                      <TableCell className="px-2 text-center text-sm">
                        {textoCampo(siniestro.zSumaPrevio) || "-"}
                      </TableCell>
                      <TableCell className="min-w-[10rem] whitespace-normal text-sm leading-snug">
                        {siniestro.tipo || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {cargandoDetalle ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : null}
    </div>
  );
};
