import { AppHeader, type VistaDesktop } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

type VistaPendienteAppProps = {
  active: Extract<VistaDesktop, "siniestros" | "tareas">;
  titulo: string;
  descripcion: string;
  onNavigate: (vista: VistaDesktop) => void;
  onLogout: () => void;
};

export const VistaPendienteApp = ({
  active,
  titulo,
  descripcion,
  onNavigate,
  onLogout,
}: VistaPendienteAppProps) => (
  <div className="min-h-screen gradient-surface text-foreground">
    <AppHeader active={active} onNavigate={onNavigate} onLogout={onLogout} />
    <main className="mx-auto max-w-3xl px-8 py-16 text-center">
      <Construction className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-60" />
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="mt-3 text-muted-foreground">{descripcion}</p>
      <Button variant="outline" onClick={() => onNavigate("menu")} className="mt-8 rounded-xl">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al menú
      </Button>
    </main>
  </div>
);
