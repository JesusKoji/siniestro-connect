import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PeriodoListadoAsignados } from "@/lib/asignadosSiniestros";
import { BarChart3, CalendarDays, CalendarRange, ChevronRight } from "lucide-react";

type ElegirListadoAsignadosDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onElegir: (periodo: PeriodoListadoAsignados) => void;
};

const OPCIONES: {
  periodo: PeriodoListadoAsignados;
  titulo: string;
  descripcion: string;
  icon: typeof CalendarRange;
  disponible: boolean;
}[] = [
  {
    periodo: "anual",
    titulo: "Asignados anualmente",
    descripcion: "Total de siniestros asignados por año",
    icon: CalendarRange,
    disponible: true,
  },
  {
    periodo: "mensual",
    titulo: "Asignados mensualmente",
    descripcion: "Comparativa mensual con desglose por compañía",
    icon: BarChart3,
    disponible: true,
  },
  {
    periodo: "diario",
    titulo: "Asignados diariamente",
    descripcion: "Mes en curso con desglose Occident y Resto por día",
    icon: CalendarDays,
    disponible: true,
  },
];

export const ElegirListadoAsignadosDialog = ({
  open,
  onOpenChange,
  onElegir,
}: ElegirListadoAsignadosDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Listado de asignados</DialogTitle>
          <DialogDescription>
            Elige cómo quieres ver los siniestros asignados de la tabla Siniestros.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {OPCIONES.map((opcion) => {
            const Icon = opcion.icon;
            return (
              <button
                key={opcion.periodo}
                type="button"
                disabled={!opcion.disponible}
                onClick={() => onElegir(opcion.periodo)}
                className={`group flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-smooth ${
                  opcion.disponible
                    ? "border-border/60 bg-card hover:border-accent/50 hover:bg-accent/5"
                    : "cursor-not-allowed border-border/40 bg-muted/30 opacity-70"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    opcion.disponible ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{opcion.titulo}</p>
                  <p className="text-sm text-muted-foreground">{opcion.descripcion}</p>
                  {!opcion.disponible ? (
                    <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Próximamente
                    </span>
                  ) : null}
                </div>
                {opcion.disponible ? (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                ) : null}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
