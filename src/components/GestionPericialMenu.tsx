import { Logo } from "@/components/Logo";
import {
  COLUMNAS_MENU_CLASICO,
  fechaMenuCapitalizada,
  OpcionMenuGestion,
} from "@/components/menuGestionPericial";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LogOut } from "lucide-react";

export type { OpcionMenuGestion };

type GestionPericialMenuProps = {
  nombreUsuario?: string;
  onNavigate: (opcion: OpcionMenuGestion) => void;
  onPendiente: (label: string) => void;
  onSalir: () => void;
  onCambiarEstilo?: () => void;
};

export const GestionPericialMenu = ({
  nombreUsuario,
  onNavigate,
  onPendiente,
  onSalir,
  onCambiarEstilo,
}: GestionPericialMenuProps) => {
  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col bg-white text-black">
      <div className="mx-auto w-full max-w-6xl flex-1 px-10 pb-8 pt-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-semibold tracking-tight">{fechaMenuCapitalizada()}</p>
          <div className="flex items-center gap-2">
            {onCambiarEstilo ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onCambiarEstilo}
                className="rounded-lg border-black/20 text-black hover:bg-black/5"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Vista moderna
              </Button>
            ) : null}
            <Logo size="sm" className="h-14" />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">Gestión Pericial</h1>
          <Logo size="lg" className="h-36 md:h-44" />
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {COLUMNAS_MENU_CLASICO.map((columna, indice) => (
            <nav key={indice} className="min-w-0">
              <div className="mb-4 h-0.5 w-full bg-[#009639]" aria-hidden />
              <ul className="space-y-3">
                {columna.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() =>
                        item.accion ? onNavigate(item.accion) : onPendiente(item.label)
                      }
                      className="text-left text-base font-bold leading-snug transition-colors hover:text-[#009639] md:text-lg"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <footer className="border-t border-black/10 bg-white px-10 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-sm">
            Usuario: <span className="font-bold">{nombreUsuario || "—"}</span>
          </p>
          <button
            type="button"
            onClick={onSalir}
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:text-[#009639]"
          >
            Salir
            <LogOut className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </footer>
    </div>
  );
};
