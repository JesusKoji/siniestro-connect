import { DateField } from "@/components/DateField";
import {
  PolizaDireccionesSection,
  type SumatoriosCatastroPendientes,
} from "@/components/PolizaDireccionesSection";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Asegurado, Compania, Poliza, Ramo, Siniestro } from "@/data/siniestros";
import {
  actualizarPoliza,
  actualizarSumatoriosCatastroPoliza,
  buscarAsegurados,
  buscarPolizas,
  calcularYGuardarDistanciaPoliza,
  crearPoliza,
  guardarDetallesCatastroPoliza,
  invalidarCacheMetadataPolizas,
  listarCompanias,
  listarRamosPorCompania,
  obtenerAsegurado,
  obtenerPoliza,
  obtenerPolizasAsegurado,
  obtenerSiniestrosAsegurado,
  polizaCoincideTexto,
  reemplazarDetalleCatastroParcelaPoliza,
  reemplazarDetallesCatastroPoliza,
  reemplazarDetallesCatastroPorReferencia,
} from "@/lib/filemaker";
import {
  esReferenciaParcela,
  filtrarDetallesUsosConstructivos,
  resolverSuperficieConstruidaTotalCatastro,
  sumarUsosJsonParcela,
  type DetalleCatastroDesdeCatastro,
  type InmuebleParcelaCatastro,
} from "@/lib/catastro";
import { formatFecha } from "@/lib/fechas";
import { prepararPolizaParaFormulario } from "@/lib/normalizarPoliza";
import { textoCampo } from "@/lib/textoCampo";
import { Building2, ChevronDown, Edit3, FileText, Loader2, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type ModoFormulario = "vista" | "edicion" | "nuevo";

const polizaVacia: Poliza = {
  id: "",
  recordId: "",
  idAsegurado: "",
  idRamo: "",
  idCompania: "",
  asegurado: "",
  compania: "",
  numeroPoliza: "",
  ramo: "",
  tipoRamo: "",
  direccionCompleta: "",
  via: "",
  direccion: "",
  numeroCalle: "",
  bloque: "",
  escalera: "",
  planta: "",
  puerta: "",
  codigoPostal: "",
  poblacion: "",
  provincia: "",
  nombreViaC: "",
  viaC: "",
  direccionC: "",
  numeroCalleC: "",
  bloqueC: "",
  escaleraC: "",
  plantaC: "",
  puertaC: "",
  codigoPostalC: "",
  poblacionC: "",
  provinciaC: "",
  catastro: "",
  anoConstruccion: "",
  totalSuperficie: "",
  supConstruidaTotal: "",
  antiguedad: "",
  fechaEfecto: "",
  nSiniestros: "",
  agente: "",
  telefonoAgente: "",
  emailAgente: "",
  descripcion: "",
  informacion: "",
  comentarios: "",
  medidasPci: "",
  medidasRobo: "",
  ctePoliza: "",
  ctdoPoliza: "",
  mobYMaqPoliza: "",
  existenciasPoliza: "",
  embarcacion: "",
  capitalPemPoliza: "",
  capitalRcPoliza: "",
  facturacionDeclarada: "",
  propietario: "",
  totalContinente: "",
  cteVn: "",
  depreciaCte: "",
  cteVr: "",
  primerRiesgo: "0",
  coefInfraCte: "",
  coefInfraCteVr: "",
  infraseguroCrawfordCte: "",
  ctdoVn: "",
  depreciaCtdo: "",
  ctdoVr: "",
  coefInfraCtdo: "",
  coefInfraCtdoVr: "",
  infraseguroCrawfordCtdo: "",
  mobYMaqVn: "",
  depreciaMobYMaq: "",
  mobYMaqVr: "",
  coefInfraMobYMaqVn: "",
  coefInfraMobYMaqVr: "",
  infraseguroCrawfordMob: "",
  existenciasReales: "",
  coefInfraExistencias: "",
  infraseguroCrawfordExist: "",
  embarcacionVr: "",
  coefInfraEmbarcacion: "",
  capitalPem: "",
  facturacionReal: "",
  distancia: "",
  latitud: "",
  longitud: "",
};

export const PolizasApp = () => {
  const { id, idAsegurado } = useParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [asegurados, setAsegurados] = useState<Asegurado[]>([]);
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [seleccionada, setSeleccionada] = useState<Poliza | null>(null);
  const [formData, setFormData] = useState<Poliza>(polizaVacia);
  const [modo, setModo] = useState<ModoFormulario>("vista");
  const [guardando, setGuardando] = useState(false);
  const [rellenandoDireccion, setRellenandoDireccion] = useState(false);
  const [calculandoDistancia, setCalculandoDistancia] = useState(false);
  const [detallesUsosPendientes, setDetallesUsosPendientes] = useState<DetalleCatastroDesdeCatastro[]>([]);
  const [sumatoriosCatastroPendientes, setSumatoriosCatastroPendientes] =
    useState<SumatoriosCatastroPendientes | null>(null);
  const [inmueblesParcelaPendientes, setInmueblesParcelaPendientes] = useState<{
    referenciaParcela: string;
    inmuebles: InmuebleParcelaCatastro[];
  } | null>(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [siniestrosAbiertos, setSiniestrosAbiertos] = useState(false);

  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [companias, setCompanias] = useState<Compania[]>([]);
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [loadingRamos, setLoadingRamos] = useState(false);

  const cargarPolizaPorId = async (polizaId: string) => {
    setLoadingBusqueda(true);
    setMostrarResultados(false);
    setSiniestrosAbiertos(false);

    try {
      const encontrada = await obtenerPoliza(polizaId);

      if (!encontrada) {
        toast.error("No se encontró la póliza");
        return;
      }

      setPolizas([encontrada]);
      setSeleccionada(encontrada);
      setFormData(prepararPolizaParaFormulario(polizaVacia, encontrada));
      setModo("vista");

      const idAsegurado = encontrada.idAsegurado;

      if (idAsegurado) {
        const [asegurado, sins] = await Promise.all([
          obtenerAsegurado(idAsegurado),
          obtenerSiniestrosAsegurado(idAsegurado),
        ]);

        setAsegurados(asegurado ? [asegurado] : []);
        setSiniestros(sins);
      } else {
        setAsegurados([]);
        setSiniestros([]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la póliza"
      );
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const cargarNuevaPoliza = async (aseguradoId: string) => {
    setLoadingBusqueda(true);
    setMostrarResultados(false);
    setSiniestrosAbiertos(false);
    setSeleccionada(null);
    setPolizas([]);
    setSiniestros([]);
    setModo("nuevo");

    try {
      const asegurado = await obtenerAsegurado(aseguradoId);
      if (asegurado) setAsegurados([asegurado]);
      setFormData(
        prepararPolizaParaFormulario(polizaVacia, {
          recordId: "",
          id: "",
          idAsegurado: asegurado?.id || aseguradoId,
          asegurado: asegurado?.displayName || "",
        })
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar la nueva póliza");
    } finally {
      setLoadingBusqueda(false);
    }
  };

  useEffect(() => {
    if (idAsegurado) {
      cargarNuevaPoliza(idAsegurado);
      return;
    }

    if (id) cargarPolizaPorId(id);
  }, [id, idAsegurado]);

  useEffect(() => {
    if (modo === "vista") return;
    if (companias.length) return;
    setLoadingCombos(true);
    listarCompanias(200)
      .then(setCompanias)
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las compañías"))
      .finally(() => setLoadingCombos(false));
  }, [modo, companias.length]);

  useEffect(() => {
    if (modo === "vista") return;
    const idCompania = formData.idCompania;
    if (!idCompania) {
      setRamos([]);
      return;
    }

    let cancelled = false;
    setLoadingRamos(true);
    listarRamosPorCompania(idCompania, 200)
      .then((rs) => {
        if (!cancelled) setRamos(rs);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudieron cargar los ramos");
          setRamos([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRamos(false);
      });

    return () => {
      cancelled = true;
    };
  }, [modo, formData.idCompania]);

  const buscar = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!query.trim()) {
      return toast.error(
        "Introduce número de póliza, asegurado, compañía o ramo"
      );
    }

    setLoadingBusqueda(true);

    try {
      const q = query.trim();
      const [porPoliza, aseg] = await Promise.all([
        buscarPolizas(q),
        buscarAsegurados(q),
      ]);

      const listas = await Promise.all(
        aseg.map((a) => obtenerPolizasAsegurado(a.id))
      );
      const porAsegurado = listas.flat();

      const porId = new Map<string, Poliza>();
      for (const poliza of [...porPoliza, ...porAsegurado]) {
        const clave = poliza.id || poliza.recordId || poliza.numeroPoliza;
        if (clave) porId.set(clave, poliza);
      }

      const filtradas = Array.from(porId.values()).filter((p) =>
        polizaCoincideTexto(p, q)
      );

      const idsAsegurado = [
        ...new Set(filtradas.map((p) => p.idAsegurado).filter(Boolean)),
      ];
      const aseguradosPorPoliza = (
        await Promise.all(idsAsegurado.map((id) => obtenerAsegurado(id)))
      ).filter((a): a is Asegurado => Boolean(a));

      const aseguradosMap = new Map<string, Asegurado>();
      for (const a of [...aseg, ...aseguradosPorPoliza]) {
        if (a.id) aseguradosMap.set(a.id, a);
      }

      setAsegurados(Array.from(aseguradosMap.values()));
      setPolizas(filtradas);
      setMostrarResultados(true);

      if (filtradas.length === 0) {
        toast.error("No se encontraron pólizas");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron buscar pólizas"
      );
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const seleccionarPoliza = async (poliza: Poliza) => {
    setSeleccionada(poliza);
    setFormData(prepararPolizaParaFormulario(polizaVacia, poliza));
    setModo("vista");
    setMostrarResultados(false);
    setSiniestrosAbiertos(false);

    if (poliza.idAsegurado) {
      try {
        const [asegurado, sins] = await Promise.all([
          obtenerAsegurado(poliza.idAsegurado),
          obtenerSiniestrosAsegurado(poliza.idAsegurado),
        ]);

        if (asegurado) {
          setAsegurados((actuales) =>
            actuales.some((a) => a.id === asegurado.id)
              ? actuales
              : [...actuales, asegurado]
          );
        }

        setSiniestros(sins);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los datos relacionados"
        );
      }
    } else {
      setSiniestros([]);
    }
  };

  const aseguradoNombre = (p?: Poliza | null) => {
    const idAsegurado = p?.idAsegurado;

    return (
      p?.asegurado ||
      asegurados.find((a) => a.id === idAsegurado)?.displayName ||
      ""
    );
  };

  const siniestrosPoliza = siniestros.filter(
    (s) => !seleccionada?.id || s.idPoliza === seleccionada.id
  );

  const tituloSecundario = useMemo(() => {
    if (modo === "nuevo") return "Crea una póliza vinculada al asegurado.";
    return "Busca una póliza concreta y edita su ficha.";
  }, [modo]);

  const editar = () => {
    if (!seleccionada) return;
    invalidarCacheMetadataPolizas();
    setDetallesUsosPendientes([]);
    setSumatoriosCatastroPendientes(null);
    setInmueblesParcelaPendientes(null);
    setFormData(prepararPolizaParaFormulario(polizaVacia, seleccionada));
    setModo("edicion");
  };

  const cancelar = () => {
    setDetallesUsosPendientes([]);
    setInmueblesParcelaPendientes(null);
    if (seleccionada) {
      setFormData(prepararPolizaParaFormulario(polizaVacia, seleccionada));
      setModo("vista");
      return;
    }
    setFormData(polizaVacia);
    setModo("vista");
  };

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.idAsegurado) return toast.error("Falta el asegurado relacionado");

    setGuardando(true);
    try {
      let guardada = modo === "nuevo"
        ? await crearPoliza(formData)
        : await actualizarPoliza(formData);

      const idPoliza = guardada.id?.trim();
      if (sumatoriosCatastroPendientes?.supConstruidaTotal && guardada.recordId) {
        try {
          guardada = await actualizarSumatoriosCatastroPoliza(guardada, {
            supConstruidaTotal: sumatoriosCatastroPendientes.supConstruidaTotal,
            usosJson: sumatoriosCatastroPendientes.usosJson,
          });
        } catch (error) {
          throw new Error(
            `La póliza se guardó, pero no SupConstruidaTotal: ${
              error instanceof Error ? error.message : "error desconocido"
            }`
          );
        } finally {
          setSumatoriosCatastroPendientes(null);
        }
      }

      if (detallesUsosPendientes.length && idPoliza) {
        try {
          const detalles = filtrarDetallesUsosConstructivos(detallesUsosPendientes);
          const ref = detalles[0]?.referenciaCatastral?.trim();
          const esParcela = Boolean(ref && esReferenciaParcela(ref));

          if (esParcela) {
            await reemplazarDetallesCatastroPoliza(idPoliza, detalles);
          } else {
            const mismaReferencia =
              ref && detalles.every((d) => (d.referenciaCatastral?.trim() || "") === ref);

            if (mismaReferencia) {
              await reemplazarDetallesCatastroPorReferencia(idPoliza, ref, detalles);
            } else {
              await guardarDetallesCatastroPoliza(idPoliza, detalles);
            }
          }

          const supTotal =
            sumatoriosCatastroPendientes?.supConstruidaTotal ??
            resolverSuperficieConstruidaTotalCatastro(
              sumatoriosCatastroPendientes?.usosJson ?? {},
              detalles
            );
          if (supTotal > 0 && guardada.recordId) {
            guardada = await actualizarSumatoriosCatastroPoliza(guardada, {
              supConstruidaTotal: supTotal,
              usosJson: sumatoriosCatastroPendientes?.usosJson,
            });
          }
        } catch (error) {
          throw new Error(
            `La póliza se guardó, pero no los usos del catastro: ${
              error instanceof Error ? error.message : "error desconocido"
            }`
          );
        } finally {
          setDetallesUsosPendientes([]);
        }
      }

      if (inmueblesParcelaPendientes?.inmuebles.length && idPoliza) {
        try {
          await reemplazarDetalleCatastroParcelaPoliza(
            idPoliza,
            inmueblesParcelaPendientes.referenciaParcela,
            inmueblesParcelaPendientes.inmuebles
          );

          const usosParcelaJson = sumarUsosJsonParcela(
            inmueblesParcelaPendientes.inmuebles.map((inmueble) => inmueble.usosJson ?? {})
          );
          const supTotal = inmueblesParcelaPendientes.inmuebles.reduce(
            (total, inmueble) => total + (inmueble.superficieConstruidaTotal ?? 0),
            0
          );
          if (supTotal > 0 && guardada.recordId) {
            guardada = await actualizarSumatoriosCatastroPoliza(guardada, {
              usosParcelaJson,
              supConstruidaTotal: supTotal,
            });
          }
        } catch (error) {
          throw new Error(
            `La póliza se guardó, pero no los inmuebles de la parcela: ${
              error instanceof Error ? error.message : "error desconocido"
            }`
          );
        } finally {
          setInmueblesParcelaPendientes(null);
        }
      }

      toast.success(modo === "nuevo" ? "Póliza creada" : "Póliza actualizada");

      const polizaId = guardada.id || guardada.recordId;
      setSeleccionada(guardada);
      setFormData(prepararPolizaParaFormulario(polizaVacia, guardada));
      setModo("vista");

      if (modo === "nuevo" && polizaId) {
        navigate(`/polizas/${encodeURIComponent(polizaId)}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la póliza");
    } finally {
      setGuardando(false);
    }
  };

  const rellenarDireccionDesdeAsegurado = async () => {
    if (!formData.idAsegurado) return toast.error("Falta el asegurado relacionado");
    setRellenandoDireccion(true);
    try {
      const asegurado = await obtenerAsegurado(formData.idAsegurado);
      if (!asegurado) throw new Error("No se encontró el asegurado relacionado");

      const candidata: Poliza = {
        ...formData,
        via: asegurado.via,
        direccion: asegurado.direccion,
        numeroCalle: asegurado.numeroCalle,
        bloque: asegurado.bloque,
        escalera: asegurado.escalera,
        planta: asegurado.planta,
        puerta: asegurado.puerta,
        codigoPostal: asegurado.codigoPostal,
        poblacion: asegurado.poblacion,
        provincia: asegurado.provincia,
        direccionCompleta: asegurado.direccionCompleta,
      };

      if (modo === "nuevo" || !formData.recordId) {
        setFormData(candidata);
        toast.success("Dirección copiada desde el asegurado");
        return;
      }

      const guardada = await actualizarPoliza(candidata);
      setFormData(guardada);
      setSeleccionada((actual) => {
        if (!actual) return actual;
        const same = actual.recordId === guardada.recordId || actual.id === guardada.id;
        return same ? guardada : actual;
      });
      toast.success("Dirección copiada desde el asegurado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo rellenar la dirección");
    } finally {
      setRellenandoDireccion(false);
    }
  };

  const aplicarPolizaRecargada = (recargada: Poliza) => {
    setFormData(prepararPolizaParaFormulario(polizaVacia, recargada));
    setSeleccionada(recargada);
    setPolizas((actuales) =>
      actuales.map((p) => (p.id === recargada.id || p.recordId === recargada.recordId ? recargada : p))
    );
  };

  const calcularDistanciaPoliza = async (poliza: Poliza) => {
    if (!poliza.recordId) return toast.error("La póliza no tiene recordId (no se puede calcular la distancia)");

    setCalculandoDistancia(true);
    try {
      const guardada = await calcularYGuardarDistanciaPoliza(poliza);
      const metricas = {
        distancia: guardada.distancia,
        latitud: guardada.latitud,
        longitud: guardada.longitud,
      };

      setFormData((actual) => ({ ...actual, ...metricas }));
      setSeleccionada((actual) =>
        actual && (actual.recordId === poliza.recordId || actual.id === poliza.id)
          ? { ...actual, ...metricas }
          : actual
      );
      setPolizas((actuales) =>
        actuales.map((p) =>
          p.recordId === poliza.recordId || p.id === poliza.id ? { ...p, ...metricas } : p
        )
      );
      toast.success("Distancia actualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo calcular la distancia");
    } finally {
      setCalculandoDistancia(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">
      <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Polizas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tituloSecundario}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {modo === "edicion" || modo === "nuevo" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelar}
                  disabled={guardando}
                  className="rounded-xl"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    const form = document.getElementById("poliza-form") as HTMLFormElement | null;
                    form?.requestSubmit();
                  }}
                  disabled={guardando}
                  className="rounded-xl"
                >
                  {guardando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={!seleccionada}
                  className="rounded-xl"
                  onClick={editar}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Editar
                </Button>

                <Button
                  variant="outline"
                  disabled={!seleccionada}
                  className="rounded-xl border-destructive/30 text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Borrar
                </Button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={buscar} className="mt-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nº póliza, asegurado, compañía o ramo..."
              className="h-12 rounded-2xl border-border/60 bg-background pl-10"
            />
          </div>

          <Button
            type="submit"
            disabled={loadingBusqueda}
            className="h-12 rounded-2xl px-6"
          >
            {loadingBusqueda ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Buscar"
            )}
          </Button>
        </form>

        {mostrarResultados && polizas.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                Resultados de búsqueda
              </p>

              <p className="text-xs text-muted-foreground">
                {polizas.length} coincidencias
              </p>
            </div>

            <div className="grid gap-2 xl:grid-cols-2">
              {polizas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => seleccionarPoliza(p)}
                  className={`rounded-xl border p-3 text-left transition-smooth ${
                    seleccionada?.id === p.id
                      ? "border-accent/60 bg-accent/10"
                      : "border-border/60 bg-card hover:border-accent/60 hover:bg-accent/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold">
                      {p.numeroPoliza || "Sin número"}
                    </span>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.compania || "Sin compañía"}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {aseguradoNombre(p)}
                  </p>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {[p.ramo, p.tipoRamo].filter(Boolean).join(" · ")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-3xl border border-border/60 bg-card shadow-soft">
        {modo === "edicion" || modo === "nuevo" ? (
          <PolizaEditor
            id="poliza-form"
            modo={modo}
            aseguradoNombre={aseguradoNombre(seleccionada) || formData.asegurado}
            poliza={formData}
            guardando={guardando}
            rellenandoDireccion={rellenandoDireccion}
            loadingCombos={loadingCombos}
            loadingRamos={loadingRamos}
            companias={companias}
            ramos={ramos}
            onRellenarDireccionDesdeAsegurado={rellenarDireccionDesdeAsegurado}
            calculandoDistancia={calculandoDistancia}
            onCalcularDistanciaPoliza={() => calcularDistanciaPoliza(formData)}
            onChange={(campo, valor) =>
              setFormData((actual) => {
                if (campo === "idCompania") {
                  const ramosCompania = ramos.filter((r) => r.idCompania === valor);
                  const idRamoValido = ramosCompania.some((r) => r.id === actual.idRamo)
                    ? actual.idRamo
                    : "";
                  return { ...actual, idCompania: valor, idRamo: idRamoValido };
                }
                return { ...actual, [campo]: valor };
              })
            }
            onApplyFields={(campos) => setFormData((actual) => ({ ...actual, ...campos }))}
            onDetallesUsosPendientes={setDetallesUsosPendientes}
            onSumatoriosCatastroPendientes={setSumatoriosCatastroPendientes}
            onInmueblesParcelaPendientes={setInmueblesParcelaPendientes}
            onSubmit={guardar}
          />
        ) : seleccionada ? (
          <div className="space-y-5 p-6">
            <div className="gradient-hero rounded-3xl p-6 text-primary-foreground">
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">
                Póliza
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {seleccionada.numeroPoliza || "Sin número"}
              </h2>

              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="truncate text-primary-foreground/80">
                  {aseguradoNombre(seleccionada)}
                </p>

                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 rounded-xl"
                  onClick={() => {
                    const aseguradoId = seleccionada?.idAsegurado;

                    if (!aseguradoId) return;

                    navigate(`/asegurados/${encodeURIComponent(aseguradoId)}`);
                  }}
                >
                  Ver asegurado
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Info label="Compañía" value={seleccionada.compania} />
              <Info
                label="Ramo"
                value={[seleccionada.ramo, seleccionada.tipoRamo]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Info label="Fecha efecto" value={formatFecha(seleccionada.fechaEfecto)} />
            </div>

            <PolizaDireccionesSection
              poliza={seleccionada}
              mode="view"
              distanciaSlot={
                <DistanciaClickable
                  value={seleccionada.distancia}
                  loading={calculandoDistancia}
                  disabled={!seleccionada.recordId}
                  onClick={() => calcularDistanciaPoliza(seleccionada)}
                />
              }
            />

            <SiniestrosRelacionados
              siniestros={siniestrosPoliza}
              open={siniestrosAbiertos}
              onToggle={() => setSiniestrosAbiertos((value) => !value)}
            />
          </div>
        ) : (
          <div className="flex min-h-[520px] items-center justify-center p-8 text-center text-muted-foreground">
            <div>
              <Building2 className="mx-auto mb-4 h-12 w-12 opacity-40" />
              <p>Busca una póliza o selecciona un resultado.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

const PolizaEditor = ({
  id,
  modo,
  aseguradoNombre,
  poliza,
  guardando,
  rellenandoDireccion,
  loadingCombos,
  loadingRamos,
  companias,
  ramos,
  onRellenarDireccionDesdeAsegurado,
  calculandoDistancia,
  onCalcularDistanciaPoliza,
  onChange,
  onApplyFields,
  onDetallesUsosPendientes,
  onSumatoriosCatastroPendientes,
  onInmueblesParcelaPendientes,
  onSubmit,
}: {
  id: string;
  modo: ModoFormulario;
  aseguradoNombre: string;
  poliza: Poliza;
  guardando: boolean;
  rellenandoDireccion: boolean;
  loadingCombos: boolean;
  loadingRamos: boolean;
  companias: Compania[];
  ramos: Ramo[];
  onRellenarDireccionDesdeAsegurado: () => void;
  calculandoDistancia: boolean;
  onCalcularDistanciaPoliza: () => void;
  onChange: (campo: keyof Poliza, valor: string) => void;
  onApplyFields: (campos: Partial<Poliza>) => void;
  onDetallesUsosPendientes: (detalles: DetalleCatastroDesdeCatastro[]) => void;
  onSumatoriosCatastroPendientes: (sumatorios: SumatoriosCatastroPendientes | null) => void;
  onInmueblesParcelaPendientes: (payload: {
    referenciaParcela: string;
    inmuebles: InmuebleParcelaCatastro[];
  } | null) => void;
  onSubmit: (event: React.FormEvent) => void;
}) => {
  return (
    <form id={id} onSubmit={onSubmit} className="space-y-5 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {modo === "nuevo" ? "Nueva póliza" : "Editar póliza"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {aseguradoNombre ? `Asegurado: ${aseguradoNombre}` : "Completa los datos de la póliza."}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">ID asegurado</p>
          <p className="mt-1 text-sm font-semibold">{poliza.idAsegurado || "-"}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-border/60 bg-background/70 p-5">
        <h3 className="font-semibold">Datos principales</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Número póliza" value={poliza.numeroPoliza} onChange={(v) => onChange("numeroPoliza", v)} />
          <DateField label="Fecha efecto" value={textoCampo(poliza.fechaEfecto)} onChange={(v) => onChange("fechaEfecto", v)} />
          <div className="space-y-2">
            <Label>Compañía</Label>
            <select
              value={textoCampo(poliza.idCompania)}
              onChange={(e) => onChange("idCompania", e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">{loadingCombos ? "Cargando..." : "Selecciona compañía"}</option>
              {companias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || c.alias || c.id}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Ramo</Label>
            <select
              value={textoCampo(poliza.idRamo)}
              onChange={(e) => onChange("idRamo", e.target.value)}
              disabled={!poliza.idCompania || loadingRamos}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {!poliza.idCompania
                  ? "Selecciona compañía primero"
                  : loadingRamos
                    ? "Cargando ramos..."
                    : ramos.length
                      ? "Selecciona ramo"
                      : "Sin ramos para esta compañía"}
              </option>
              {ramos.map((r) => (
                <option key={r.id} value={r.id}>
                  {[r.ramo, r.tipoRamo].filter(Boolean).join(" · ")}
                </option>
              ))}
            </select>
          </div>
          <Field label="Agente" value={poliza.agente} onChange={(v) => onChange("agente", v)} />
          <Field label="Teléfono agente" value={poliza.telefonoAgente} onChange={(v) => onChange("telefonoAgente", v)} />
          <Field label="Email agente" value={poliza.emailAgente} onChange={(v) => onChange("emailAgente", v)} className="xl:col-span-2" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Se guardan los IDs de compañía/ramo y FileMaker muestra los nombres por relaciones.
        </p>
      </section>

      <PolizaDireccionesSection
        poliza={poliza}
        mode="edit"
        onChange={onChange}
        onApplyFields={onApplyFields}
        onDetallesUsosPendientes={onDetallesUsosPendientes}
        onSumatoriosCatastroPendientes={onSumatoriosCatastroPendientes}
        onInmueblesParcelaPendientes={onInmueblesParcelaPendientes}
        rellenandoDireccion={rellenandoDireccion}
        guardando={guardando}
        onRellenarDesdeAsegurado={onRellenarDireccionDesdeAsegurado}
        distanciaSlot={
          <DistanciaClickable
            value={poliza.distancia}
            loading={calculandoDistancia}
            disabled={guardando || !poliza.recordId}
            onClick={onCalcularDistanciaPoliza}
          />
        }
      />

      <section className="rounded-3xl border border-border/60 bg-background/70 p-5">
        <h3 className="font-semibold">Texto</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="Descripción" value={poliza.descripcion} onChange={(v) => onChange("descripcion", v)} />
          <TextField label="Información" value={poliza.informacion} onChange={(v) => onChange("informacion", v)} />
          <TextField label="Comentarios" value={poliza.comentarios} onChange={(v) => onChange("comentarios", v)} className="md:col-span-2" />
        </div>
      </section>
    </form>
  );
};

const Info = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </div>

      <InfoText label={label} value={value} />
    </div>
  </div>
);

const InfoText = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div className="min-w-0">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>

    <p className="mt-1 break-words text-sm font-semibold leading-snug">
      {value || "-"}
    </p>
  </div>
);

const DistanciaClickable = ({
  value,
  loading = false,
  disabled = false,
  onClick,
}: {
  value?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => {
  const texto = formatKm(value) || (loading ? "Calculando..." : "-");

  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">Distancia</p>
      <p
        role="button"
        tabIndex={disabled || loading ? -1 : 0}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (disabled || loading) return;
          onClick();
        }}
        onKeyDown={(event) => {
          if (disabled || loading) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onClick();
          }
        }}
        className={`mt-1 break-words text-sm font-semibold leading-snug ${
          disabled || loading ? "cursor-default text-muted-foreground" : "cursor-pointer hover:underline"
        }`}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculando...
          </span>
        ) : (
          texto
        )}
      </p>
    </div>
  );
};

const SiniestrosRelacionados = ({
  siniestros,
  open,
  onToggle,
}: {
  siniestros: Siniestro[];
  open: boolean;
  onToggle: () => void;
}) => (
  <CollapsibleSection
    title="Siniestros relacionados"
    count={siniestros.length}
    icon={FileText}
    empty="Sin siniestros relacionados"
    open={open}
    onToggle={onToggle}
  >
    <div className="space-y-2">
      {siniestros.map((s) => (
        <div
          key={s.id}
          className="rounded-2xl border border-border/60 bg-card p-3"
        >
          <div className="grid gap-2 md:grid-cols-[130px_1fr_130px_130px_140px]">
            <InfoText label="Siniestro" value={s.numero} />
            <InfoText label="Tipo" value={s.tipo} />
            <InfoText label="Ocurrencia" value={formatFecha(s.fechaOcurrencia)} />
            <InfoText label="Cierre" value={formatFecha(s.fechaCierre)} />
            <InfoText label="Valoración" value={formatEuros(s.valoracionTotal)} />
          </div>

          <p className="mt-2 truncate text-xs text-muted-foreground">
            {s.direccion}
          </p>
        </div>
      ))}
    </div>
  </CollapsibleSection>
);

type CollapsibleSectionProps = {
  title: string;
  count: number;
  icon: typeof FileText;
  empty: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const CollapsibleSection = ({
  title,
  count,
  icon: Icon,
  empty,
  open,
  onToggle,
  children,
}: CollapsibleSectionProps) => (
  <section className="rounded-3xl border border-border/60 bg-background/70 p-5">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {count} {count === 1 ? "registro" : "registros"}
          </p>
        </div>
      </div>

      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
    </button>

    {open ? (
      <div className="mt-4">
        {count === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : children}
      </div>
    ) : null}
  </section>
);

function formatEuros(value?: string) {
  const amount = parseNumero(value);
  if (amount === null) return "-";

  const [integerPart, decimalPart] = Math.abs(amount).toFixed(2).split(".");
  const sign = amount < 0 ? "-" : "";
  const thousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${sign}${thousands},${decimalPart} €`;
}

function parseNumero(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalized = raw
    .replace(/\s/g, "")
    .replace(/[€]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

const Field = ({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    <Label>{label}</Label>
    <Input value={textoCampo(value)} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl" />
  </div>
);

const TextField = ({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    <Label>{label}</Label>
    <Textarea value={textoCampo(value)} onChange={(e) => onChange(e.target.value)} className="min-h-[110px] rounded-xl" />
  </div>
);

function formatKm(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const normalized = raw.replace(",", ".").replace(/[^0-9.]/g, "");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return `${raw} km`;
  const shown = Number.isInteger(num) ? String(num) : String(num);
  return `${shown} km`;
}
