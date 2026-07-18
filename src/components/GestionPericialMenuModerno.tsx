import { Logo } from "@/components/Logo";
import {
  fechaMenuCapitalizada,
  OpcionMenuGestion,
  SECCIONES_MENU_MODERNO,
} from "@/components/menuGestionPericial";
import { Button } from "@/components/ui/button";
import { ChevronRight, LayoutTemplate, LogOut, Sparkles } from "lucide-react";

type GestionPericialMenuModernoProps = {
  nombreUsuario?: string;
  onNavigate: (opcion: OpcionMenuGestion) => void;
  onPendiente: (label: string) => void;
  onSalir: () => void;
  onCambiarEstilo?: () => void;
};

export const GestionPericialMenuModerno = ({
  nombreUsuario,
  onNavigate,
  onPendiente,
  onSalir,
  onCambiarEstilo,
}: GestionPericialMenuModernoProps) => {
  const primerNombre = nombreUsuario?.split(/[.@]/)[0] || "Usuario";
  const saludo =
    primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase();

  return (
    <div className="min-h-screen gradient-surface text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8 pb-24">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {onCambiarEstilo ? (
              <Button variant="outline" size="sm" onClick={onCambiarEstilo} className="rounded-xl">
                <LayoutTemplate className="mr-2 h-4 w-4" />
                Vista clásica
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={onSalir}
              className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </header>

        <section className="mt-10 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
          <div className="gradient-hero px-8 py-10 text-primary-foreground md:px-10 md:py-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm text-primary-foreground/75">
                  <Sparkles className="h-4 w-4" />
                  {fechaMenuCapitalizada()}
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  Hola, {saludo}
                </h1>
                <p className="mt-2 max-w-xl text-primary-foreground/85">
                  Gestión Pericial · elige un módulo para continuar
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-primary-foreground/70">
                  Sesión activa
                </p>
                <p className="mt-1 font-semibold">{nombreUsuario || "—"}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-8">
          {SECCIONES_MENU_MODERNO.map((seccion) => {
            const SeccionIcon = seccion.icon;
            return (
              <section key={seccion.titulo}>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <SeccionIcon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">{seccion.titulo}</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {seccion.items.map((item) => {
                    const ItemIcon = item.icon;
                    const activo = Boolean(item.accion);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() =>
                          item.accion ? onNavigate(item.accion) : onPendiente(item.label)
                        }
                        className={`group flex w-full flex-col rounded-2xl border p-4 text-left transition-smooth ${
                          activo
                            ? "border-border/60 bg-card shadow-soft hover:border-accent/50 hover:bg-accent/5 hover:shadow-md"
                            : "border-border/40 bg-card/60 opacity-90 hover:border-border/70 hover:bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {ItemIcon ? (
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                activo ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <ItemIcon className="h-5 w-5" />
                            </div>
                          ) : null}
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="mt-3 font-semibold leading-snug">{item.label}</p>
                        {item.descripcion ? (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {item.descripcion}
                          </p>
                        ) : null}
                        {!activo ? (
                          <span className="mt-3 inline-flex w-fit rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Próximamente
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
