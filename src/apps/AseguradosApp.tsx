import { ReactNode, useMemo, useState } from "react";
import { AseguradoCard } from "@/components/AseguradoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Asegurado, ContactoAsegurado, Poliza, Siniestro } from "@/data/siniestros";
import {
  buscarAsegurados,
  obtenerContactosAsegurado,
  obtenerPolizasAsegurado,
  obtenerSiniestrosAsegurado,
} from "@/lib/filemaker";
import {
  Building2,
  Edit3,
  FileText,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

type ModoFormulario = "vista" | "nuevo" | "edicion";

export const AseguradosApp = () => {
  const [resultados, setResultados] = useState<Asegurado[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Asegurado | null>(null);
  const [contactos, setContactos] = useState<ContactoAsegurado[]>([]);
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [query, setQuery] = useState("");
  const [modo, setModo] = useState<ModoFormulario>("vista");
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [loadingRelaciones, setLoadingRelaciones] = useState(false);

  const cargarRelaciones = (asegurado: Asegurado) => {
    setContactos([]);
    setPolizas([]);
    setSiniestros([]);

    if (!asegurado.id) return;

    setLoadingRelaciones(true);
    Promise.all([
      obtenerContactosAsegurado(asegurado.id),
      obtenerPolizasAsegurado(asegurado.id),
      obtenerSiniestrosAsegurado(asegurado.id),
    ])
      .then(([contactosData, polizasData, siniestrosData]) => {
        setContactos(contactosData);
        setPolizas(polizasData);
        setSiniestros(siniestrosData);
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : "No se pudieron cargar los datos relacionados";
        toast.error(msg);
      })
      .finally(() => setLoadingRelaciones(false));
  };

  const buscar = (event: React.FormEvent) => {
    event.preventDefault();

    if (!query.trim()) {
      toast.error("Introduce un NIF, nombre, razón social o dirección para buscar");
      return;
    }

    setLoadingBusqueda(true);
    buscarAsegurados(query)
      .then((data) => {
        setResultados(data);
        setMostrarResultados(true);
        if (data.length === 1) {
          seleccionarAsegurado(data[0]);
        } else if (data.length === 0) {
          toast.error("No se han encontrado asegurados");
        }
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : "No se pudieron cargar los asegurados";
        toast.error(msg);
      })
      .finally(() => setLoadingBusqueda(false));
  };

  const seleccionarAsegurado = (asegurado: Asegurado) => {
    setSeleccionado(asegurado);
    setModo("vista");
    setMostrarResultados(false);
    cargarRelaciones(asegurado);
  };

  const nuevoAsegurado = () => {
    setSeleccionado(null);
    setContactos([]);
    setPolizas([]);
    setSiniestros([]);
    setResultados([]);
    setMostrarResultados(false);
    setModo("nuevo");
    toast.info("Formulario de alta preparado. En el siguiente paso conectaremos el guardado con FileMaker.");
  };

  const editarAsegurado = () => {
    if (!seleccionado) return;
    setModo("edicion");
    toast.info("Edición preparada. En el siguiente paso conectaremos la actualización con FileMaker.");
  };

  const borrarAsegurado = () => {
    if (!seleccionado) return;
    toast.error("Borrado pendiente de conectar con FileMaker. Antes añadiremos confirmación y validaciones por relaciones existentes.");
  };

  const resumen = useMemo(
    () => [
      { label: "Contactos", value: contactos.length },
      { label: "Pólizas", value: polizas.length },
      { label: "Siniestros", value: siniestros.length },
    ],
    [contactos.length, polizas.length, siniestros.length]
  );

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">
      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ficha de asegurado</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Busca un asegurado concreto o crea una nueva ficha.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={nuevoAsegurado} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
            <Button variant="outline" onClick={editarAsegurado} disabled={!seleccionado} className="rounded-xl">
              <Edit3 className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={borrarAsegurado}
              disabled={!seleccionado}
              className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Borrar
            </Button>
          </div>
        </div>

        <form onSubmit={buscar} className="mt-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por NIF, nombre, razón social, población o dirección..."
              className="h-12 rounded-2xl border-border/60 bg-background pl-10"
            />
          </div>
          <Button type="submit" disabled={loadingBusqueda} className="h-12 rounded-2xl px-6">
            {loadingBusqueda ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buscar"}
          </Button>
        </form>

        {mostrarResultados ? (
          <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Resultados de búsqueda</p>
              <p className="text-xs text-muted-foreground">{resultados.length} coincidencias</p>
            </div>
            {resultados.length === 0 ? (
              <p className="text-sm text-muted-foreground">No se han encontrado asegurados.</p>
            ) : (
              <div className="grid gap-2 xl:grid-cols-2">
                {resultados.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => seleccionarAsegurado(a)}
                    className="rounded-xl border border-border/60 bg-card p-3 text-left transition-smooth hover:border-accent/60 hover:bg-accent/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold">{a.displayName || "Sin nombre"}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{a.nif || "Sin NIF"}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {a.direccionCompleta || [a.direccion, a.poblacion, a.provincia].filter(Boolean).join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-3xl border border-border/60 bg-card shadow-soft">
        {modo === "nuevo" ? (
          <EditorPlaceholder title="Nuevo asegurado" />
        ) : modo === "edicion" && seleccionado ? (
          <EditorPlaceholder title="Editar asegurado" asegurado={seleccionado} />
        ) : seleccionado ? (
          <div className="space-y-4 p-6">
            <AseguradoCard asegurado={seleccionado} />

            <div className="grid gap-3 md:grid-cols-3">
              {resumen.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold">{loadingRelaciones ? "..." : item.value}</p>
                </div>
              ))}
            </div>

            <RelatedSection title="Contactos relacionados" icon={UserRound} loading={loadingRelaciones} empty="Sin contactos relacionados" isEmpty={contactos.length === 0}>
              <div className="grid gap-3 xl:grid-cols-2">
                {contactos.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="font-semibold">{c.nombreCompleto || c.nombre || "Sin nombre"}</p>
                    {c.cargo ? <p className="text-xs text-muted-foreground">{c.cargo}</p> : null}
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {c.movil ? <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{c.movil}</p> : null}
                      {c.telefono ? <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{c.telefono}</p> : null}
                      {c.mail ? <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{c.mail}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </RelatedSection>

            <RelatedSection title="Pólizas relacionadas" icon={ShieldCheck} loading={loadingRelaciones} empty="Sin pólizas relacionadas" isEmpty={polizas.length === 0}>
              <div className="space-y-3">
                {polizas.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold">{p.numeroPoliza || "Sin número de póliza"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{p.direccionCompleta || [p.poblacion, p.provincia].filter(Boolean).join(" · ")}</p>
                      </div>
                      {p.agente ? <span className="text-xs text-muted-foreground">Agente: {p.agente}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </RelatedSection>

            <RelatedSection title="Siniestros relacionados" icon={FileText} loading={loadingRelaciones} empty="Sin siniestros relacionados" isEmpty={siniestros.length === 0}>
              <div className="space-y-3">
                {siniestros.map((s) => (
                  <div key={s.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold">{s.numero || "Sin número"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{s.tipo || "Sin tipo"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{s.direccion}</p>
                      </div>
                      {s.compania ? <span className="text-xs text-muted-foreground">{s.compania}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </RelatedSection>
          </div>
        ) : (
          <div className="flex min-h-[520px] items-center justify-center p-8 text-center text-muted-foreground">
            <div>
              <Building2 className="mx-auto mb-4 h-12 w-12 opacity-40" />
              <p>Busca un asegurado o crea una nueva ficha.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

type EditorPlaceholderProps = {
  title: string;
  asegurado?: Asegurado;
};

const EditorPlaceholder = ({ title, asegurado }: EditorPlaceholderProps) => (
  <div className="space-y-4 p-6">
    <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/40 p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Este formulario será editable en el siguiente paso. Antes de activar guardar/borrar conviene mapear los campos obligatorios y las validaciones de FileMaker.
      </p>
    </div>
    {asegurado ? <AseguradoCard asegurado={asegurado} /> : null}
  </div>
);

type RelatedSectionProps = {
  title: string;
  icon: typeof UserRound;
  loading: boolean;
  empty: string;
  isEmpty: boolean;
  children: ReactNode;
};

const RelatedSection = ({ title, icon: Icon, loading, empty, isEmpty, children }: RelatedSectionProps) => (
  <section className="rounded-3xl border border-border/60 bg-card p-5">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
      </div>
    </div>
    {loading ? (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando...
      </div>
    ) : isEmpty ? (
      <p className="text-sm text-muted-foreground">{empty}</p>
    ) : (
      children
    )}
  </section>
);
