import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Siniestro } from "@/data/siniestros";
import { abrirWhatsApp, ejecutarScriptEnviarEnlace } from "@/lib/filemaker";
import {
  ArrowLeft,
  Send,
  LogOut,
  Loader2,
  Hash,
  Building2,
  User,
  MapPin,
  Calendar,
  Tag,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

interface SiniestroDetailProps {
  siniestro: Siniestro;
  onBack: () => void;
  onLogout: () => void;
}

export const SiniestroDetail = ({ siniestro, onBack, onLogout }: SiniestroDetailProps) => {
  const [movil, setMovil] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviarEnlace = async () => {
    setEnviando(true);
    try {
      const result = await ejecutarScriptEnviarEnlace(siniestro.numero, movil);
      const abierto = abrirWhatsApp(result);
      toast.success(abierto ? "Abriendo WhatsApp" : "Enlace generado correctamente");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al enviar el enlace";
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  const campos = [
    { icon: Hash, label: "Nº Siniestro", value: siniestro.numero, accent: true },
    { icon: Building2, label: "Compañía", value: siniestro.compania },
    { icon: User, label: "Asegurado", value: siniestro.asegurado },
    { icon: MapPin, label: "Dirección", value: siniestro.direccion },
    { icon: Tag, label: "Tipo", value: siniestro.tipo },
    { icon: Calendar, label: "Apertura", value: new Date(siniestro.fechaApertura).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) },
  ];

  return (
    <div className="min-h-screen gradient-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/60 safe-top">
        <div className="px-5 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Salir
          </Button>
        </div>
      </header>

      <div className="flex-1 px-5 pt-6 pb-44">
        {/* Hero del siniestro */}
        <div className="rounded-3xl gradient-hero p-6 text-primary-foreground shadow-medium mb-5 animate-fade-in-up">
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70 mb-2">
            Expediente
          </p>
          <h1 className="text-3xl font-bold mb-1">{siniestro.numero}</h1>
          <p className="text-sm text-primary-foreground/80">{siniestro.compania}</p>
        </div>

        {/* Detalles */}
        <div className="bg-card rounded-3xl border border-border/60 shadow-soft overflow-hidden animate-fade-in-up">
          {campos.map((c, i) => (
            <div
              key={c.label}
              className={`flex gap-4 p-4 ${i !== campos.length - 1 ? "border-b border-border/50" : ""}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.accent ? "gradient-accent" : "bg-muted"}`}>
                <c.icon className={`w-5 h-5 ${c.accent ? "text-accent-foreground" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  {c.label}
                </p>
                <p className="text-foreground font-semibold leading-snug break-words">
                  {c.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de acciones fija */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/60 px-5 pt-3 pb-5 safe-bottom">
        <div className="space-y-2.5 max-w-md mx-auto">
          <div className="space-y-1.5">
            <Label htmlFor="movil" className="text-xs font-medium text-muted-foreground">
              Móvil del destinatario
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="movil"
                inputMode="tel"
                value={movil}
                onChange={(e) => setMovil(e.target.value)}
                placeholder="Ej. 600123456"
                className="h-11 rounded-xl pl-10"
              />
            </div>
          </div>

          <Button
            onClick={enviarEnlace}
            disabled={enviando || !movil.trim()}
            className="w-full h-12 rounded-xl gradient-accent hover:opacity-95 text-accent-foreground font-semibold shadow-glow transition-smooth"
          >
            {enviando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar por WhatsApp
              </>
            )}
          </Button>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              onClick={onBack}
              className="h-11 rounded-xl border-border/80 hover:bg-secondary font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Siniestros
            </Button>
            <Button
              variant="outline"
              onClick={onLogout}
              className="h-11 rounded-xl border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 font-medium"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
