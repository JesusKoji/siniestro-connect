import { ReactNode, useEffect, useMemo, useState } from "react";
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
  FileText,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

export const AseguradosApp = () => {
  const [asegurados, setAsegurados] = useState<Asegurado[]>([]);
  const [seleccionado, setSeleccionado] = useState<Asegurado | null>(null);
  const [contactos, setContactos] = useState<ContactoAsegurado[]>([]);
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [query, setQuery] = useState("");
  const [loadingLista, setLoadingLista] = useState(false);
  const [loadingRelaciones, setLoadingRelaciones] = useState(false);

  useEffect(() => {
    cargarAsegurados("");
  }, []);

  useEffect(() => {
    setContactos([]);
    setPolizas([]);
    setSiniestros([]);

    if (!seleccionado?.id) return;

    setLoadingRelaciones(true);
    Promise.all([
      obtenerContactosAsegurado(seleccionado.id),
      obtenerPolizasAsegurado(seleccionado.id),
      obtenerSiniestrosAsegurado(seleccionado.id),
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
  }, [seleccionado]);

  const cargarAsegurados = (texto: string) => {
    setLoadingLista(true);
    buscarAsegurados(texto)
      .then((data) => {
        setAsegurados(data);
        setSeleccionado((actual) => actual ?? data[0] ?? null);
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : "No se pudieron cargar los asegurados";
        toast.error(msg);
      })
      .finally(() => setLoadingLista(false));
  };

  const buscar = (event: React.FormEvent) => {
    event.preventDefault();
    cargarAsegurados(query);
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
    <main className="mx-auto grid max-w-7xl gap-6 px-8 py-8 lg:grid-cols-[380px_1fr]">
      <section className="rounded-3xl border border-border/60 bg-card shadow-soft">
        <div className="border-b border-border/60 p-5">
          <h1 className="text-2xl font-bold">Asegurados</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loadingLista ? "Buscando asegurados..." : `${asegurados.length} registros`}
          </p>
          <form onSubmit={buscar} className="relative mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por NIF, nombre, razón social..."
                className="h-12 rounded-2xl border-border/60 bg-background pl-10"
              />
            </div>
            <Button type="submit" className="h-12 rounded-2xl px-5">
              Buscar
            </Button>
          </form>
        </div>

        <div className="max-h-[calc(100vh-235px)] overflow-y-auto p-3">
          {loadingLista ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : asegurados.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <UserRound className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">No se han encontrado asegurados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {asegurados.map((a) => {
                const activo = seleccionado?.id === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSeleccionado(a)}
                    className={`w-full rounded-2xl border p-4 text-left transition-smooth ${
                      activo
                        ? "border-accent/60 bg-accent/10 shadow-sm"
                        : "border-transparent hover:border-border/70 hover:bg-secondary/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold">{a.displayName || "Sin nombre"}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{a.nif}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {a.direccionCompleta || [a.direccion, a.poblacion, a.provincia].filter(Boolean).join(" · ")}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="min-h-[640px] rounded-3xl border border-border/60 bg-card shadow-soft">
        {seleccionado ? (
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
          <div className="flex h-full min-h-[640px] items-center justify-center p-8 text-center text-muted-foreground">
            <div>
              <Building2 className="mx-auto mb-4 h-12 w-12 opacity-40" />
              <p>Selecciona un asegurado para ver su ficha.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

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
