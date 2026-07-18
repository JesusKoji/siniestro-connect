import { useEffect, useRef, useState, type ReactNode } from "react";
import { CamposLocalidadEspana } from "@/components/CamposLocalidadEspana";
import { DireccionMapaButton } from "@/components/DireccionMapaButton";
import { CalculoPreexistenciaSection } from "@/components/CalculoPreexistenciaSection";
import { CapitalesAseguradosSection } from "@/components/CapitalesAseguradosSection";
import { PreexistenciaSection } from "@/components/PreexistenciaSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Poliza } from "@/data/siniestros";
import {
  aplicarDireccionNormalizada,
  buildDireccionBusquedaMapaPoliza,
  buildDireccionLibrePoliza,
  buildDireccionNormalizadaPoliza,
  construirConsultaDesdeCatastro,
  TipoDireccionPoliza,
} from "@/lib/direccionPoliza";
import {
  CandidatoCatastro,
  CatastroDt,
  DetalleCatastroDesdeCatastro,
  enriquecerCamposCatastro,
  esConsultaCatastroPorReferencia,
  consultarDatosUsosDnprc,
  resolverSuperficieConstruidaTotalCatastro,
  etiquetaUsoParcela,
  esReferenciaParcela,
  filtrarDetallesUsosConstructivos,
  InmuebleParcelaCatastro,
  normalizarDireccionCatastro,
  OpcionParcelaCatastro,
  puedeConsultarCatastroOficial,
  sumarUsosJsonParcela,
} from "@/lib/catastro";
import {
  actualizarPoliza,
  actualizarSumatoriosCatastroPoliza,
  actualizarSumatoriosParcelaCatastroPoliza,
  guardarDetallesCatastroPoliza,
  reemplazarDetalleCatastroParcelaPoliza,
  reemplazarDetallesCatastroPoliza,
  reemplazarDetallesCatastroPorReferencia,
} from "@/lib/filemaker";
import { DireccionNormalizada, normalizarDireccion } from "@/lib/geocode";
import { textoCampo } from "@/lib/textoCampo";
import { abrirWebCatastroPoliza, reservarVentanaCatastro } from "@/lib/abrirWebCatastro";
import { Building2, ExternalLink, Loader2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Candidato = DireccionNormalizada & {
  googleFormattedAddress?: string;
  placeId?: string;
  consultaUsada?: string;
};

export type TipoSeccionPoliza = "direccion" | "preexistencia" | "seguridad";

export type SumatoriosCatastroPendientes = {
  supConstruidaTotal: number;
  usosJson?: Record<string, number>;
};

type PolizaDireccionesSectionProps = {
  poliza: Poliza;
  mode: "view" | "edit";
  onChange?: (campo: keyof Poliza, valor: string) => void;
  onApplyFields?: (campos: Partial<Poliza>) => void;
  onDetallesUsosPendientes?: (detalles: DetalleCatastroDesdeCatastro[]) => void;
  onSumatoriosCatastroPendientes?: (sumatorios: SumatoriosCatastroPendientes | null) => void;
  onInmueblesParcelaPendientes?: (payload: {
    referenciaParcela: string;
    inmuebles: InmuebleParcelaCatastro[];
  } | null) => void;
  rellenandoDireccion?: boolean;
  guardando?: boolean;
  onRellenarDesdeAsegurado?: () => void;
  distanciaSlot?: ReactNode;
};

export const PolizaDireccionesSection = ({
  poliza,
  mode,
  onChange,
  onApplyFields,
  onDetallesUsosPendientes,
  onSumatoriosCatastroPendientes,
  onInmueblesParcelaPendientes,
  rellenandoDireccion = false,
  guardando = false,
  onRellenarDesdeAsegurado,
  distanciaSlot,
}: PolizaDireccionesSectionProps) => {
  const [seccionTab, setSeccionTab] = useState<TipoSeccionPoliza>("direccion");
  const [tab, setTab] = useState<TipoDireccionPoliza>("riesgo");
  const [direccionLibre, setDireccionLibre] = useState(buildDireccionLibrePoliza(poliza, "riesgo"));
  const [normalizando, setNormalizando] = useState(false);
  const [consultandoCatastro, setConsultandoCatastro] = useState(false);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidatosCatastro, setCandidatosCatastro] = useState<CandidatoCatastro[]>([]);
  const [numerosCatastro, setNumerosCatastro] = useState<string[]>([]);

  const [detallesUsosCatastro, setDetallesUsosCatastro] = useState<DetalleCatastroDesdeCatastro[]>([]);
  const [inmuebleCatastroSeleccionado, setInmuebleCatastroSeleccionado] = useState<CandidatoCatastro | null>(
    null
  );
  const [opcionParcelaCatastro, setOpcionParcelaCatastro] = useState<OpcionParcelaCatastro | null>(null);
  const [parcelaCatastroSeleccionada, setParcelaCatastroSeleccionada] = useState<OpcionParcelaCatastro | null>(
    null
  );
  const [abriendoWebCatastro, setAbriendoWebCatastro] = useState(false);
  const usosConsultaRef = useRef<DetalleCatastroDesdeCatastro[]>([]);
  const candidatosConsultaRef = useRef<CandidatoCatastro[]>([]);
  const opcionParcelaRef = useRef<OpcionParcelaCatastro | null>(null);
  const dtConsultaRef = useRef<CatastroDt | undefined>(undefined);
  const polizaRef = useRef(poliza);
  polizaRef.current = poliza;
  const polizaClave = poliza.id || poliza.recordId || "";

  useEffect(() => {
    setDireccionLibre(buildDireccionLibrePoliza(poliza, tab));
  }, [tab, polizaClave, poliza.viaC, poliza.direccionC, poliza.numeroCalleC, poliza.codigoPostalC, poliza.poblacionC, poliza.provinciaC, poliza.via, poliza.direccion, poliza.numeroCalle, poliza.codigoPostal, poliza.poblacion, poliza.provincia]);

  useEffect(() => {
    setCandidatos([]);
    setCandidatosCatastro([]);
    setNumerosCatastro([]);
    setDetallesUsosCatastro([]);
    setInmuebleCatastroSeleccionado(null);
    setOpcionParcelaCatastro(null);
    setParcelaCatastroSeleccionada(null);
    usosConsultaRef.current = [];
    candidatosConsultaRef.current = [];
    opcionParcelaRef.current = null;
    dtConsultaRef.current = undefined;
  }, [tab, polizaClave]);

  const persistirInmueblesParcela = async (
    referenciaParcela: string,
    inmuebles: InmuebleParcelaCatastro[]
  ) => {
    if (!inmuebles.length) return;

    const idPoliza = polizaRef.current.id?.trim();
    if (!idPoliza) {
      onInmueblesParcelaPendientes?.({ referenciaParcela, inmuebles });
      return;
    }

    await reemplazarDetalleCatastroParcelaPoliza(idPoliza, referenciaParcela, inmuebles);
    onInmueblesParcelaPendientes?.(null);
  };

  const persistirDetallesUsos = async (
    detalles: DetalleCatastroDesdeCatastro[],
    opciones?: { esParcela?: boolean }
  ) => {
    if (!detalles.length) return;

    const idPoliza = polizaRef.current.id?.trim();
    if (!idPoliza) {
      onDetallesUsosPendientes?.(detalles);
      return;
    }

    const ref = detalles[0]?.referenciaCatastral?.trim();
    const esParcela =
      opciones?.esParcela || Boolean(ref && esReferenciaParcela(ref));

    if (esParcela) {
      await reemplazarDetallesCatastroPoliza(idPoliza, detalles);
      onDetallesUsosPendientes?.([]);
      return;
    }

    const mismaReferencia =
      ref && detalles.every((d) => (d.referenciaCatastral?.trim() || "") === ref);

    if (mismaReferencia) {
      await reemplazarDetallesCatastroPorReferencia(idPoliza, ref, detalles);
      onDetallesUsosPendientes?.([]);
      return;
    }

    await guardarDetallesCatastroPoliza(idPoliza, detalles);
    onDetallesUsosPendientes?.([]);
  };

  const abrirWebCatastroReferencia = async () => {
    const ventana = reservarVentanaCatastro();
    setAbriendoWebCatastro(true);
    try {
      const resultado = await abrirWebCatastroPoliza(polizaRef.current, ventana);
      if (resultado.origen === "filemaker-webviewer") {
        toast.success("Guion WebCatastro ejecutado en FileMaker");
      } else if (resultado.origen === "filemaker-data-api") {
        toast.success(
          "Guion WebCatastro enviado. Si no se abre la ventana, comprueba el guión en FileMaker o la ventana emergente del catastro."
        );
      } else {
        toast.success("Catastro abierto", {
          description: resultado.url.length > 80 ? undefined : resultado.url,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el catastro", {
        duration: 8000,
      });
    } finally {
      setAbriendoWebCatastro(false);
    }
  };

  const mensajeDetallesUsos = (detalles: DetalleCatastroDesdeCatastro[]) =>
    detalles
      .map((d) => `${etiquetaUsoParcela(d.tipoUso)} ${d.superficieConstruida} m²`)
      .join(" · ");

  const detallesUsosParaPersistir = (
    candidato: CandidatoCatastro,
    detallesConsulta?: DetalleCatastroDesdeCatastro[]
  ): DetalleCatastroDesdeCatastro[] => {
    if (detallesConsulta?.length) return detallesConsulta;
    if (usosConsultaRef.current.length) return usosConsultaRef.current;
    if (detallesUsosCatastro.length) return detallesUsosCatastro;
    return filtrarDetallesUsosConstructivos(
      candidato.detalleCatastro ? [candidato.detalleCatastro] : []
    );
  };

  const aplicarCandidato = (data: Candidato, tipo: TipoDireccionPoliza) => {
    const campos = aplicarDireccionNormalizada(poliza, data, tipo);
    if (onApplyFields) {
      onApplyFields(campos);
    } else if (onChange) {
      Object.entries(campos).forEach(([campo, valor]) => onChange(campo as keyof Poliza, String(valor ?? "")));
    }
    setDireccionLibre(
      buildDireccionLibrePoliza({ ...poliza, ...campos }, tipo) ||
        data.direccionCompleta ||
        data.googleFormattedAddress ||
        ""
    );
    toast.success(tipo === "catastro" ? "Dirección catastro aplicada" : "Dirección aplicada");
  };

  const aplicarCamposCatastro = (campos: Partial<Poliza>) => {
    if (onApplyFields) {
      onApplyFields(campos);
    } else if (onChange) {
      Object.entries(campos).forEach(([campo, valor]) =>
        onChange(campo as keyof Poliza, String(valor ?? ""))
      );
    }
    setDireccionLibre(buildDireccionLibrePoliza({ ...poliza, ...campos }, "catastro"));
  };

  const aplicarCandidatoCatastro = async (
    candidato: CandidatoCatastro,
    opciones?: { soloDireccion?: boolean; detallesUsos?: DetalleCatastroDesdeCatastro[] }
  ) => {
    const camposBase = candidato.campos ?? {};
    if (Object.keys(camposBase).length === 0) {
      toast.error("Este inmueble no trae datos de dirección aplicables");
      return;
    }

    const campos = enriquecerCamposCatastro(camposBase, dtConsultaRef.current);
    let detalles = detallesUsosParaPersistir(candidato, opciones?.detallesUsos);
    let usosJson: Record<string, number> = {};
    let superficieEdificioDnprc: string | undefined;

    const refCatastro =
      candidato.referenciaCatastral?.trim() || String(campos.catastro ?? "").trim();
    if (refCatastro) {
      try {
        const datosDnprc = await consultarDatosUsosDnprc(refCatastro);
        if (datosDnprc.detallesUsos.length) detalles = datosDnprc.detallesUsos;
        usosJson = datosDnprc.usosJson;
        superficieEdificioDnprc = datosDnprc.superficieEdificio;
      } catch {
        // Si falla DNPRC, se intenta guardar los usos ya calculados en la consulta previa.
      }
    }

    detalles = filtrarDetallesUsosConstructivos(detalles);
    const calcularSupTotal = () =>
      resolverSuperficieConstruidaTotalCatastro(
        usosJson,
        detalles,
        superficieEdificioDnprc ?? candidato.detalleCatastro?.superficieConstruida
      );
    let supConstruidaTotal = calcularSupTotal();
    usosConsultaRef.current = detalles;
    setDetallesUsosCatastro(detalles);

    aplicarCamposCatastro(campos);
    setInmuebleCatastroSeleccionado(candidato);
    setParcelaCatastroSeleccionada(null);
    setCandidatosCatastro([]);
    setNumerosCatastro([]);

    const guardarSumatorios = async (base: Poliza): Promise<Poliza> => {
      supConstruidaTotal = calcularSupTotal();
      if (supConstruidaTotal <= 0) {
        toast.warning(
          "No se pudo calcular la superficie construida total desde el catastro. Revisa la consulta o la referencia."
        );
        return base;
      }

      const sumatorios = {
        supConstruidaTotal,
        usosJson: Object.keys(usosJson).length ? usosJson : undefined,
      };

      const recordId = textoCampo(base.recordId) || textoCampo(polizaRef.current.recordId);
      const polizaConRecord = recordId ? { ...base, recordId } : base;

      if (recordId) {
        const guardada = await actualizarSumatoriosCatastroPoliza(polizaConRecord, sumatorios);
        onApplyFields?.(guardada);
        return guardada;
      }

      onSumatoriosCatastroPendientes?.({
        supConstruidaTotal,
        usosJson,
      });
      const supTexto = String(supConstruidaTotal);
      onApplyFields?.({ supConstruidaTotal: supTexto, totalSuperficie: supTexto });
      toast.warning(
        `Superficie calculada (${supTexto} m²). Se guardará en FileMaker al guardar la póliza.`
      );
      return { ...base, supConstruidaTotal: supTexto, totalSuperficie: supTexto };
    };

    try {
      let guardada: Poliza = {
        ...polizaRef.current,
        ...campos,
        ...(supConstruidaTotal > 0 ? { supConstruidaTotal: String(supConstruidaTotal) } : {}),
      };

      if (guardada.recordId) {
        guardada = await actualizarPoliza(guardada);
      }

      if (opciones?.soloDireccion) {
        guardada = await guardarSumatorios(guardada);
        polizaRef.current = guardada;
        toast.success("Dirección catastro aplicada");
        return;
      }

      const idPoliza = guardada.id?.trim();
      if (detalles.length) {
        if (!idPoliza) {
          guardada = await guardarSumatorios(guardada);
          polizaRef.current = guardada;
          onDetallesUsosPendientes?.(detalles);
          toast.success(
            `Inmueble aplicado. Los usos se guardarán al guardar la póliza: ${mensajeDetallesUsos(detalles)}`
          );
          return;
        }

        await persistirDetallesUsos(detalles);
      }

      guardada = await guardarSumatorios(guardada);
      polizaRef.current = guardada;

      if (detalles.length) {
        toast.success(
          `Inmueble aplicado. Sup. total ${supConstruidaTotal} m². Usos: ${mensajeDetallesUsos(detalles)}`
        );
        onInmueblesParcelaPendientes?.(null);
        return;
      }

      toast.success(
        supConstruidaTotal > 0
          ? `Inmueble aplicado: ${candidato.etiqueta} · ${supConstruidaTotal} m²`
          : `Inmueble aplicado: ${candidato.etiqueta}`
      );
      onInmueblesParcelaPendientes?.(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo aplicar el inmueble del catastro"
      );
    }
  };

  const aplicarParcelaCatastro = async (opcion: OpcionParcelaCatastro) => {
    const campos = enriquecerCamposCatastro(
      { ...opcion.campos, catastro: opcion.referenciaParcela },
      dtConsultaRef.current
    );
    const detalles = filtrarDetallesUsosConstructivos(opcion.detallesUsosAgregados);

    usosConsultaRef.current = detalles;
    setDetallesUsosCatastro(detalles);
    aplicarCamposCatastro(campos);
    setParcelaCatastroSeleccionada(opcion);
    setInmuebleCatastroSeleccionado(null);
    setCandidatosCatastro([]);
    setNumerosCatastro([]);

    const polizaActual = { ...polizaRef.current, ...campos };

    const usosParcelaJson = sumarUsosJsonParcela(
      opcion.inmuebles.map((inmueble) => inmueble.usosJson ?? {})
    );
    const supTotal = opcion.inmuebles.reduce(
      (total, inmueble) => total + (inmueble.superficieConstruidaTotal ?? 0),
      0
    );

    try {
      if (polizaActual.recordId) {
        let guardada = await actualizarPoliza(polizaActual);
        guardada = await actualizarSumatoriosParcelaCatastroPoliza(
          guardada,
          usosParcelaJson,
          supTotal
        );
        polizaRef.current = guardada;
        if (onApplyFields) {
          onApplyFields(guardada);
        }
      }

      const idPoliza = polizaRef.current.id?.trim();
      if (detalles.length) {
        if (!idPoliza) {
          onDetallesUsosPendientes?.(detalles);
          onInmueblesParcelaPendientes?.({
            referenciaParcela: opcion.referenciaParcela,
            inmuebles: opcion.inmuebles,
          });
          toast.success(
            `Parcela aplicada. Los usos e inmuebles se guardarán al guardar la póliza: ${mensajeDetallesUsos(detalles)}`
          );
          return;
        }

        await persistirDetallesUsos(detalles, { esParcela: true });
        await persistirInmueblesParcela(opcion.referenciaParcela, opcion.inmuebles);
        toast.success(
          `Parcela catastral aplicada. Usos totales guardados: ${mensajeDetallesUsos(detalles)}`
        );
        return;
      }

      toast.success(`Parcela catastral aplicada: ${opcion.referenciaParcela}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo aplicar la parcela catastral"
      );
    }
  };

  const consultarCatastro = async () => {
    setConsultandoCatastro(true);
    setCandidatosCatastro([]);
    setNumerosCatastro([]);
    setInmuebleCatastroSeleccionado(null);
    setParcelaCatastroSeleccionada(null);
    try {
      const resultado = await normalizarDireccionCatastro(poliza);
      dtConsultaRef.current = resultado.dtConsulta;
      candidatosConsultaRef.current = resultado.candidatos;
      opcionParcelaRef.current = resultado.opcionParcela ?? null;
      setOpcionParcelaCatastro(resultado.opcionParcela ?? null);
      setCandidatosCatastro(resultado.candidatos);
      setNumerosCatastro(resultado.numerosAlternativos);
      const usosFinca = filtrarDetallesUsosConstructivos(resultado.detallesUsos);
      usosConsultaRef.current = usosFinca;
      setDetallesUsosCatastro(usosFinca);

      if (resultado.opcionParcela) {
        toast.success(
          "Elige la parcela catastral completa (finca) o un inmueble concreto de la lista."
        );
      } else if (resultado.candidatos.length === 1) {
        await aplicarCandidatoCatastro(resultado.candidatos[0], { detallesUsos: usosFinca });
      } else if (resultado.candidatos.length > 1) {
        toast.success(
          `${resultado.candidatos.length} inmuebles encontrados. Elige uno; al seleccionar se cargarán los usos detallados del catastro.`
        );
      } else if (resultado.errores.length) {
        toast.error(resultado.errores.join(". "));
      } else {
        toast.error("El catastro no devolvió una dirección aplicable");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo consultar el catastro");
    } finally {
      setConsultandoCatastro(false);
    }
  };

  const normalizarCatastroPestana = async () => {
    if (puedeConsultarCatastroOficial(poliza)) {
      await consultarCatastro();
      return;
    }

    const consulta = construirConsultaDesdeCatastro(poliza) || direccionLibre;
    await ejecutarNormalizacion("catastro", consulta);
  };

  const ejecutarNormalizacion = async (tipo: TipoDireccionPoliza, consulta?: string) => {
    const texto = (consulta ?? direccionLibre).trim();
    if (!texto) {
      toast.error("Introduce o completa una dirección para normalizar");
      return;
    }

    setNormalizando(true);
    try {
      const data = await normalizarDireccion(texto);
      const lista = ((data as { candidates?: Candidato[] }).candidates?.length
        ? (data as { candidates?: Candidato[] }).candidates
        : [data]) as Candidato[];
      setCandidatos(lista);
      if (lista.length === 1) aplicarCandidato(lista[0], tipo);
      else toast.success(`${lista.length} direcciones encontradas. Elige la correcta.`);
    } catch (error) {
      setCandidatos([]);
      toast.error(error instanceof Error ? error.message : "No se pudo normalizar la dirección");
    } finally {
      setNormalizando(false);
    }
  };

  return (
    <section className="rounded-3xl border border-border/60 bg-background/70 p-5">
      <Tabs
        value={seccionTab}
        onValueChange={(value) => setSeccionTab(value as TipoSeccionPoliza)}
      >
        <TabsList className="flex h-auto w-full flex-wrap items-center justify-start gap-2 bg-transparent p-0">
          <TabsTrigger
            value="direccion"
            className="rounded-lg px-2 py-1 text-base font-semibold text-foreground data-[state=active]:bg-muted data-[state=inactive]:text-foreground"
          >
            Dirección
          </TabsTrigger>
          <TabsTrigger
            value="preexistencia"
            className="rounded-lg px-3 py-1 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
          >
            Preexistencia
          </TabsTrigger>
          <TabsTrigger
            value="seguridad"
            className="rounded-lg px-3 py-1 text-sm text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
          >
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="direccion" className="mt-4">
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as TipoDireccionPoliza)}
          >
            <TabsList className="h-11 rounded-xl bg-muted p-1">
              <TabsTrigger value="riesgo" className="rounded-lg px-4">
                Riesgo
              </TabsTrigger>
              <TabsTrigger value="catastro" className="rounded-lg px-4">
                Catastro
              </TabsTrigger>
            </TabsList>

        <TabsContent value="riesgo" className="mt-4 space-y-4">
          {mode === "edit" ? (
            <NormalizadorDireccion
              direccionLibre={direccionLibre}
              onDireccionLibreChange={setDireccionLibre}
              normalizando={normalizando}
              candidatos={candidatos}
              onNormalizar={() => ejecutarNormalizacion("riesgo")}
              onAplicarCandidato={(c) => aplicarCandidato(c, "riesgo")}
              extraActions={
                onRellenarDesdeAsegurado ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onRellenarDesdeAsegurado}
                    disabled={rellenandoDireccion || guardando || !poliza.idAsegurado}
                    className="h-11 rounded-xl"
                  >
                    {rellenandoDireccion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Rellenar dirección asegurado
                  </Button>
                ) : null
              }
            />
          ) : null}

          <GridDireccion
            poliza={poliza}
            tipo="riesgo"
            mode={mode}
            onChange={onChange}
            extra={distanciaSlot}
          />
        </TabsContent>

        <TabsContent value="catastro" className="mt-4 space-y-4">
          {mode === "edit" ? (
            <>
              <NormalizadorDireccion
                direccionLibre={direccionLibre}
                onDireccionLibreChange={setDireccionLibre}
                normalizando={normalizando}
                candidatos={candidatos}
                onNormalizar={normalizarCatastroPestana}
                onAplicarCandidato={(c) => aplicarCandidato(c, "catastro")}
                descripcion={
                  puedeConsultarCatastroOficial(poliza)
                    ? "Con referencia catastral o dirección completa consulta el catastro oficial (código postal, usos y superficies)."
                    : "Normalización aproximada con Google Maps. Para usos y superficies usa referencia catastral o consulta catastro."
                }
              />
              <div className="rounded-2xl border border-dashed border-border/80 bg-card p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">Consulta catastro oficial</h4>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {esConsultaCatastroPorReferencia(poliza)
                    ? "Se consultará por la referencia catastral indicada. Puedes elegir la parcela completa (14 caracteres) o un inmueble concreto."
                    : "Usa provincia, población, vía/dirección y número. Para polígonos u otras direcciones difíciles, introduce solo la referencia catastral."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={consultarCatastro}
                  disabled={consultandoCatastro || normalizando}
                  className="mt-3 h-11 rounded-xl"
                >
                  {consultandoCatastro ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Building2 className="mr-2 h-4 w-4" />
                  )}
                  Consultar catastro
                </Button>
                {numerosCatastro.length > 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Números cercanos en esa vía: {numerosCatastro.join(", ")}
                  </p>
                ) : null}
                {parcelaCatastroSeleccionada ? (
                  <div className="mt-3 rounded-xl border border-accent/40 bg-accent/10 p-3">
                    <p className="text-sm font-semibold text-foreground">Parcela catastral seleccionada</p>
                    <p className="mt-1 text-sm">{parcelaCatastroSeleccionada.etiqueta}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      RC parcela: {parcelaCatastroSeleccionada.referenciaParcela}
                    </p>
                    {detallesUsosCatastro.length ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Usos totales: {mensajeDetallesUsos(detallesUsosCatastro)}
                      </p>
                    ) : null}
                    {parcelaCatastroSeleccionada.inmuebles.length ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Inmuebles en parcela: {parcelaCatastroSeleccionada.inmuebles.length}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 rounded-lg px-2 text-xs"
                      onClick={() => {
                        setParcelaCatastroSeleccionada(null);
                        setOpcionParcelaCatastro(opcionParcelaRef.current);
                        setCandidatosCatastro(candidatosConsultaRef.current);
                      }}
                    >
                      Elegir parcela u otro inmueble
                    </Button>
                  </div>
                ) : inmuebleCatastroSeleccionado ? (
                  <div className="mt-3 rounded-xl border border-accent/40 bg-accent/10 p-3">
                    <p className="text-sm font-semibold text-foreground">Inmueble seleccionado</p>
                    <p className="mt-1 text-sm">{inmuebleCatastroSeleccionado.etiqueta}</p>
                    {detallesUsosCatastro.length ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Usos: {mensajeDetallesUsos(detallesUsosCatastro)}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 rounded-lg px-2 text-xs"
                      onClick={() => {
                        setInmuebleCatastroSeleccionado(null);
                        setOpcionParcelaCatastro(opcionParcelaRef.current);
                        setCandidatosCatastro(candidatosConsultaRef.current);
                      }}
                    >
                      Elegir otro inmueble
                    </Button>
                  </div>
                ) : opcionParcelaCatastro || candidatosCatastro.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {opcionParcelaCatastro ? (
                      <>
                        <p className="text-sm font-semibold">Parcela catastral — elige para asegurar la finca</p>
                        <button
                          type="button"
                          disabled={consultandoCatastro}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void aplicarParcelaCatastro(opcionParcelaCatastro);
                          }}
                          className="w-full rounded-xl border border-primary/40 bg-primary/5 p-3 text-left transition-smooth hover:border-primary/60 hover:bg-primary/10"
                        >
                          <p className="text-sm font-semibold">{opcionParcelaCatastro.etiqueta}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            RC parcela: {opcionParcelaCatastro.referenciaParcela}
                          </p>
                          {opcionParcelaCatastro.inmuebles.length > 1 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {opcionParcelaCatastro.inmuebles.length} inmuebles en la parcela
                            </p>
                          ) : null}
                        </button>
                      </>
                    ) : null}
                    {candidatosCatastro.length > 0 ? (
                      <>
                        <p className="text-sm font-semibold">Inmuebles encontrados — elige uno</p>
                        {candidatosCatastro.map((candidato) => (
                      <button
                        key={candidato.id}
                        type="button"
                        disabled={consultandoCatastro}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const usos =
                            detallesUsosCatastro.length > 0
                              ? detallesUsosCatastro
                              : usosConsultaRef.current;
                          void aplicarCandidatoCatastro(candidato, { detallesUsos: usos });
                        }}
                        className="w-full rounded-xl border border-border/60 bg-background p-3 text-left transition-smooth hover:border-accent/60 hover:bg-accent/10"
                      >
                        <p className="text-sm font-semibold">{candidato.etiqueta}</p>
                        {candidato.detalleCatastro?.tipoUso || candidato.detalleCatastro?.superficieConstruida ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[candidato.detalleCatastro.tipoUso, candidato.detalleCatastro.superficieConstruida ? `${candidato.detalleCatastro.superficieConstruida} m²` : ""]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                        {candidato.referenciaCatastral ? (
                          <button
                            type="button"
                            disabled={abriendoWebCatastro}
                            title="Abrir sede del catastro (usa el campo Catastro de la póliza)"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void abrirWebCatastroReferencia();
                            }}
                            className="mt-1 text-left text-xs text-primary underline-offset-2 hover:underline disabled:opacity-50"
                          >
                            RC: {candidato.referenciaCatastral}
                          </button>
                        ) : null}
                      </button>
                    ))}
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <GridDireccion
            poliza={poliza}
            tipo="catastro"
            mode={mode}
            onChange={onChange}
            onAbrirWebCatastro={() => void abrirWebCatastroReferencia()}
            abriendoWebCatastro={abriendoWebCatastro}
          />
        </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="preexistencia" className="mt-4">
          <PreexistenciaSection poliza={poliza} />
          <CapitalesAseguradosSection poliza={poliza} onChange={onChange} />
          <CalculoPreexistenciaSection poliza={poliza} onChange={onChange} />
        </TabsContent>

        <TabsContent value="seguridad" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CampoTextoPoliza
              label="Medidas PCI"
              campo="medidasPci"
              poliza={poliza}
              mode={mode}
              onChange={onChange}
              placeholder="Medidas de protección contra incendios"
            />
            <CampoTextoPoliza
              label="Medidas robo"
              campo="medidasRobo"
              poliza={poliza}
              mode={mode}
              onChange={onChange}
              placeholder="Medidas de protección contra robo"
            />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
};

const CampoTextoPoliza = ({
  label,
  campo,
  poliza,
  mode,
  onChange,
  placeholder,
}: {
  label: string;
  campo: keyof Poliza;
  poliza: Poliza;
  mode: "view" | "edit";
  onChange?: (campo: keyof Poliza, valor: string) => void;
  placeholder?: string;
}) => {
  const valor = textoCampo(poliza[campo]);

  if (mode === "view") {
    return <InfoCampoVista label={label} value={valor} />;
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={valor}
        onChange={(e) => onChange?.(campo, e.target.value)}
        placeholder={placeholder}
        className="min-h-[96px] rounded-xl"
      />
    </div>
  );
};

const NormalizadorDireccion = ({
  direccionLibre,
  onDireccionLibreChange,
  normalizando,
  candidatos,
  onNormalizar,
  onAplicarCandidato,
  extraActions,
  descripcion = "Si hay varias coincidencias, selecciona la dirección correcta de la lista.",
}: {
  direccionLibre: string;
  onDireccionLibreChange: (value: string) => void;
  normalizando: boolean;
  candidatos: Candidato[];
  onNormalizar: () => void;
  onAplicarCandidato: (candidato: Candidato) => void;
  extraActions?: ReactNode;
  descripcion?: string;
}) => (
  <div className="rounded-2xl border border-dashed border-border/80 bg-card p-4">
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <h4 className="font-semibold">Normalizar dirección</h4>
    </div>
    <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:flex-wrap">
      <Input
        value={direccionLibre}
        onChange={(e) => onDireccionLibreChange(e.target.value)}
        placeholder="Ej. Calle Campillo 89, Cheste"
        className="h-11 min-w-[240px] flex-1 rounded-xl"
      />
      <Button
        type="button"
        variant="outline"
        onClick={onNormalizar}
        disabled={normalizando}
        className="h-11 rounded-xl"
      >
        {normalizando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        Normalizar
      </Button>
      {extraActions}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{descripcion}</p>
    {candidatos.length > 1 ? (
      <div className="mt-3 space-y-2">
        <p className="text-sm font-semibold">Direcciones encontradas</p>
        {candidatos.map((candidato, index) => (
          <button
            key={candidato.placeId || `${candidato.direccionCompleta}-${index}`}
            type="button"
            onClick={() => onAplicarCandidato(candidato)}
            className="w-full rounded-xl border border-border/60 bg-background p-3 text-left transition-smooth hover:border-accent/60 hover:bg-accent/10"
          >
            <p className="text-sm font-semibold">
              {candidato.direccionCompleta || candidato.googleFormattedAddress}
            </p>
            {candidato.googleFormattedAddress && candidato.googleFormattedAddress !== candidato.direccionCompleta ? (
              <p className="mt-1 text-xs text-muted-foreground">{candidato.googleFormattedAddress}</p>
            ) : null}
          </button>
        ))}
      </div>
    ) : null}
  </div>
);

const CAMPOS_LOCALIDAD_RIESGO = ["codigoPostal", "poblacion", "provincia"] as const;
const CAMPOS_LOCALIDAD_CATASTRO = ["codigoPostalC", "poblacionC", "provinciaC"] as const;

const GridDireccion = ({
  poliza,
  tipo,
  mode,
  onChange,
  extra,
  onAbrirWebCatastro,
  abriendoWebCatastro = false,
}: {
  poliza: Poliza;
  tipo: TipoDireccionPoliza;
  mode: "view" | "edit";
  onChange?: (campo: keyof Poliza, valor: string) => void;
  extra?: ReactNode;
  onAbrirWebCatastro?: () => void;
  abriendoWebCatastro?: boolean;
}) => {
  const fields: { label: string; campo: keyof Poliza; className?: string }[] =
    tipo === "catastro"
      ? [
          { label: "Referencia catastral", campo: "catastro", className: "xl:col-span-2" },
          { label: "Nombre vía", campo: "nombreViaC", className: "xl:col-span-2" },
          { label: "Vía", campo: "viaC" },
          { label: "Dirección", campo: "direccionC", className: "xl:col-span-2" },
          { label: "Número", campo: "numeroCalleC" },
          { label: "Bloque", campo: "bloqueC" },
          { label: "Escalera", campo: "escaleraC" },
          { label: "Planta", campo: "plantaC" },
          { label: "Puerta", campo: "puertaC" },
          { label: "Año construcción", campo: "anoConstruccion" },
        ]
      : [
          { label: "Vía", campo: "via" },
          { label: "Dirección", campo: "direccion", className: "xl:col-span-2" },
          { label: "Número", campo: "numeroCalle" },
          { label: "Bloque", campo: "bloque" },
          { label: "Escalera", campo: "escalera" },
          { label: "Planta", campo: "planta" },
          { label: "Puerta", campo: "puerta" },
        ];

  const camposLocalidad = tipo === "catastro" ? CAMPOS_LOCALIDAD_CATASTRO : CAMPOS_LOCALIDAD_RIESGO;
  const localidadValues = {
    codigoPostal: textoCampo(poliza[camposLocalidad[0]]),
    poblacion: textoCampo(poliza[camposLocalidad[1]]),
    provincia: textoCampo(poliza[camposLocalidad[2]]),
  };

  const aplicarLocalidad = (patch: Partial<typeof localidadValues>) => {
    if (patch.codigoPostal !== undefined) onChange?.(camposLocalidad[0], patch.codigoPostal);
    if (patch.poblacion !== undefined) onChange?.(camposLocalidad[1], patch.poblacion);
    if (patch.provincia !== undefined) onChange?.(camposLocalidad[2], patch.provincia);
  };

  if (mode === "view") {
    const direccionMapa = buildDireccionNormalizadaPoliza(poliza, tipo);
    const direccionBusquedaMapa = buildDireccionBusquedaMapaPoliza(poliza, tipo);
    const esCatastro = tipo === "catastro";

    return (
      <DireccionMapaButton
        layout={esCatastro ? "address-left-meta-right" : "stacked"}
        label={esCatastro ? "Dirección catastro" : "Dirección del riesgo"}
        dialogTitle={esCatastro ? "Ubicación catastro" : "Ubicación del riesgo"}
        subtitle={poliza.numeroPoliza ? `Póliza ${poliza.numeroPoliza}` : undefined}
        address={direccionMapa}
        searchAddress={direccionBusquedaMapa}
        metaItems={
          esCatastro
            ? [
                {
                  label: "Referencia catastral",
                  value: String(poliza.catastro ?? ""),
                  title: "Abrir sede del catastro (guión WebCatastro)",
                  onClick: textoCampo(poliza.catastro) ? () => onAbrirWebCatastro?.() : undefined,
                },
                { label: "Año construcción", value: String(poliza.anoConstruccion ?? "") },
              ]
            : undefined
        }
        footer={
          !esCatastro ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
              <InfoCampoVista
                className="min-w-0 flex-1"
                label="Descripción"
                value={textoCampo(poliza.descripcion)}
              />
              <div className="shrink-0 sm:ml-auto sm:min-w-[120px] sm:text-right">{extra}</div>
            </div>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {fields.map(({ label, campo, className = "" }) => {
          const valor = textoCampo(poliza[campo]);
          const esRefCatastro = tipo === "catastro" && campo === "catastro";

          return (
            <div key={campo} className={`space-y-2 ${className}`}>
              <Label>{label}</Label>
              {esRefCatastro ? (
                <Input
                  value={valor}
                  onChange={(e) => onChange?.(campo, e.target.value)}
                  placeholder="Ej. 8744402XJ9784S0001DW"
                  className="h-11 rounded-xl font-mono text-sm"
                />
              ) : (
                <Input
                  value={valor}
                  onChange={(e) => onChange?.(campo, e.target.value)}
                  className="h-11 rounded-xl"
                />
              )}
              {esRefCatastro && valor ? (
                <button
                  type="button"
                  disabled={abriendoWebCatastro}
                  title="Abrir sede del catastro (guión WebCatastro)"
                  onClick={() => onAbrirWebCatastro?.()}
                  className="inline-flex max-w-full items-center gap-1.5 break-all text-left font-mono text-xs text-primary underline-offset-2 hover:underline disabled:opacity-50"
                >
                  {abriendoWebCatastro ? (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  )}
                  Abrir {valor} en catastro
                </button>
              ) : null}
            </div>
          );
        })}
        {extra}
      </div>
      <CamposLocalidadEspana values={localidadValues} onChange={aplicarLocalidad} className="xl:col-span-4" />
    </div>
  );
};

const InfoCampoVista = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string;
  className?: string;
}) => (
  <div className={className}>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 break-words text-sm font-semibold leading-snug">{value || "-"}</p>
  </div>
);

