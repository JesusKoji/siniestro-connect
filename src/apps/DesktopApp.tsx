import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Siniestro } from "@/data/siniestros";
import { cerrarSesion, ejecutarScriptEnviarEnlace, listarSiniestrosEnCurso } from "@/lib/filemaker";
import {
  Building2,
  Calendar,
  FileText,
  Loader2,
  LogOut,
  MapPin,
  Search,
  Send,
  Tag,
  User,
} from "lucide-react";
import { toast } from "sonner";

export const DesktopApp = () => {
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [seleccionado, setSeleccionado] = useState<Siniestro | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarSiniestrosEnCurso()
      .then((data) => {
        setSiniestros(data);
        setSeleccionado(data[0] ?? null);
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : "No se pudieron cargar los siniestros";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return siniestros;
    return siniestros.filter((s) =>
      [s.numero, s.compania, s.asegurado, s.direccion, s.tipo]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [siniestros, query]);

  const enviarEnlace = async () => {
    if (!seleccionado) return;
    setEnviando(true);
    try {
      await ejecutarScriptEnviarEnlace(seleccionado.numero);
      toast.success("Enlace enviado correctamente");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al enviar el enlace";
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  const logout = () => {
    cerrarSesion();
    setSiniestros([]);
    setSeleccionado(null);
  };

  return (
    <div className="min-h-screen gradient-surface text-foreground">
      <header className="border-b border-border/60 bg-card/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold">Panel de gestión</p>
              <p className="text-xs text-muted-foreground">Siniestros en curso</p>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="rounded-xl border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-8 py-8 lg:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-border/60 bg-card shadow-soft">
          <div className="border-b border-border/60 p-5">
            <h1 className="text-2xl font-bold">Siniestros en curso</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Cargando expedientes..." : `${filtrados.length} expedientes disponibles`}
            </p>
            <div className="relative mt-4">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nº, compañía, asegurado..."
                className="h-12 rounded-2xl border-border/60 bg-background pl-10"
              />
            </div>
          </div>

          <div className="max-h-[calc(100vh-235px)] overflow-y-auto p-3">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">No se han encontrado siniestros</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtrados.map((s) => {
                  const activo = seleccionado?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSeleccionado(s)}
                      className={`w-full rounded-2xl border p-4 text-left transition-smooth ${
                        activo
                          ? "border-accent/60 bg-accent/10 shadow-sm"
                          : "border-transparent hover:border-border/70 hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold tracking-wide text-accent">{s.numero}</span>
                        <span className="truncate text-xs text-muted-foreground">{s.compania}</span>
                      </div>
                      <p className="mt-1 truncate font-semibold">{s.asegurado}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{s.direccion}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="min-h-[640px] rounded-3xl border border-border/60 bg-card shadow-soft">
          {seleccionado ? (
            <div className="flex h-full flex-col">
              <div className="gradient-hero rounded-t-3xl p-8 text-primary-foreground">
                <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Expediente</p>
                <div className="mt-2 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                  <div>
                    <h2 className="text-4xl font-bold">{seleccionado.numero}</h2>
                    <p className="mt-1 text-primary-foreground/80">{seleccionado.compania}</p>
                  </div>
                  <Button
                    onClick={enviarEnlace}
                    disabled={enviando}
                    className="h-12 rounded-xl bg-white/95 px-6 font-semibold text-primary hover:bg-white"
                  >
                    {enviando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar enlace
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 p-6 xl:grid-cols-2">
                <DetailCard icon={User} label="Asegurado" value={seleccionado.asegurado} />
                <DetailCard icon={Building2} label="Compañía" value={seleccionado.compania} />
                <DetailCard icon={MapPin} label="Dirección" value={seleccionado.direccion} />
                <DetailCard icon={Tag} label="Tipo" value={seleccionado.tipo} />
                <DetailCard
                  icon={Calendar}
                  label="Fecha apertura"
                  value={new Date(seleccionado.fechaApertura).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </div>

              <div className="mx-6 mb-6 rounded-3xl border border-dashed border-border/80 bg-secondary/40 p-6">
                <h3 className="font-semibold">Próximos módulos</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Aquí añadiremos documentos, fotos, correos, informes, alertas y recordatorios del expediente.
                  Esta primera versión mantiene la función crítica de enviar enlaces y añade una base de escritorio segura.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[640px] items-center justify-center p-8 text-center text-muted-foreground">
              <div>
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-40" />
                <p>Selecciona un siniestro para ver el detalle.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

type DetailCardProps = {
  icon: typeof User;
  label: string;
  value: string;
};

const DetailCard = ({ icon: Icon, label, value }: DetailCardProps) => (
  <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 break-words font-semibold leading-snug">{value}</p>
      </div>
    </div>
  </div>
);
