import { ReactNode, useEffect, useMemo, useState } from "react";
import { AseguradoCard } from "@/components/AseguradoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Asegurado, ContactoAsegurado, Poliza, Siniestro } from "@/data/siniestros";
import { DireccionNormalizada, normalizarDireccion } from "@/lib/geocode";
import {
  actualizarAsegurado,
  buscarAsegurados,
  crearAsegurado,
  obtenerContactosAsegurado,
  obtenerPolizasAsegurado,
  obtenerSiniestrosAsegurado,
} from "@/lib/filemaker";
import {
  AlertTriangle,
  Building2,
  Edit3,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

type ModoFormulario = "vista" | "nuevo" | "edicion";

const aseguradoVacio: Asegurado = {
  id: "",
  nif: "",
  tipoPersona: "Persona física",
  nombre: "",
  apellido1: "",
  apellido2: "",
  nombreCompleto: "",
  razonSocial: "",
  displayName: "",
  via: "",
  direccion: "",
  numeroCalle: "",
  bloque: "",
  escalera: "",
  planta: "",
  puerta: "",
  codigoPostal: "",
  poblacion: "",
  provincia: "",
  pais: "España",
  direccionCompleta: "",
  email: "",
  telefono: "",
};

export const AseguradosApp = () => {
  const [resultados, setResultados] = useState<Asegurado[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Asegurado | null>(null);
  const [formData, setFormData] = useState<Asegurado>(aseguradoVacio);
  const [contactos, setContactos] = useState<ContactoAsegurado[]>([]);
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [query, setQuery] = useState("");
  const [modo, setModo] = useState<ModoFormulario>("vista");
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [loadingRelaciones, setLoadingRelaciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

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
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar los datos relacionados"))
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
        if (data.length === 1) seleccionarAsegurado(data[0]);
        if (data.length === 0) toast.error("No se han encontrado asegurados");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar los asegurados"))
      .finally(() => setLoadingBusqueda(false));
  };

  const seleccionarAsegurado = (asegurado: Asegurado) => {
    setSeleccionado(asegurado);
    setFormData({ ...aseguradoVacio, ...asegurado });
    setModo("vista");
    setMostrarResultados(false);
    cargarRelaciones(asegurado);
  };

  const nuevoAsegurado = () => {
    setSeleccionado(null);
    setFormData({ ...aseguradoVacio, id: `Asegurado_${Date.now()}` });
    setContactos([]);
    setPolizas([]);
    setSiniestros([]);
    setResultados([]);
    setMostrarResultados(false);
    setModo("nuevo");
  };

  const editarAsegurado = () => {
    if (!seleccionado) return;
    setFormData({ ...aseguradoVacio, ...seleccionado });
    setModo("edicion");
  };

  const cancelarEdicion = () => {
    setModo("vista");
    setFormData(seleccionado ? { ...aseguradoVacio, ...seleccionado } : aseguradoVacio);
  };

  const actualizarCampo = (campo: keyof Asegurado, valor: string) => {
    setFormData((actual) => ({ ...actual, [campo]: valor }));
  };

  const aplicarDireccionNormalizada = (data: Partial<Asegurado>) => {
    setFormData((actual) => ({ ...actual, ...data }));
  };

  const guardarAsegurado = async (event: React.FormEvent) => {
    event.preventDefault();
    const esJuridica = formData.tipoPersona.toLowerCase().includes("jur");
    if (!formData.nif.trim()) return toast.error("El CIF/NIF es obligatorio");
    if (esJuridica && !formData.razonSocial.trim()) return toast.error("La razón social es obligatoria");
    if (!esJuridica && !formData.nombre.trim()) return toast.error("El nombre es obligatorio");

    setGuardando(true);
    try {
      const guardado = modo === "nuevo" ? await crearAsegurado(formData) : await actualizarAsegurado(formData);
      setSeleccionado(guardado);
      setFormData({ ...aseguradoVacio, ...guardado });
      setModo("vista");
      cargarRelaciones(guardado);
      toast.success(modo === "nuevo" ? "Asegurado creado" : "Asegurado actualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el asegurado");
    } finally {
      setGuardando(false);
    }
  };

  const borrarAsegurado = () => {
    if (!seleccionado) return;
    setConfirmarBorrado(true);
  };

  const confirmarBorradoAsegurado = () => {
    setConfirmarBorrado(false);
    toast.error("Borrado pendiente de conectar con FileMaker. Antes activaremos la comprobación de pólizas y siniestros relacionados.");
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
            <p className="mt-1 text-sm text-muted-foreground">Busca un asegurado concreto o crea una nueva ficha.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={nuevoAsegurado} className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
            <Button variant="outline" onClick={editarAsegurado} disabled={!seleccionado || modo !== "vista"} className="rounded-xl"><Edit3 className="mr-2 h-4 w-4" />Editar</Button>
            <Button variant="outline" onClick={borrarAsegurado} disabled={!seleccionado || modo !== "vista"} className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Borrar</Button>
          </div>
        </div>

        <form onSubmit={buscar} className="mt-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por NIF, nombre, razón social, población o dirección..." className="h-12 rounded-2xl border-border/60 bg-background pl-10" />
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
            {resultados.length === 0 ? <p className="text-sm text-muted-foreground">No se han encontrado asegurados.</p> : (
              <div className="grid gap-2 xl:grid-cols-2">
                {resultados.map((a) => (
                  <button key={a.id} onClick={() => seleccionarAsegurado(a)} className="rounded-xl border border-border/60 bg-card p-3 text-left transition-smooth hover:border-accent/60 hover:bg-accent/10">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold">{a.displayName || "Sin nombre"}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{a.nif || "Sin NIF"}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{a.direccionCompleta || [a.direccion, a.poblacion, a.provincia].filter(Boolean).join(" · ")}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-3xl border border-border/60 bg-card shadow-soft">
        {modo === "nuevo" || modo === "edicion" ? (
          <AseguradoEditor modo={modo} asegurado={formData} guardando={guardando} onChange={actualizarCampo} onSubmit={guardarAsegurado} onCancel={cancelarEdicion} onApplyNormalizedAddress={aplicarDireccionNormalizada} />
        ) : seleccionado ? (
          <div className="space-y-4 p-6">
            <AseguradoCard asegurado={seleccionado} />
            <div className="grid gap-3 md:grid-cols-3">
              {resumen.map((item) => <div key={item.label} className="rounded-2xl border border-border/60 bg-background/70 p-4"><p className="text-xs font-medium text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-bold">{loadingRelaciones ? "..." : item.value}</p></div>)}
            </div>
            <RelatedSection title="Contactos relacionados" icon={UserRound} loading={loadingRelaciones} empty="Sin contactos relacionados" isEmpty={contactos.length === 0}>
              <div className="grid gap-3 xl:grid-cols-2">{contactos.map((c) => <div key={c.id} className="rounded-2xl border border-border/60 bg-background/70 p-4"><p className="font-semibold">{c.nombreCompleto || c.nombre || "Sin nombre"}</p>{c.cargo ? <p className="text-xs text-muted-foreground">{c.cargo}</p> : null}<div className="mt-3 space-y-1 text-sm text-muted-foreground">{c.movil ? <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{c.movil}</p> : null}{c.telefono ? <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{c.telefono}</p> : null}{c.mail ? <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{c.mail}</p> : null}</div></div>)}</div>
            </RelatedSection>
            <RelatedSection title="Pólizas relacionadas" icon={ShieldCheck} loading={loadingRelaciones} empty="Sin pólizas relacionadas" isEmpty={polizas.length === 0}>
              <div className="space-y-3">{polizas.map((p) => <div key={p.id} className="rounded-2xl border border-border/60 bg-background/70 p-4"><p className="font-semibold">{p.numeroPoliza || "Sin número de póliza"}</p><p className="mt-1 text-sm text-muted-foreground">{p.direccionCompleta || [p.poblacion, p.provincia].filter(Boolean).join(" · ")}</p></div>)}</div>
            </RelatedSection>
            <RelatedSection title="Siniestros relacionados" icon={FileText} loading={loadingRelaciones} empty="Sin siniestros relacionados" isEmpty={siniestros.length === 0}>
              <div className="space-y-3">{siniestros.map((s) => <div key={s.id} className="rounded-2xl border border-border/60 bg-background/70 p-4"><p className="font-semibold">{s.numero || "Sin número"}</p><p className="mt-1 text-sm text-muted-foreground">{s.tipo || "Sin tipo"}</p><p className="mt-1 text-xs text-muted-foreground">{s.direccion}</p></div>)}</div>
            </RelatedSection>
          </div>
        ) : (
          <div className="flex min-h-[520px] items-center justify-center p-8 text-center text-muted-foreground"><div><Building2 className="mx-auto mb-4 h-12 w-12 opacity-40" /><p>Busca un asegurado o crea una nueva ficha.</p></div></div>
        )}
      </section>

      {confirmarBorrado && seleccionado ? <ConfirmDeleteDialog asegurado={seleccionado} onCancel={() => setConfirmarBorrado(false)} onConfirm={confirmarBorradoAsegurado} /> : null}
    </main>
  );
};

type AseguradoEditorProps = { modo: ModoFormulario; asegurado: Asegurado; guardando: boolean; onChange: (campo: keyof Asegurado, valor: string) => void; onSubmit: (event: React.FormEvent) => void; onCancel: () => void; onApplyNormalizedAddress: (data: Partial<Asegurado>) => void; };

const AseguradoEditor = ({ modo, asegurado, guardando, onChange, onSubmit, onCancel, onApplyNormalizedAddress }: AseguradoEditorProps) => {
  const esJuridica = asegurado.tipoPersona.toLowerCase().includes("jur");
  const [direccionLibre, setDireccionLibre] = useState(buildDireccionLibre(asegurado));
  const [normalizando, setNormalizando] = useState(false);
  const [candidatos, setCandidatos] = useState<DireccionNormalizada[]>([]);

  useEffect(() => {
    setDireccionLibre(buildDireccionLibre(asegurado));
    setCandidatos([]);
  }, [asegurado.id, asegurado.via, asegurado.direccion, asegurado.numeroCalle, asegurado.codigoPostal, asegurado.poblacion, asegurado.provincia]);

  const aplicarCandidato = (data: DireccionNormalizada) => {
    onApplyNormalizedAddress({
      via: data.via,
      direccion: data.direccion,
      numeroCalle: data.numeroCalle,
      bloque: data.bloque,
      escalera: data.escalera,
      planta: data.planta,
      puerta: data.puerta,
      codigoPostal: data.codigoPostal,
      poblacion: data.poblacion,
      provincia: data.provincia,
      pais: data.pais,
      direccionCompleta: data.direccionCompleta,
    });
    setDireccionLibre(data.direccionCompleta || data.googleFormattedAddress || buildDireccionLibre({ ...asegurado, ...data }));
    toast.success("Dirección aplicada");
  };

  const ejecutarNormalizacion = async () => {
    setNormalizando(true);
    try {
      const data = await normalizarDireccion(direccionLibre);
      const lista = data.candidates?.length ? data.candidates : [data];
      setCandidatos(lista);
      if (lista.length === 1) {
        aplicarCandidato(lista[0]);
      } else {
        toast.success(`${lista.length} direcciones encontradas. Elige la correcta.`);
      }
    } catch (error) {
      setCandidatos([]);
      toast.error(error instanceof Error ? error.message : "No se pudo normalizar la dirección");
    } finally {
      setNormalizando(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h2 className="text-xl font-bold">{modo === "nuevo" ? "Nuevo asegurado" : "Editar asegurado"}</h2><p className="mt-1 text-sm text-muted-foreground">Completa los datos principales de identificación, contacto y dirección.</p></div>
        <div className="flex gap-2"><Button type="button" variant="outline" onClick={onCancel} className="rounded-xl"><X className="mr-2 h-4 w-4" />Cancelar</Button><Button type="submit" disabled={guardando} className="rounded-xl">{guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Guardar</Button></div>
      </div>
      <div className="grid gap-4 rounded-3xl border border-border/60 bg-background/70 p-5 md:grid-cols-2 xl:grid-cols-3">
        <Field label="CIF / NIF" value={asegurado.nif} onChange={(v) => onChange("nif", v)} required />
        <div className="space-y-2"><Label>Tipo persona</Label><select value={asegurado.tipoPersona} onChange={(e) => onChange("tipoPersona", e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option>Persona física</option><option>Persona jurídica</option></select></div>
        <Field label="Teléfono" value={asegurado.telefono} onChange={(v) => onChange("telefono", v)} />
        <Field label="Email" value={asegurado.email} onChange={(v) => onChange("email", v)} />
        {esJuridica ? <Field label="Razón social" value={asegurado.razonSocial} onChange={(v) => onChange("razonSocial", v)} required className="xl:col-span-2" /> : <><Field label="Nombre" value={asegurado.nombre} onChange={(v) => onChange("nombre", v)} required /><Field label="Primer apellido" value={asegurado.apellido1} onChange={(v) => onChange("apellido1", v)} /><Field label="Segundo apellido" value={asegurado.apellido2} onChange={(v) => onChange("apellido2", v)} /></>}
      </div>
      <div className="space-y-4 rounded-3xl border border-border/60 bg-background/70 p-5">
        <div className="rounded-2xl border border-dashed border-border/80 bg-card p-4">
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><h3 className="font-semibold">Normalizar dirección</h3></div>
          <div className="mt-3 flex flex-col gap-2 lg:flex-row">
            <Input value={direccionLibre} onChange={(e) => setDireccionLibre(e.target.value)} placeholder="Ej. Federico García Lorca 87 Valencia" className="h-11 rounded-xl" />
            <Button type="button" variant="outline" onClick={ejecutarNormalizacion} disabled={normalizando} className="h-11 rounded-xl">
              {normalizando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Normalizar
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Si hay varias coincidencias, selecciona la dirección correcta de la lista.</p>
          {candidatos.length > 1 ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold">Direcciones encontradas</p>
              {candidatos.map((c, index) => (
                <button key={c.placeId || `${c.direccionCompleta}-${index}`} type="button" onClick={() => aplicarCandidato(c)} className="w-full rounded-xl border border-border/60 bg-background p-3 text-left transition-smooth hover:border-accent/60 hover:bg-accent/10">
                  <p className="text-sm font-semibold">{c.direccionCompleta || c.googleFormattedAddress}</p>
                  {c.googleFormattedAddress && c.googleFormattedAddress !== c.direccionCompleta ? <p className="mt-1 text-xs text-muted-foreground">{c.googleFormattedAddress}</p> : null}
                  {c.consultaUsada ? <p className="mt-1 text-[11px] text-muted-foreground">Consulta usada: {c.consultaUsada}</p> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Tipo de vía" value={asegurado.via} onChange={(v) => onChange("via", v)} />
          <Field label="Nombre vía / dirección" value={asegurado.direccion} onChange={(v) => onChange("direccion", v)} className="xl:col-span-2" />
          <Field label="Número" value={asegurado.numeroCalle} onChange={(v) => onChange("numeroCalle", v)} />
          <Field label="Bloque" value={asegurado.bloque} onChange={(v) => onChange("bloque", v)} />
          <Field label="Escalera" value={asegurado.escalera} onChange={(v) => onChange("escalera", v)} />
          <Field label="Planta" value={asegurado.planta} onChange={(v) => onChange("planta", v)} />
          <Field label="Puerta" value={asegurado.puerta} onChange={(v) => onChange("puerta", v)} />
          <Field label="Código postal" value={asegurado.codigoPostal} onChange={(v) => onChange("codigoPostal", v)} />
          <Field label="Población" value={asegurado.poblacion} onChange={(v) => onChange("poblacion", v)} />
          <Field label="Provincia" value={asegurado.provincia} onChange={(v) => onChange("provincia", v)} />
          <Field label="País" value={asegurado.pais} onChange={(v) => onChange("pais", v)} />
        </div>
      </div>
    </form>
  );
};

const buildDireccionLibre = (asegurado: Asegurado) =>
  [asegurado.via, asegurado.direccion, asegurado.numeroCalle, asegurado.codigoPostal, asegurado.poblacion, asegurado.provincia]
    .filter(Boolean)
    .join(" ");

type ConfirmDeleteDialogProps = { asegurado: Asegurado; onCancel: () => void; onConfirm: () => void; };
const ConfirmDeleteDialog = ({ asegurado, onCancel, onConfirm }: ConfirmDeleteDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
    <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 shadow-strong">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10"><AlertTriangle className="h-6 w-6 text-destructive" /></div>
        <div><h2 className="text-xl font-bold">Confirmar borrado</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Se va a borrar el registro del asegurado <strong className="text-foreground">{asegurado.displayName || asegurado.nif || "seleccionado"}</strong>. Esta acción no debería realizarse si existen pólizas o siniestros relacionados.</p></div>
      </div>
      <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">Cancelar</Button><Button type="button" variant="destructive" onClick={onConfirm} className="rounded-xl"><Trash2 className="mr-2 h-4 w-4" />Confirmar borrado</Button></div>
    </div>
  </div>
);

type FieldProps = { label: string; value: string; onChange: (value: string) => void; required?: boolean; className?: string; };
const Field = ({ label, value, onChange, required = false, className = "" }: FieldProps) => <div className={`space-y-2 ${className}`}><Label>{label}</Label><Input value={value || ""} onChange={(e) => onChange(e.target.value)} required={required} className="h-11 rounded-xl" /></div>;

type RelatedSectionProps = { title: string; icon: typeof UserRound; loading: boolean; empty: string; isEmpty: boolean; children: ReactNode; };
const RelatedSection = ({ title, icon: Icon, loading, empty, isEmpty, children }: RelatedSectionProps) => <section className="rounded-3xl border border-border/60 bg-card p-5"><div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><Icon className="h-5 w-5 text-muted-foreground" /></div><h3 className="font-semibold">{title}</h3></div>{loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</div> : isEmpty ? <p className="text-sm text-muted-foreground">{empty}</p> : children}</section>;
