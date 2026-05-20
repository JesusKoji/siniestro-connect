import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactoAsegurado } from "@/data/siniestros";
import {
  actualizarContactoAsegurado,
  borrarContactoAsegurado,
  crearContactoAsegurado,
} from "@/lib/filemaker";
import { Edit3, Loader2, Mail, Phone, Plus, Save, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  idAsegurado: string;
  contactos: ContactoAsegurado[];
  loading: boolean;
  onChanged: () => void;
};

const contactoVacio = (idAsegurado: string): ContactoAsegurado => ({
  id: `ContactoAseg_${Date.now()}`,
  idAsegurado,
  nombre: "",
  nombreCompleto: "",
  cargo: "",
  telefono: "",
  telefono2: "",
  movil: "",
  mail: "",
  notas: "",
});

export const ContactosAseguradoManager = ({ idAsegurado, contactos, loading, onChanged }: Props) => {
  const [editando, setEditando] = useState<ContactoAsegurado | null>(null);
  const [borrando, setBorrando] = useState<ContactoAsegurado | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setEditando(null);
    setBorrando(null);
  }, [idAsegurado]);

  const nuevo = () => setEditando(contactoVacio(idAsegurado));
  const cambiar = (campo: keyof ContactoAsegurado, valor: string) => setEditando((actual) => actual ? { ...actual, [campo]: valor } : actual);

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editando) return;
    if (!editando.nombre.trim() && !editando.nombreCompleto.trim()) {
      toast.error("Introduce el nombre del contacto");
      return;
    }

    setGuardando(true);
    try {
      const esNuevo = !contactos.some((c) => c.id === editando.id);
      if (esNuevo) {
        await crearContactoAsegurado(editando);
        toast.success("Contacto creado");
      } else {
        await actualizarContactoAsegurado(editando);
        toast.success("Contacto actualizado");
      }
      setEditando(null);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el contacto");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBorrado = async () => {
    if (!borrando) return;
    setGuardando(true);
    try {
      await borrarContactoAsegurado(borrando);
      toast.success("Contacto borrado");
      setBorrando(null);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo borrar el contacto");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <UserRound className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Contactos relacionados</h3>
            <p className="text-xs text-muted-foreground">{contactos.length} contactos</p>
          </div>
        </div>
        <Button type="button" onClick={nuevo} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Añadir contacto
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando...</div>
      ) : contactos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin contactos relacionados</p>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {contactos.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.nombreCompleto || c.nombre || "Sin nombre"}</p>
                  {c.cargo ? <p className="text-xs text-muted-foreground">{c.cargo}</p> : null}
                </div>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditando(c)} className="rounded-xl"><Edit3 className="h-4 w-4" /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setBorrando(c)} className="rounded-xl text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                {c.movil ? <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{c.movil}</p> : null}
                {c.telefono ? <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{c.telefono}</p> : null}
                {c.telefono2 ? <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{c.telefono2}</p> : null}
                {c.mail ? <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{c.mail}</p> : null}
                {c.notas ? <p className="pt-2 text-xs">{c.notas}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {editando ? (
        <ContactDialog contacto={editando} guardando={guardando} onChange={cambiar} onCancel={() => setEditando(null)} onSubmit={guardar} />
      ) : null}

      {borrando ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 shadow-strong">
            <h2 className="text-xl font-bold">Confirmar borrado de contacto</h2>
            <p className="mt-2 text-sm text-muted-foreground">Se va a borrar el contacto <strong className="text-foreground">{borrando.nombreCompleto || borrando.nombre}</strong>.</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setBorrando(null)} className="rounded-xl">Cancelar</Button>
              <Button type="button" variant="destructive" onClick={confirmarBorrado} disabled={guardando} className="rounded-xl">
                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Confirmar borrado
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

type ContactDialogProps = {
  contacto: ContactoAsegurado;
  guardando: boolean;
  onChange: (campo: keyof ContactoAsegurado, valor: string) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

const ContactDialog = ({ contacto, guardando, onChange, onCancel, onSubmit }: ContactDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
    <form onSubmit={onSubmit} className="w-full max-w-3xl rounded-3xl border border-border/60 bg-card p-6 shadow-strong">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{contacto.id.startsWith("ContactoAseg_") ? "Nuevo contacto" : "Editar contacto"}</h2>
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl"><X className="h-4 w-4" /></Button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Nombre" value={contacto.nombre} onChange={(v) => onChange("nombre", v)} required />
        <Field label="Nombre completo" value={contacto.nombreCompleto} onChange={(v) => onChange("nombreCompleto", v)} />
        <Field label="Cargo / relación" value={contacto.cargo} onChange={(v) => onChange("cargo", v)} />
        <Field label="Móvil" value={contacto.movil} onChange={(v) => onChange("movil", v)} />
        <Field label="Teléfono" value={contacto.telefono} onChange={(v) => onChange("telefono", v)} />
        <Field label="Teléfono 2" value={contacto.telefono2} onChange={(v) => onChange("telefono2", v)} />
        <Field label="Email" value={contacto.mail} onChange={(v) => onChange("mail", v)} className="md:col-span-2" />
        <Field label="Notas" value={contacto.notas} onChange={(v) => onChange("notas", v)} className="md:col-span-2" />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">Cancelar</Button>
        <Button type="submit" disabled={guardando} className="rounded-xl">
          {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar
        </Button>
      </div>
    </form>
  </div>
);

type FieldProps = { label: string; value: string; onChange: (value: string) => void; required?: boolean; className?: string };
const Field = ({ label, value, onChange, required = false, className = "" }: FieldProps) => (
  <div className={`space-y-2 ${className}`}>
    <Label>{label}</Label>
    <Input value={value || ""} onChange={(e) => onChange(e.target.value)} required={required} className="h-11 rounded-xl" />
  </div>
);
