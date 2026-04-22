import { Logo } from "@/components/Logo";
import { Monitor } from "lucide-react";

export const DesktopNotice = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 gradient-surface">
      <div className="max-w-md w-full text-center animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="bg-card rounded-3xl p-10 shadow-medium border border-border/60">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center">
            <Monitor className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Versión de escritorio
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Esta aplicación está optimizada para dispositivos móviles.
            Próximamente ampliaremos la versión para ordenador.
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} JS Peritaciones
        </p>
      </div>
    </div>
  );
};
