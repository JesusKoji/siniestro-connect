import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Asegurado, Poliza, Siniestro } from "@/data/siniestros";
import { buscarAsegurados, obtenerPolizasAsegurado, obtenerSiniestrosAsegurado } from "@/lib/filemaker";
import { Building2, Edit3, FileText, Loader2, Plus, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const PolizasApp = () => {
  const [query, setQuery] = useState("");
  const [asegurados, setAsegurados] = useState<Asegurado[]>([]);
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [seleccionada, setSeleccionada] = useState<Poliza | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRamo, setShowRamo] = useState(false);

  const buscar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return toast.error("Introduce número de póliza, asegurado, compañía o ramo");
    setLoading(true);
    try {
      const aseg = await buscarAsegurados(query);
      const listas = await Promise.all(aseg.map((a) => obtenerPolizasAsegurado(a.id)));
      const todas = listas.flat();
      const q = query.toLowerCase();
      const filtradas = todas.filter((p) => [p.numeroPoliza, p.asegurado, p.compania, p.ramo, p.tipoRamo, p.direccionCompleta].join(" ").toLowerCase().includes(q));
      const visibles = filtradas.length ? filtradas : todas;
      setAsegurados(aseg);
      setPolizas(visibles);
      setSeleccionada(visibles[0] ?? null);
      if (visibles[0]?.idAsegurado) setSiniestros(await obtenerSiniestrosAsegurado(visibles[0].idAsegurado));
      if (!visibles.length) toast.error("No se han encontrado pólizas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron buscar pólizas");
    } finally {
      setLoading(false);
    }
  };

  const seleccionar = async (p: Poliza) => {
    setSeleccionada(p);
    if (p.idAsegurado) setSiniestros(await obtenerSiniestrosAsegurado(p.idAsegurado).catch(() => []));
  };

  const aseguradoNombre = (p?: Poliza | null) => p?.asegurado || asegurados.find((a) => a.id === p?.idAsegurado)?.displayName || "";
  const siniestrosPoliza = siniestros.filter((s) => !seleccionada?.id || s.idPoliza === seleccionada.id);

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">
      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div><h1 className="text-2xl font-bold">Ficha de póliza</h1><p className="mt-1 text-sm text-muted-foreground">Busca una póliza y consulta sus datos principales.</p></div>
          <div className="flex flex-wrap gap-2"><Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Nuevo</Button><Button variant="outline" disabled={!seleccionada} className="rounded-xl"><Edit3 className="mr-2 h-4 w-4" />Editar</Button><Button variant="outline" disabled={!seleccionada} className="rounded-xl border-destructive/30 text-destructive"><Trash2 className="mr-2 h-4 w-4" />Borrar</Button></div>
        </div>
        <form onSubmit={buscar} className="mt-5 flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por asegurado, nº póliza, compañía o ramo..." className="h-12 rounded-2xl border-border/60 bg-background pl-10" /></div><Button type="submit" disabled={loading} className="h-12 rounded-2xl px-6">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buscar"}</Button></form>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-border/60 bg-card shadow-soft"><div className="border-b border-border/60 p-4"><h2 className="font-semibold">Pólizas encontradas</h2><p className="mt-1 text-xs text-muted-foreground">{loading ? "Cargando..." : `${polizas.length} registros`}</p></div><div className="max-h-[calc(100vh-330px)] overflow-y-auto p-3">{polizas.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Busca una póliza para comenzar.</p> : polizas.map((p) => <button key={p.id} onClick={() => seleccionar(p)} className={`mb-2 w-full rounded-2xl border p-4 text-left transition-smooth ${seleccionada?.id === p.id ? "border-accent/60 bg-accent/10" : "border-transparent hover:border-border/70 hover:bg-secondary/60"}`}><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold tracking-wide text-accent">{p.numeroPoliza || "Sin nº"}</span><span className="truncate text-xs text-muted-foreground">{p.compania || "Sin compañía"}</span></div><p className="mt-1 truncate font-semibold">{aseguradoNombre(p) || "Sin asegurado"}</p><p className="mt-1 truncate text-xs text-muted-foreground">{p.ramo || "Sin ramo"}</p></button>)}</div></section>

        <section className="min-h-[620px] rounded-3xl border border-border/60 bg-card shadow-soft">{seleccionada ? <div className="space-y-5 p-6"><div className="gradient-hero rounded-3xl p-6 text-primary-foreground"><p className="text-xs uppercase tracking-widest text-primary-foreground/70">Póliza</p><h2 className="mt-2 text-3xl font-bold">{seleccionada.numeroPoliza || "Sin número"}</h2><p className="mt-1 text-primary-foreground/80">{aseguradoNombre(seleccionada) || "Sin asegurado"}</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Info label="Asegurado" value={aseguradoNombre(seleccionada)} /><Info label="Nº póliza" value={seleccionada.numeroPoliza} /><div className="rounded-2xl border border-border/60 bg-background/70 p-4"><div className="flex items-start justify-between gap-2"><InfoText label="Compañía" value={seleccionada.compania} /><Button type="button" size="sm" variant="outline" onClick={() => setShowRamo(true)} className="rounded-xl">Ramo +</Button></div></div><Info label="Ramo" value={[seleccionada.ramo, seleccionada.tipoRamo].filter(Boolean).join(" · ")} /></div><section className="rounded-3xl border border-border/60 bg-background/70 p-5"><h3 className="font-semibold">Datos iniciales</h3><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"><InfoText label="Dirección" value={seleccionada.direccionCompleta || [seleccionada.via, seleccionada.direccion, seleccionada.numeroCalle, seleccionada.codigoPostal, seleccionada.poblacion, seleccionada.provincia].filter(Boolean).join(" ")} /><InfoText label="Agente" value={seleccionada.agente} /><InfoText label="Teléfono agente" value={seleccionada.telefonoAgente} /><InfoText label="Email agente" value={seleccionada.emailAgente} /><InfoText label="Descripción del riesgo" value={seleccionada.descripcion} /><InfoText label="Información" value={seleccionada.informacion} /><InfoText label="Comentarios" value={seleccionada.comentarios} /></div></section><section className="rounded-3xl border border-border/60 bg-background/70 p-5"><h3 className="font-semibold">Siniestros relacionados</h3><p className="mt-1 text-xs text-muted-foreground">{siniestrosPoliza.length} registros</p><div className="mt-3 space-y-2">{siniestrosPoliza.length === 0 ? <p className="text-sm text-muted-foreground">Sin siniestros relacionados.</p> : siniestrosPoliza.map((s) => <div key={s.id} className="rounded-2xl border border-border/60 bg-card p-3"><div className="grid gap-2 md:grid-cols-[130px_1fr_150px_120px]"><InfoText label="Siniestro" value={s.numero} /><InfoText label="Tipo" value={s.tipo} /><InfoText label="Valoración" value={s.valoracionTotal} /><InfoText label="Cierre" value={s.fechaCierre} /></div><p className="mt-2 truncate text-xs text-muted-foreground">{s.direccion}</p></div>)}</div></section></div> : <div className="flex min-h-[620px] items-center justify-center p-8 text-center text-muted-foreground"><div><FileText className="mx-auto mb-4 h-12 w-12 opacity-40" /><p>Busca y selecciona una póliza.</p></div></div>}</section>
      </div>

      {showRamo ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><div className="w-full max-w-xl rounded-3xl border border-border/60 bg-card p-6 shadow-strong"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">Crear ramo</h2><p className="mt-1 text-sm text-muted-foreground">Ventana preparada para compañía, ramo y tipo de ramo.</p></div><Button type="button" variant="ghost" onClick={() => setShowRamo(false)} className="rounded-xl"><X className="h-5 w-5" /></Button></div><div className="mt-5 grid gap-4"><div className="space-y-2"><Label>Compañía</Label><select className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option>{seleccionada?.compania || "Selecciona compañía"}</option></select></div><Field label="Ramo" /><Field label="Tipo de ramo" /></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowRamo(false)} className="rounded-xl">Cancelar</Button><Button type="button" onClick={() => toast.info("Pendiente conectar guardado contra API_Ramos")} className="rounded-xl">Crear ramo</Button></div></div></div> : null}
    </main>
  );
};

const Info = ({ label, value }: { label: string; value?: string }) => <div className="rounded-2xl border border-border/60 bg-background/70 p-4"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Building2 className="h-5 w-5 text-muted-foreground" /></div><InfoText label={label} value={value} /></div></div>;
const InfoText = ({ label, value }: { label: string; value?: string }) => <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold leading-snug">{value || "-"}</p></div>;
const Field = ({ label }: { label: string }) => <div className="space-y-2"><Label>{label}</Label><Input className="h-11 rounded-xl" /></div>;
