import { useEffect, useState } from "react";
import { Siniestro } from "@/data/siniestros";
import { CamposLocalidadEspana } from "@/components/CamposLocalidadEspana";
import { DateField } from "@/components/DateField";
import { DireccionMapaButton } from "@/components/DireccionMapaButton";
import { NormalizadorDireccion, type CandidatoDireccion } from "@/components/NormalizadorDireccion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  aliasSiniestro,
  aseguradoDisplaySiniestro,
  fechaSiguientePrevioSiniestro,
} from "@/lib/siniestroListado";
import {
  buildDireccionBusquedaMapaSiniestro,
  buildDireccionLibreSiniestro,
  detalleInteriorDisplaySiniestro,
  direccionVistaDisplaySiniestro,
  patchDireccionNormalizadaSiniestro,
} from "@/lib/direccionSiniestro";
import {
  estadoSiniestroDisplay,
  fechaEfectoPolizaDisplaySiniestro,
  fechaOcurrenciaDisplaySiniestro,
  fechaRecepcionDisplaySiniestro,
  horaRecepcionDisplaySiniestro,
} from "@/lib/siniestroGeneralListado";
import { normalizarDireccion } from "@/lib/geocode";
import { textoCampo } from "@/lib/textoCampo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ModoSiniestroFicha = "vista" | "nuevo" | "edicion";

type SiniestroFichaSectionProps = {
  siniestro: Siniestro;
  className?: string;
  /** Muestra duración, últ. previo, S. previo y suma previo (vista En curso). */
  mostrarMetricasEnCurso?: boolean;
  modo?: ModoSiniestroFicha;
  onChange?: (campo: keyof Siniestro, valor: string) => void;
};

export const SiniestroFichaSection = ({
  siniestro,
  className,
  mostrarMetricasEnCurso = false,
  modo = "vista",
  onChange,
}: SiniestroFichaSectionProps) => {
  const editando = modo === "nuevo" || modo === "edicion";
  const enCurso = estadoSiniestroDisplay(siniestro) === "En curso";

  return (
    <div className={cn("space-y-6", className)}>
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Siniestro</p>
              {editando ? (
                <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <CampoEditable
                    label="Nº siniestro"
                    value={siniestro.numero}
                    onChange={(v) => onChange?.("numero", v)}
                    required
                  />
                  <CampoEditable
                    label="2º referencia"
                    value={siniestro.numeroSiniestro2}
                    onChange={(v) => onChange?.("numeroSiniestro2", v)}
                  />
                  <CampoEditable
                    label="Crawford"
                    value={siniestro.crawfordSini}
                    onChange={(v) => onChange?.("crawfordSini", v)}
                  />
                </div>
              ) : (
                <>
                  <h2 className="mt-1 text-3xl font-bold tracking-tight">{siniestro.numero || "-"}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">2º referencia:</span>{" "}
                      {textoCampo(siniestro.numeroSiniestro2) || "-"}
                    </span>
                    <span>
                      <span className="font-medium text-foreground">Crawford:</span>{" "}
                      {textoCampo(siniestro.crawfordSini) || "-"}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-start gap-3">
              {!editando ? (
                <span
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-sm font-semibold",
                    enCurso ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
                  )}
                >
                  {estadoSiniestroDisplay(siniestro)}
                </span>
              ) : null}
              <div className="rounded-xl border border-border/60 bg-background px-4 py-2 text-sm">
                {editando ? (
                  <div className="space-y-3 min-w-[10rem]">
                    <DateField
                      label="F. recepción"
                      value={siniestro.fechaRecepcion ?? ""}
                      onChange={(v) => onChange?.("fechaRecepcion", v)}
                    />
                    <CampoEditable
                      label="Hora recepción"
                      value={siniestro.horaRecepcion}
                      onChange={(v) => onChange?.("horaRecepcion", v)}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">F. recepción</p>
                    <p className="font-semibold">{fechaRecepcionDisplaySiniestro(siniestro) || "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      H. recep. {horaRecepcionDisplaySiniestro(siniestro) || "-"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {editando ? (
              <>
                <CampoEditable label="Asegurado" value={siniestro.asegurado} onChange={(v) => onChange?.("asegurado", v)} />
                <DateField
                  label="F. ocurrencia"
                  value={siniestro.fechaOcurrencia ?? ""}
                  onChange={(v) => onChange?.("fechaOcurrencia", v)}
                />
                <CampoEditable label="Tipo siniestro" value={siniestro.tipo} onChange={(v) => onChange?.("tipo", v)} />
              </>
            ) : (
              <>
                <CampoCabecera label="Póliza" value={siniestro.numeroPoliza} />
                <CampoCabecera label="Ramo" value={siniestro.ramo} />
                <CampoCabecera label="Fecha efecto" value={fechaEfectoPolizaDisplaySiniestro(siniestro)} />
                <CampoCabecera label="Compañía" value={aliasSiniestro(siniestro)} />
                <CampoCabecera label="Asegurado" value={aseguradoDisplaySiniestro(siniestro)} />
                <CampoCabecera label="F. ocurrencia" value={fechaOcurrenciaDisplaySiniestro(siniestro)} />
                <CampoCabecera label="Tipo siniestro" value={siniestro.tipo} />
              </>
            )}
          </div>

          {mostrarMetricasEnCurso ? (
            <div className="mt-5 grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <CampoCabecera label="Duración" value={siniestro.diasAbierto} />
              <CampoCabecera label="Ult. previo" value={siniestro.diasUltimoPrevio} />
              <CampoCabecera label="S. previo" value={fechaSiguientePrevioSiniestro(siniestro)} />
              <CampoCabecera label="Previos" value={siniestro.zSumaPrevio} />
            </div>
          ) : null}
        </div>

        <section className="border-b border-border/60 px-6 py-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dirección</h3>
          {editando ? (
            <SeccionDireccionEdicion siniestro={siniestro} onChange={onChange} />
          ) : (
            <DireccionMapaButton
              label="Dirección completa"
              dialogTitle="Dirección del siniestro"
              subtitle={detalleInteriorDisplaySiniestro(siniestro) || undefined}
              address={direccionVistaDisplaySiniestro(siniestro)}
              searchAddress={buildDireccionBusquedaMapaSiniestro(siniestro)}
              className="max-w-none"
            />
          )}
        </section>

        <div className="p-6">
          <Tabs defaultValue="acciones" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap items-center justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value="acciones" className="rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                Acciones
              </TabsTrigger>
              <TabsTrigger value="preexistencias" className="rounded-xl">
                Preexistencias
              </TabsTrigger>
              <TabsTrigger value="seguridad" className="rounded-xl">
                Seguridad
              </TabsTrigger>
              <TabsTrigger value="contactos" className="rounded-xl">
                Contactos
              </TabsTrigger>
              <TabsTrigger value="coberturas" className="rounded-xl">
                Coberturas
              </TabsTrigger>
              <TabsTrigger value="gestiones" className="rounded-xl">
                Gestiones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="acciones" className="mt-6 space-y-5">
              {editando ? (
                <>
                  <BloqueTextoEditable
                    label="Descripción riesgo"
                    value={siniestro.descripcionRiesgo}
                    onChange={(v) => onChange?.("descripcionRiesgo", v)}
                  />
                  <BloqueTextoEditable
                    label="Versión siniestro"
                    value={siniestro.relatoSiniestro}
                    onChange={(v) => onChange?.("relatoSiniestro", v)}
                  />
                  <BloqueTextoEditable
                    label="Notas tramitación"
                    value={siniestro.notasTramitacion}
                    onChange={(v) => onChange?.("notasTramitacion", v)}
                  />
                </>
              ) : (
                <>
                  <BloqueTexto label="Descripción riesgo" value={siniestro.descripcionRiesgo} />
                  <BloqueTexto label="Versión siniestro" value={siniestro.relatoSiniestro} />
                  <BloqueTexto label="Notas tramitación" value={siniestro.notasTramitacion} />
                </>
              )}
            </TabsContent>

            <TabsContent value="preexistencias" className="mt-6">
              <PestanaPendiente titulo="Preexistencias" />
            </TabsContent>
            <TabsContent value="seguridad" className="mt-6">
              <PestanaPendiente titulo="Seguridad" />
            </TabsContent>
            <TabsContent value="contactos" className="mt-6">
              <PestanaPendiente titulo="Contactos" />
            </TabsContent>
            <TabsContent value="coberturas" className="mt-6">
              <PestanaPendiente titulo="Coberturas" />
            </TabsContent>
            <TabsContent value="gestiones" className="mt-6">
              <PestanaPendiente titulo="Gestiones" />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

const CampoCabecera = ({
  label,
  value,
  className,
}: {
  label: string;
  value?: string;
  className?: string;
}) => (
  <div className={className}>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 font-semibold leading-snug">{textoCampo(value) || "-"}</p>
  </div>
);

const CampoEditable = ({
  label,
  value,
  onChange,
  required,
  className,
}: {
  label: string;
  value?: string;
  onChange: (valor: string) => void;
  required?: boolean;
  className?: string;
}) => (
  <div className={cn("space-y-2", className)}>
    <Label>{label}</Label>
    <Input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="h-11 rounded-xl"
    />
  </div>
);

const BloqueTexto = ({ label, value }: { label: string; value?: string }) => (
  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{textoCampo(value) || "-"}</p>
  </div>
);

const BloqueTextoEditable = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (valor: string) => void;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="rounded-xl"
    />
  </div>
);

const PestanaPendiente = ({ titulo }: { titulo: string }) => (
  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center text-muted-foreground">
    <p className="font-medium">{titulo}</p>
    <p className="mt-1 text-sm">Se implementará en una fase posterior.</p>
  </div>
);

const SeccionDireccionEdicion = ({
  siniestro,
  onChange,
}: {
  siniestro: Siniestro;
  onChange?: (campo: keyof Siniestro, valor: string) => void;
}) => {
  const [direccionLibre, setDireccionLibre] = useState(() => buildDireccionLibreSiniestro(siniestro));
  const [normalizando, setNormalizando] = useState(false);
  const [candidatos, setCandidatos] = useState<CandidatoDireccion[]>([]);

  useEffect(() => {
    setDireccionLibre(buildDireccionLibreSiniestro(siniestro));
    setCandidatos([]);
  }, [
    siniestro.id,
    siniestro.recordId,
    siniestro.via,
    siniestro.calle,
    siniestro.numeroCalle,
    siniestro.codPostal,
    siniestro.poblacion,
    siniestro.provincia,
  ]);

  const aplicarPatch = (patch: Partial<Siniestro>) => {
    for (const [campo, valor] of Object.entries(patch)) {
      onChange?.(campo as keyof Siniestro, valor ?? "");
    }
  };

  const aplicarCandidato = (data: CandidatoDireccion) => {
    aplicarPatch(patchDireccionNormalizadaSiniestro(data));
    setDireccionLibre(
      data.direccionCompleta ||
        data.googleFormattedAddress ||
        buildDireccionLibreSiniestro({ ...siniestro, ...patchDireccionNormalizadaSiniestro(data) })
    );
    toast.success("Dirección aplicada");
  };

  const ejecutarNormalizacion = async () => {
    const texto = direccionLibre.trim();
    if (!texto) {
      toast.error("Introduce una dirección para normalizar");
      return;
    }

    setNormalizando(true);
    try {
      const data = await normalizarDireccion(texto);
      const lista = ((data as { candidates?: CandidatoDireccion[] }).candidates?.length
        ? (data as { candidates?: CandidatoDireccion[] }).candidates
        : [data]) as CandidatoDireccion[];
      setCandidatos(lista);
      if (lista.length === 1) aplicarCandidato(lista[0]);
      else toast.success(`${lista.length} direcciones encontradas. Elige la correcta.`);
    } catch (error) {
      setCandidatos([]);
      toast.error(error instanceof Error ? error.message : "No se pudo normalizar la dirección");
    } finally {
      setNormalizando(false);
    }
  };

  return (
    <div className="space-y-4">
      <NormalizadorDireccion
        direccionLibre={direccionLibre}
        onDireccionLibreChange={setDireccionLibre}
        normalizando={normalizando}
        candidatos={candidatos}
        onNormalizar={ejecutarNormalizacion}
        onAplicarCandidato={aplicarCandidato}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CampoEditable label="Vía" value={siniestro.via} onChange={(v) => onChange?.("via", v)} />
        <CampoEditable
          label="Dirección"
          value={siniestro.calle}
          onChange={(v) => onChange?.("calle", v)}
          className="sm:col-span-2"
        />
        <CampoEditable
          label="Número"
          value={siniestro.numeroCalle}
          onChange={(v) => onChange?.("numeroCalle", v)}
        />
        <CampoEditable label="Bloque" value={siniestro.bloque} onChange={(v) => onChange?.("bloque", v)} />
        <CampoEditable label="Escalera" value={siniestro.escalera} onChange={(v) => onChange?.("escalera", v)} />
        <CampoEditable label="Planta" value={siniestro.planta} onChange={(v) => onChange?.("planta", v)} />
        <CampoEditable label="Puerta" value={siniestro.puerta} onChange={(v) => onChange?.("puerta", v)} />
        <div className="sm:col-span-2 lg:col-span-4">
          <CamposLocalidadEspana
            values={{
              codigoPostal: siniestro.codPostal ?? "",
              poblacion: siniestro.poblacion ?? "",
              provincia: siniestro.provincia ?? "",
            }}
            onChange={(patch) => {
              if (patch.codigoPostal !== undefined) onChange?.("codPostal", patch.codigoPostal);
              if (patch.poblacion !== undefined) onChange?.("poblacion", patch.poblacion);
              if (patch.provincia !== undefined) onChange?.("provincia", patch.provincia);
            }}
          />
        </div>
      </div>
    </div>
  );
};
