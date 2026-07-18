import { useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cerrarSesion } from "@/lib/filemaker";
import {
  ClipboardList,
  FolderOpen,
  Home,
  ListTodo,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

export type VistaDesktop = "menu" | "asegurados" | "polizas" | "siniestros" | "en-curso" | "tareas";

const BOTONES_NAVEGACION: Array<{
  vista: Exclude<VistaDesktop, "menu">;
  label: string;
  icon: typeof Home;
}> = [
  { vista: "asegurados", label: "Asegurados", icon: Users },
  { vista: "polizas", label: "Polizas", icon: ShieldCheck },
  { vista: "siniestros", label: "Siniestros", icon: FolderOpen },
  { vista: "en-curso", label: "En curso", icon: ClipboardList },
  { vista: "tareas", label: "Tareas", icon: ListTodo },
];

const determinarVistaActiva = (pathname: string, search: string): VistaDesktop => {
  if (pathname.startsWith("/asegurados")) return "asegurados";
  if (pathname.startsWith("/polizas")) return "polizas";
  const vista = new URLSearchParams(search).get("vista");
  if (
    vista === "asegurados" ||
    vista === "polizas" ||
    vista === "siniestros" ||
    vista === "en-curso" ||
    vista === "tareas"
  ) {
    return vista;
  }
  return "menu";
};

type AppHeaderProps = {
  /** Vista activa explícita. `null` = ningún botón resaltado (p. ej. Enlaces desde menú). */
  active?: VistaDesktop | null;
  /** Navegación personalizada (DesktopApp cambia de pestaña sin cambiar de ruta). */
  onNavigate?: (vista: VistaDesktop) => void;
  /** Cierre de sesión personalizado. */
  onLogout?: () => void;
};

export const AppHeader = ({ active, onNavigate, onLogout }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activa =
    active === null ? null : (active ?? determinarVistaActiva(location.pathname, location.search));

  const irA = (vista: VistaDesktop) => {
    if (onNavigate) {
      onNavigate(vista);
      return;
    }
    if (vista === "menu") {
      navigate("/");
      return;
    }
    navigate(`/?vista=${vista}`);
  };

  const salir = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    cerrarSesion();
    navigate("/");
  };

  return (
    <header className="border-b border-border/60 bg-card/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <Logo size="sm" />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant={activa === "menu" ? "default" : "outline"}
            onClick={() => irA("menu")}
            className="rounded-xl"
          >
            <Home className="mr-2 h-4 w-4" />
            Inicio
          </Button>
          {BOTONES_NAVEGACION.map(({ vista, label, icon: Icon }) => (
            <Button
              key={vista}
              variant={activa === vista ? "default" : "outline"}
              onClick={() => irA(vista)}
              className="rounded-xl"
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={salir}
            className="rounded-xl border-border/80 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
};
