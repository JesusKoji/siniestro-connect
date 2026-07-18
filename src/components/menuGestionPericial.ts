import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  CreditCard,
  FilePlus2,
  FileText,
  FolderOpen,
  LayoutGrid,
  Receipt,
  Send,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

export type OpcionMenuGestion =
  | "asegurados"
  | "polizas"
  | "siniestros"
  | "en-curso"
  | "tareas"
  | "enlaces"
  | "list-asignados";

export type ItemMenuGestion = {
  label: string;
  accion?: OpcionMenuGestion;
  icon?: LucideIcon;
  descripcion?: string;
};

export type SeccionMenuGestion = {
  titulo: string;
  icon: LucideIcon;
  items: ItemMenuGestion[];
};

/** Columnas del menú clásico FileMaker (5 columnas). */
export const COLUMNAS_MENU_CLASICO: ItemMenuGestion[][] = [
  [
    { label: "Asegurados", accion: "asegurados" },
    { label: "Pólizas", accion: "polizas" },
    { label: "Siniestros", accion: "siniestros" },
    { label: "En curso", accion: "en-curso" },
    { label: "Tareas", accion: "tareas" },
    { label: "Enlaces", accion: "enlaces" },
  ],
  [
    { label: "Pendientes de cobro" },
    { label: "Alb. Pend. de cobro" },
    { label: "Cobros" },
    { label: "Reparar facturas" },
  ],
  [{ label: "List. Asignados", accion: "list-asignados" }, { label: "List. Cerrados" }, { label: "List. Ingresos" }],
  [{ label: "Configuración" }, { label: "Ir a Ant. Menu" }],
  [{ label: "Altas Prepersa" }, { label: "Altas Crawford" }, { label: "Altas Nuevo Form" }],
];

/** Secciones agrupadas para el menú moderno. */
export const SECCIONES_MENU_MODERNO: SeccionMenuGestion[] = [
  {
    titulo: "Expedientes",
    icon: FolderOpen,
    items: [
      {
        label: "Asegurados",
        accion: "asegurados",
        icon: Users,
        descripcion: "Fichas y contactos de asegurados",
      },
      {
        label: "Pólizas",
        accion: "polizas",
        icon: ShieldCheck,
        descripcion: "Consulta y edición de pólizas",
      },
      {
        label: "Siniestros",
        accion: "siniestros",
        icon: FolderOpen,
        descripcion: "Gestión general de siniestros",
      },
      {
        label: "En curso",
        accion: "en-curso",
        icon: FileText,
        descripcion: "Listado de siniestros sin fecha de cierre",
      },
      {
        label: "Tareas",
        accion: "tareas",
        icon: ClipboardList,
        descripcion: "Tareas pendientes",
      },
      {
        label: "Enlaces",
        accion: "enlaces",
        icon: Send,
        descripcion: "Envío de enlaces por WhatsApp",
      },
    ],
  },
  {
    titulo: "Facturación",
    icon: Receipt,
    items: [
      { label: "Pendientes de cobro", icon: CreditCard, descripcion: "Facturas por cobrar" },
      { label: "Alb. Pend. de cobro", icon: ClipboardList, descripcion: "Albaranes pendientes" },
      { label: "Cobros", icon: CreditCard, descripcion: "Registro de cobros" },
      { label: "Reparar facturas", icon: Wrench, descripcion: "Corrección de facturas" },
    ],
  },
  {
    titulo: "Listados",
    icon: LayoutGrid,
    items: [
      {
        label: "List. Asignados",
        accion: "list-asignados",
        icon: ClipboardList,
        descripcion: "Gráficos de siniestros asignados",
      },
      { label: "List. Cerrados", icon: FileText, descripcion: "Expedientes cerrados" },
      { label: "List. Ingresos", icon: Receipt, descripcion: "Informe de ingresos" },
    ],
  },
  {
    titulo: "Sistema",
    icon: Settings,
    items: [
      { label: "Configuración", icon: Settings, descripcion: "Ajustes de la aplicación" },
      { label: "Ir a Ant. Menu", icon: LayoutGrid, descripcion: "Menú anterior de FileMaker" },
    ],
  },
  {
    titulo: "Altas",
    icon: FilePlus2,
    items: [
      { label: "Altas Prepersa", icon: FilePlus2, descripcion: "Alta expedientes Prepersa" },
      { label: "Altas Crawford", icon: FilePlus2, descripcion: "Alta expedientes Crawford" },
      { label: "Altas Nuevo Form", icon: FilePlus2, descripcion: "Alta con formulario nuevo" },
    ],
  },
];

export type EstiloMenuInicio = "moderno" | "clasico";

export function fechaMenuCapitalizada() {
  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return fecha.charAt(0).toUpperCase() + fecha.slice(1);
}
