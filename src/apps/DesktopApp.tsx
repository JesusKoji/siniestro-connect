import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AseguradosApp } from "@/apps/AseguradosApp";
import { ListAsignadosApp } from "@/apps/ListAsignadosApp";
import { PolizasApp } from "@/apps/PolizasApp";
import { SiniestrosGeneralApp } from "@/apps/SiniestrosGeneralApp";
import { SiniestrosApp } from "@/apps/SiniestrosApp";
import { VistaPendienteApp } from "@/apps/VistaPendienteApp";
import { GestionPericialMenu, OpcionMenuGestion } from "@/components/GestionPericialMenu";
import { GestionPericialMenuModerno } from "@/components/GestionPericialMenuModerno";
import { ElegirListadoAsignadosDialog } from "@/components/ElegirListadoAsignadosDialog";
import { EstiloMenuInicio } from "@/components/menuGestionPericial";
import { AppHeader, type VistaDesktop } from "@/components/AppHeader";
import { LoginScreen } from "@/components/LoginScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Siniestro } from "@/data/siniestros";
import {
  abrirWhatsApp,
  cerrarSesion,
  ejecutarScriptEnviarEnlace,
  estaAutenticado,
  listarSiniestrosEnCurso,
  obtenerUsuarioSesion,
} from "@/lib/filemaker";
import {
  Building2,
  Calendar,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Search,
  Send,
  Tag,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type { PeriodoListadoAsignados } from "@/lib/asignadosSiniestros";

type DesktopView = VistaDesktop | "enlaces" | "list-asignados";

const CLAVE_ESTILO_MENU = "siniestro-connect:estilo-menu";

function leerEstiloMenu(param: string | null): EstiloMenuInicio {
  if (param === "clasico" || param === "moderno") return param;
  if (typeof sessionStorage !== "undefined") {
    const guardado = sessionStorage.getItem(CLAVE_ESTILO_MENU);
    if (guardado === "clasico" || guardado === "moderno") return guardado;
  }
  return "moderno";
}

export const DesktopApp = () => {
  const [autenticado, setAutenticado] = useState(() => estaAutenticado());
  const [nombreUsuario, setNombreUsuario] = useState(() => obtenerUsuarioSesion());
  const [searchParams, setSearchParams] = useSearchParams();
  const vistaParam = searchParams.get("vista");
  const periodoAsignados = (searchParams.get("periodo") ?? "anual") as PeriodoListadoAsignados;
  const estiloMenu = leerEstiloMenu(searchParams.get("menu"));
  const vista: DesktopView =
    vistaParam === "enlaces" ||
    vistaParam === "en-curso" ||
    vistaParam === "siniestros" ||
    vistaParam === "tareas" ||
    vistaParam === "asegurados" ||
    vistaParam === "polizas" ||
    vistaParam === "list-asignados"
      ? vistaParam
      : "menu";
  const setVista = (nueva: VistaDesktop | "list-asignados" | "enlaces", opciones?: { periodo?: PeriodoListadoAsignados }) => {
    const params: Record<string, string> = {};
    if (nueva !== "menu") params.vista = nueva;
    if (nueva === "list-asignados") params.periodo = opciones?.periodo ?? "anual";
    if (estiloMenu !== "moderno") params.menu = estiloMenu;
    setSearchParams(params);
  };

  const alternarEstiloMenu = () => {
    const siguiente: EstiloMenuInicio = estiloMenu === "moderno" ? "clasico" : "moderno";
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(CLAVE_ESTILO_MENU, siguiente);
    }
    setSearchParams(
      siguiente === "moderno" ? {} : { menu: siguiente },
      { replace: true }
    );
  };
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [seleccionado, setSeleccionado] = useState<Siniestro | null>(null);
  const [query, setQuery] = useState("");
  const [movil, setMovil] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [dialogAsignados, setDialogAsignados] = useState(false);

  useEffect(() => {
    if (!autenticado || vista !== "enlaces" || siniestros.length > 0) return;

    setLoading(true);
    listarSiniestrosEnCurso()
      .then((data) => {
        setSiniestros(data);
        setSeleccionado(data[0] ?? null);
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : "No se pudieron cargar los siniestros";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [autenticado, vista, siniestros.length]);

  useEffect(() => {
    setMovil("");
  }, [seleccionado?.id]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return siniestros;
    return siniestros.filter((s) =>
      [s.numero, s.compania, s.asegurado, s.direccion, s.tipo]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [siniestros, query]);

  const enviarEnlace = async () => {
    if (!seleccionado) return;
    setEnviando(true);
    try {
      const result = await ejecutarScriptEnviarEnlace(seleccionado.numero, movil);
      const abierto = abrirWhatsApp(result);
      toast.success(abierto ? "Abriendo WhatsApp" : "Enlace generado correctamente");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al enviar el enlace";
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  const logout = () => {
    cerrarSesion();
    setAutenticado(false);
    setNombreUsuario("");
    setVista("menu");
    setSiniestros([]);
    setSeleccionado(null);
    setQuery("");
    setMovil("");
  };

  const irMenuOpcion = (opcion: OpcionMenuGestion) => {
    if (opcion === "list-asignados") {
      setDialogAsignados(true);
      return;
    }
    setVista(opcion);
  };

  const elegirPeriodoAsignados = (periodo: PeriodoListadoAsignados) => {
    setDialogAsignados(false);
    setVista("list-asignados", { periodo });
  };

  if (!autenticado) {
    return (
      <LoginScreen
        onLogin={(usuario) => {
          setAutenticado(true);
          setNombreUsuario(usuario);
        }}
      />
    );
  }

  if (vista === "menu") {
    const propsMenu = {
      nombreUsuario,
      onNavigate: irMenuOpcion,
      onPendiente: (label: string) =>
        toast.info(`«${label}» estará disponible próximamente en la web`),
      onSalir: logout,
      onCambiarEstilo: alternarEstiloMenu,
    };

    return (
      <>
        {estiloMenu === "clasico" ? (
          <GestionPericialMenu {...propsMenu} />
        ) : (
          <GestionPericialMenuModerno {...propsMenu} />
        )}
        <ElegirListadoAsignadosDialog
          open={dialogAsignados}
          onOpenChange={setDialogAsignados}
          onElegir={elegirPeriodoAsignados}
        />
      </>
    );
  }

  if (vista === "list-asignados") {
    return (
      <ListAsignadosApp
        periodo={periodoAsignados}
        onNavigate={setVista}
        onVolver={() => setVista("menu")}
        onLogout={logout}
      />
    );
  }

  if (vista === "en-curso") {
    return <SiniestrosApp onNavigate={setVista} onLogout={logout} />;
  }

  if (vista === "siniestros") {
    return <SiniestrosGeneralApp onNavigate={setVista} onLogout={logout} />;
  }

  if (vista === "tareas") {
    return (
      <VistaPendienteApp
        active="tareas"
        titulo="Tareas"
        descripcion="Módulo de tareas en desarrollo."
        onNavigate={setVista}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="min-h-screen gradient-surface text-foreground">
      <AppHeader
        active={vista === "enlaces" ? null : vista}
        onNavigate={setVista}
        onLogout={logout}
      />

      {vista === "asegurados" ? (
        <AseguradosApp />
      ) : vista === "polizas" ? (
        <PolizasApp />
      ) : (
        <main className="mx-auto grid max-w-7xl gap-6 px-8 py-8 lg:grid-cols-[380px_1fr]">
          <section className="rounded-3xl border border-border/60 bg-card shadow-soft">
            <div className="border-b border-border/60 p-5">
              <h1 className="text-2xl font-bold">Enlaces</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading ? "Cargando expedientes..." : `${filtrados.length} expedientes disponibles`}
              </p>
              <div className="relative mt-4">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nº, compañía, asegurado..."
                  className="h-12 rounded-2xl border-border/60 bg-background pl-10"
                />
              </div>
            </div>

            <div className="max-h-[calc(100vh-235px)] overflow-y-auto p-3">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : filtrados.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p className="text-sm">No se han encontrado siniestros</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtrados.map((s) => {
                    const activo = seleccionado?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSeleccionado(s)}
                        className={`w-full rounded-2xl border p-4 text-left transition-smooth ${
                          activo
                            ? "border-accent/60 bg-accent/10 shadow-sm"
                            : "border-transparent hover:border-border/70 hover:bg-secondary/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold tracking-wide text-accent">{s.numero}</span>
                          <span className="truncate text-xs text-muted-foreground">{s.compania}</span>
                        </div>
                        <p className="mt-1 truncate font-semibold">{s.asegurado}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{s.direccion}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="min-h-[640px] rounded-3xl border border-border/60 bg-card shadow-soft">
            {seleccionado ? (
              <div className="flex h-full flex-col">
                <div className="gradient-hero rounded-t-3xl p-8 text-primary-foreground">
                  <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Expediente</p>
                  <div className="mt-2 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                    <div>
                      <h2 className="text-4xl font-bold">{seleccionado.numero}</h2>
                      <p className="mt-1 text-primary-foreground/80">{seleccionado.compania}</p>
                    </div>
                    <div className="w-full rounded-2xl bg-white/10 p-4 backdrop-blur-sm xl:w-96">
                      <Label htmlFor="desktop-movil" className="text-xs font-medium text-primary-foreground/80">
                        Móvil del destinatario
                      </Label>
                      <div className="mt-2 flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/70" />
                          <Input
                            id="desktop-movil"
                            inputMode="tel"
                            value={movil}
                            onChange={(e) => setMovil(e.target.value)}
                            placeholder="Ej. 600123456"
                            className="h-12 rounded-xl border-white/30 bg-white/95 pl-10 text-primary placeholder:text-primary/45"
                          />
                        </div>
                        <Button
                          onClick={enviarEnlace}
                          disabled={enviando || !movil.trim()}
                          className="h-12 rounded-xl bg-white/95 px-5 font-semibold text-primary hover:bg-white"
                        >
                          {enviando ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              WhatsApp
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-6 xl:grid-cols-2">
                  <DetailCard icon={User} label="Asegurado" value={seleccionado.asegurado} />
                  <DetailCard icon={Building2} label="Compañía" value={seleccionado.compania} />
                  <DetailCard icon={MapPin} label="Dirección riesgo" value={seleccionado.direccion} />
                  <DetailCard icon={Tag} label="Tipo" value={seleccionado.tipo} />
                  <DetailCard
                    icon={Calendar}
                    label="Fecha apertura"
                    value={new Date(seleccionado.fechaApertura).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[640px] items-center justify-center p-8 text-center text-muted-foreground">
                <div>
                  <FileText className="mx-auto mb-4 h-12 w-12 opacity-40" />
                  <p>Selecciona un siniestro para ver el detalle.</p>
                </div>
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
};

type DetailCardProps = {
  icon: typeof User;
  label: string;
  value: string;
};

const DetailCard = ({ icon: Icon, label, value }: DetailCardProps) => (
  <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 break-words font-semibold leading-snug">{value || "-"}</p>
      </div>
    </div>
  </div>
);
