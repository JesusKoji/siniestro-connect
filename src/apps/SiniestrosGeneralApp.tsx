import { useMemo, useState } from "react";
import { AppHeader, type VistaDesktop } from "@/components/AppHeader";
import { SiniestroFichaSection, type ModoSiniestroFicha } from "@/components/SiniestroFichaSection";
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
import { Siniestro, siniestroVacio } from "@/data/siniestros";
import {
  actualizarSiniestro,
  borrarSiniestro,
  buscarSiniestros,
  crearSiniestro,
  obtenerDetalleSiniestro,
} from "@/lib/filemaker";
import { direccionVistaDisplaySiniestro } from "@/lib/direccionSiniestro";
import {
  codPostalDisplaySiniestro,
  compararSiniestrosGeneralPorRecepcion,
  fechaRecepcionDisplaySiniestro,
  horaRecepcionDisplaySiniestro,
  provinciaDisplaySiniestro,
} from "@/lib/siniestroGeneralListado";
import { poblacionDisplaySiniestro } from "@/lib/siniestroListado";
import { textoCampo } from "@/lib/textoCampo";
import {
  AlertTriangle,
  ArrowLeft,
  Edit3,
  FileText,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type SiniestrosGeneralAppProps = {
  onNavigate: (vista: VistaDesktop) => void;
  onLogout: () => void;
};

const COLUMNAS = [
  { key: "numero", label: "Nº siniestro", className: "min-w-[7rem]" },
  { key: "numero2", label: "Nº siniestro 2", className: "min-w-[7rem]" },
  { key: "crawford", label: "Crawford", className: "min-w-[5.5rem]" },
  { key: "fecha", label: "F. recepción", className: "min-w-[7rem]" },
  { key: "hora", label: "Hora", className: "min-w-[5rem]" },
  { key: "direccion", label: "Dirección", className: "min-w-[14rem]" },
  { key: "cp", label: "C.P.", className: "min-w-[5rem]" },
  { key: "poblacion", label: "Población", className: "min-w-[8rem]" },
  { key: "provincia", label: "Provincia", className: "min-w-[8rem]" },
] as const;

export const SiniestrosGeneralApp = ({ onNavigate, onLogout }: SiniestrosGeneralAppProps) => {
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [query, setQuery] = useState("");
  const [seleccionado, setSeleccionado] = useState<Siniestro | null>(null);
  const [formData, setFormData] = useState<Siniestro>(siniestroVacio);
  const [modo, setModo] = useState<ModoSiniestroFicha>("vista");
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  const ordenados = useMemo(
    () => [...siniestros].sort(compararSiniestrosGeneralPorRecepcion),
    [siniestros]
  );

  const mostrandoFormulario = modo === "nuevo" || seleccionado !== null;

  const volverAlListado = () => {
    setSeleccionado(null);
    setFormData(siniestroVacio);
    setModo("vista");
    setConfirmarBorrado(false);
  };

  const buscar = async (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      toast.error("Introduce un nº de siniestro, Crawford, asegurado, dirección o población para buscar");
      return;
    }

    setLoadingBusqueda(true);
    try {
      const data = await buscarSiniestros(q);
      setSiniestros(data);
      setMostrarResultados(true);
      if (data.length === 0) toast.error("No se han encontrado siniestros");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron buscar los siniestros");
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const repetirBusqueda = async () => {
    const q = query.trim();
    if (!q || !mostrarResultados) return;
    try {
      const data = await buscarSiniestros(q);
      setSiniestros(data);
    } catch {
      // Mantener el listado actual si falla el refresco.
    }
  };

  const abrirSiniestro = async (siniestro: Siniestro) => {
    setCargandoDetalle(true);
    try {
      const detalle = await obtenerDetalleSiniestro(siniestro);
      setSeleccionado(detalle);
      setFormData({ ...siniestroVacio, ...detalle });
      setModo("vista");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar el siniestro");
    } finally {
      setCargandoDetalle(false);
    }
  };

  const nuevoSiniestro = () => {
    setSeleccionado(null);
    setFormData({ ...siniestroVacio });
    setModo("nuevo");
  };

  const editarSiniestro = () => {
    if (!seleccionado) return;
    setFormData({ ...siniestroVacio, ...seleccionado });
    setModo("edicion");
  };

  const cancelarEdicion = () => {
    if (modo === "nuevo") {
      volverAlListado();
      return;
    }
    setModo("vista");
    setFormData(seleccionado ? { ...siniestroVacio, ...seleccionado } : siniestroVacio);
  };

  const actualizarCampo = (campo: keyof Siniestro, valor: string) => {
    setFormData((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardarSiniestro = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!textoCampo(formData.numero)) {
      toast.error("El número de siniestro es obligatorio");
      return;
    }

    setGuardando(true);
    try {
      const guardado =
        modo === "nuevo" ? await crearSiniestro(formData) : await actualizarSiniestro(formData);
      setSeleccionado(guardado);
      setFormData({ ...siniestroVacio, ...guardado });
      setModo("vista");
      await repetirBusqueda();
      toast.success(modo === "nuevo" ? "Siniestro creado" : "Siniestro actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el siniestro");
    } finally {
      setGuardando(false);
    }
  };

  const borrarSiniestroHandler = () => {
    if (!seleccionado) return;
    setConfirmarBorrado(true);
  };

  const confirmarBorradoSiniestro = async () => {
    if (!seleccionado) return;
    setConfirmarBorrado(false);
    setGuardando(true);
    try {
      await borrarSiniestro(seleccionado);
      toast.success("Siniestro borrado");
      volverAlListado();
      await repetirBusqueda();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo borrar el siniestro");
    } finally {
      setGuardando(false);
    }
  };

  if (mostrandoFormulario) {
    const titulo =
      modo === "nuevo" ? "Nuevo siniestro" : modo === "edicion" ? "Editar siniestro" : "Detalle del siniestro";

    return (
      <div className="min-h-screen gradient-surface text-foreground">
        <AppHeader active="siniestros" onNavigate={onNavigate} onLogout={onLogout} />
        <main className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" onClick={volverAlListado} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al listado
            </Button>
            <div className="flex flex-wrap gap-2">
              {modo === "vista" ? (
                <>
                  <Button variant="outline" onClick={editarSiniestro} disabled={!seleccionado} className="rounded-xl">
                    <Edit3 className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={borrarSiniestroHandler}
                    disabled={!seleccionado}
                    className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Borrar
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={cancelarEdicion} className="rounded-xl">
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button type="submit" form="form-siniestro" disabled={guardando} className="rounded-xl">
                    {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar
                  </Button>
                </>
              )}
            </div>
          </div>

          {modo !== "vista" ? (
            <form id="form-siniestro" onSubmit={guardarSiniestro}>
              <p className="mb-4 text-sm text-muted-foreground">{titulo}</p>
              <SiniestroFichaSection siniestro={formData} modo={modo} onChange={actualizarCampo} />
            </form>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{titulo}</p>
              <SiniestroFichaSection siniestro={seleccionado ?? formData} modo="vista" />
            </>
          )}
        </main>

        {cargandoDetalle ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : null}

        {confirmarBorrado && seleccionado ? (
          <ConfirmDeleteDialog
            siniestro={seleccionado}
            onCancel={() => setConfirmarBorrado(false)}
            onConfirm={confirmarBorradoSiniestro}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-surface text-foreground">
      <AppHeader active="siniestros" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="mx-auto max-w-[1600px] px-6 py-8 lg:px-8">
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <Button variant="outline" onClick={() => onNavigate("menu")} className="mb-4 rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al menú
              </Button>
              <h1 className="text-2xl font-bold">Siniestros</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Busca un siniestro concreto o crea un nuevo expediente.
              </p>
            </div>
            <Button onClick={nuevoSiniestro} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </div>

          <form onSubmit={buscar} className="mt-5 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nº, Crawford, asegurado, dirección, población..."
                className="h-12 rounded-2xl border-border/60 bg-background pl-10"
              />
            </div>
            <Button type="submit" disabled={loadingBusqueda} className="h-12 rounded-2xl px-6">
              {loadingBusqueda ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buscar"}
            </Button>
          </form>
        </section>

        <section className="mt-6 rounded-3xl border border-border/60 bg-card shadow-soft">
          {!mostrarResultados ? (
            <div className="flex min-h-[520px] items-center justify-center p-8 text-center text-muted-foreground">
              <div>
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-40" />
                <p>Busca un siniestro o crea un nuevo expediente.</p>
              </div>
            </div>
          ) : loadingBusqueda ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          ) : ordenados.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>No se han encontrado siniestros</p>
            </div>
          ) : (
            <>
              <div className="border-b border-border/60 px-5 py-4">
                <p className="text-sm font-semibold">Resultados de búsqueda</p>
                <p className="text-xs text-muted-foreground">{ordenados.length} coincidencias</p>
              </div>
              <Table className="min-w-[960px] table-fixed">
                <colgroup>
                  <col className="w-[7rem]" />
                  <col className="w-[7rem]" />
                  <col className="w-[5.5rem]" />
                  <col className="w-[7rem]" />
                  <col className="w-[5rem]" />
                  <col className="w-[14rem]" />
                  <col className="w-[5rem]" />
                  <col className="w-[8rem]" />
                  <col className="w-[8rem]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {COLUMNAS.map((columna) => (
                      <TableHead key={columna.key} className={columna.className}>
                        <span className="text-xs font-semibold">{columna.label}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenados.map((siniestro) => (
                    <TableRow
                      key={siniestro.recordId ?? siniestro.id}
                      className="cursor-pointer"
                      onClick={() => abrirSiniestro(siniestro)}
                    >
                      <TableCell className="font-semibold text-accent">{siniestro.numero || "-"}</TableCell>
                      <TableCell>{textoCampo(siniestro.numeroSiniestro2) || "-"}</TableCell>
                      <TableCell>{textoCampo(siniestro.crawfordSini) || "-"}</TableCell>
                      <TableCell>{fechaRecepcionDisplaySiniestro(siniestro) || "-"}</TableCell>
                      <TableCell>{horaRecepcionDisplaySiniestro(siniestro) || "-"}</TableCell>
                    <TableCell
                      className="max-w-[14rem] truncate"
                      title={direccionVistaDisplaySiniestro(siniestro)}
                    >
                      {direccionVistaDisplaySiniestro(siniestro) || "-"}
                    </TableCell>
                      <TableCell>{codPostalDisplaySiniestro(siniestro) || "-"}</TableCell>
                      <TableCell>{poblacionDisplaySiniestro(siniestro) || "-"}</TableCell>
                      <TableCell>{provinciaDisplaySiniestro(siniestro) || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </section>
      </main>

      {cargandoDetalle ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : null}
    </div>
  );
};

type ConfirmDeleteDialogProps = {
  siniestro: Siniestro;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmDeleteDialog = ({ siniestro, onCancel, onConfirm }: ConfirmDeleteDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
    <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 shadow-strong">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Confirmar borrado</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Se va a borrar el siniestro{" "}
            <strong className="text-foreground">{siniestro.numero || "seleccionado"}</strong>. Esta acción no se
            puede deshacer.
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm} className="rounded-xl">
          Borrar
        </Button>
      </div>
    </div>
  </div>
);
