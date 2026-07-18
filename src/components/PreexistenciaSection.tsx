import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DetalleCatastroPoliza,
  DetalleContinente,
  Poliza,
  TipologiaContinente,
} from "@/data/siniestros";
import { calcularImporteContinente, formatImporteEs, parseNumeroEs } from "@/lib/continente";
import {
  actualizarDetalleContinente,
  crearDetalleContinente,
  eliminarDetalleCatastroPoliza,
  eliminarDetalleContinente,
  listarDetalleCatastroPoliza,
  listarDetalleContinentePoliza,
  listarTipologiasContinente,
} from "@/lib/filemaker";
import { textoCampo } from "@/lib/textoCampo";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type NuevaFila = {
  idTipologia: string;
  medicion: string;
  precio: string;
};

const NUEVA_FILA_VACIA: NuevaFila = { idTipologia: "", medicion: "", precio: "" };

/** Formatea la superficie con punto de miles, limitada a 6 dígitos (máx. 999.999). */
const formatSuperficie = (valor: string): string => {
  if (!valor.trim()) return "";
  const n = Math.min(Math.round(parseNumeroEs(valor)), 999999);
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
};

/** Formatea un número con punto de miles (sin decimales). */
const formatMiles = (valor: string): string => {
  if (!valor.trim()) return "";
  return Math.round(parseNumeroEs(valor)).toLocaleString("es-ES", { maximumFractionDigits: 0 });
};

/** Input de moneda: muestra "1.234,56 €" cuando no está en edición y el valor crudo al enfocar. */
const InputMoneda = ({
  value,
  disabled,
  onChange,
  onCommit,
  className,
}: {
  value: string;
  disabled?: boolean;
  onChange: (valor: string) => void;
  onCommit?: () => void;
  className?: string;
}) => {
  const [editando, setEditando] = useState(false);
  const display = editando
    ? value
    : value.trim()
      ? `${formatImporteEs(parseNumeroEs(value))} €`
      : "";

  return (
    <Input
      value={display}
      inputMode="decimal"
      disabled={disabled}
      onFocus={() => setEditando(true)}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        setEditando(false);
        onCommit?.();
      }}
      className={className}
    />
  );
};

export const PreexistenciaSection = ({ poliza }: { poliza: Poliza }) => {
  const idPoliza = poliza.id?.trim() || "";

  const [cargando, setCargando] = useState(false);
  const [tipologias, setTipologias] = useState<TipologiaContinente[]>([]);
  const [detalles, setDetalles] = useState<DetalleContinente[]>([]);
  const [detallesCatastro, setDetallesCatastro] = useState<DetalleCatastroPoliza[]>([]);
  const [nuevaFila, setNuevaFila] = useState<NuevaFila>(NUEVA_FILA_VACIA);
  const [guardandoNueva, setGuardandoNueva] = useState(false);
  const [filaOcupada, setFilaOcupada] = useState<string | null>(null);

  const tipologiasPorId = useMemo(() => {
    const mapa = new Map<string, TipologiaContinente>();
    tipologias.forEach((t) => mapa.set(t.id, t));
    return mapa;
  }, [tipologias]);

  useEffect(() => {
    let activo = true;
    if (!idPoliza) {
      setTipologias([]);
      setDetalles([]);
      setDetallesCatastro([]);
      return;
    }

    setCargando(true);
    Promise.all([
      listarTipologiasContinente(),
      listarDetalleContinentePoliza(idPoliza),
      listarDetalleCatastroPoliza(idPoliza),
    ])
      .then(([tip, det, cat]) => {
        if (!activo) return;
        setTipologias(tip);
        setDetalles(det);
        setDetallesCatastro(cat);
      })
      .catch((error) => {
        if (!activo) return;
        toast.error(
          error instanceof Error ? error.message : "No se pudo cargar la preexistencia de continente"
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [idPoliza]);

  const nombreTipologia = (id: string) =>
    tipologiasPorId.get(id)?.nombre || (id ? `Tipología ${id}` : "");

  const actualizarFilaLocal = (id: string, patch: Partial<DetalleContinente>) => {
    setDetalles((filas) =>
      filas.map((fila) => {
        if (fila.id !== id) return fila;
        const actualizada = { ...fila, ...patch };
        actualizada.importe = calcularImporteContinente(actualizada.medicion, actualizada.precio);
        return actualizada;
      })
    );
  };

  const persistirFila = async (id: string, patch?: Partial<DetalleContinente>) => {
    const fila = detalles.find((f) => f.id === id);
    if (!fila) return;
    const aGuardar = { ...fila, ...patch };
    setFilaOcupada(id);
    try {
      const guardada = await actualizarDetalleContinente(aGuardar);
      setDetalles((filas) => filas.map((f) => (f.id === id ? guardada : f)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la línea");
    } finally {
      setFilaOcupada(null);
    }
  };

  const cambiarTipologiaFila = (fila: DetalleContinente, idTipologia: string) => {
    const tipologia = tipologiasPorId.get(idTipologia);
    const precio = tipologia && textoCampo(tipologia.precio) ? tipologia.precio : fila.precio;
    actualizarFilaLocal(fila.id, { idTipologia, precio });
    void persistirFila(fila.id, { idTipologia, precio });
  };

  const borrarFila = async (fila: DetalleContinente) => {
    setFilaOcupada(fila.id);
    try {
      await eliminarDetalleContinente(fila);
      setDetalles((filas) => filas.filter((f) => f.id !== fila.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo borrar la línea");
    } finally {
      setFilaOcupada(null);
    }
  };

  const cambiarTipologiaNueva = (idTipologia: string) => {
    const tipologia = tipologiasPorId.get(idTipologia);
    setNuevaFila((prev) => ({
      ...prev,
      idTipologia,
      precio: tipologia && textoCampo(tipologia.precio) ? tipologia.precio : prev.precio,
    }));
  };

  const anadirFila = async () => {
    if (!nuevaFila.idTipologia) {
      toast.error("Selecciona una tipología");
      return;
    }
    setGuardandoNueva(true);
    try {
      const creada = await crearDetalleContinente(idPoliza, nuevaFila);
      setDetalles((filas) => [...filas, creada]);
      setNuevaFila(NUEVA_FILA_VACIA);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo añadir la línea");
    } finally {
      setGuardandoNueva(false);
    }
  };

  const borrarFilaCatastro = async (fila: DetalleCatastroPoliza) => {
    setFilaOcupada(fila.recordId);
    try {
      await eliminarDetalleCatastroPoliza(fila.recordId);
      setDetallesCatastro((filas) => filas.filter((f) => f.recordId !== fila.recordId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo borrar el detalle catastro");
    } finally {
      setFilaOcupada(null);
    }
  };

  if (!idPoliza) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Preexistencia</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Guarda la póliza para gestionar la preexistencia de continente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-border/60 bg-card p-4 lg:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h4 className="font-semibold">Continente</h4>
            <span className="text-xs text-muted-foreground">
              Superficie total:{" "}
              <span className="font-medium text-foreground">
                {textoCampo(poliza.supConstruidaTotal ?? poliza.totalSuperficie)
                  ? `${formatMiles(poliza.supConstruidaTotal ?? poliza.totalSuperficie)} m²`
                  : "-"}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              Antigüedad:{" "}
              <span className="font-medium text-foreground">
                {textoCampo(poliza.antiguedad) ? `${poliza.antiguedad} Años` : "-"}
              </span>
            </span>
          </div>
          {cargando ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs font-medium text-muted-foreground">
                  <th className="w-full py-2 pr-2">Tipología</th>
                  <th className="whitespace-nowrap py-2 pr-1 text-right">Medición</th>
                  <th className="whitespace-nowrap py-2 pl-1 pr-2 text-right">Precio</th>
                  <th className="whitespace-nowrap py-2 pl-3 pr-2 text-right">Importe</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {detalles.map((fila) => {
                  const ocupada = filaOcupada === fila.id;
                  return (
                    <tr key={fila.id} className="border-b border-border/40">
                      <td className="py-2 pr-2 align-top">
                        <select
                          value={fila.idTipologia}
                          disabled={ocupada}
                          onChange={(e) => cambiarTipologiaFila(fila, e.target.value)}
                          className="h-10 w-full min-w-[110px] rounded-lg border border-input bg-background px-2 text-sm"
                        >
                          {!tipologiasPorId.has(fila.idTipologia) ? (
                            <option value={fila.idTipologia}>{nombreTipologia(fila.idTipologia)}</option>
                          ) : null}
                          {tipologias.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-1 align-top text-right">
                        <Input
                          value={fila.medicion}
                          inputMode="decimal"
                          disabled={ocupada}
                          onChange={(e) => actualizarFilaLocal(fila.id, { medicion: e.target.value })}
                          onBlur={() => persistirFila(fila.id)}
                          className="ml-auto h-10 w-20 rounded-lg text-right"
                        />
                      </td>
                      <td className="py-2 pl-1 pr-2 align-top text-right">
                        <InputMoneda
                          value={fila.precio}
                          disabled={ocupada}
                          onChange={(valor) => actualizarFilaLocal(fila.id, { precio: valor })}
                          onCommit={() => persistirFila(fila.id)}
                          className="ml-auto h-10 w-28 rounded-lg text-right"
                        />
                      </td>
                      <td className="whitespace-nowrap py-2 pl-3 pr-2 text-right align-middle font-medium tabular-nums">
                        {formatImporteEs(parseNumeroEs(fila.importe))} €
                      </td>
                      <td className="py-2 align-middle text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={ocupada}
                          onClick={() => borrarFila(fila)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Borrar línea"
                        >
                          {ocupada ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                <tr>
                  <td className="py-2 pr-2 align-top">
                    <select
                      value={nuevaFila.idTipologia}
                      onChange={(e) => cambiarTipologiaNueva(e.target.value)}
                      className="h-10 w-full min-w-[110px] rounded-lg border border-input bg-background px-2 text-sm"
                    >
                      <option value="">Añadir tipología…</option>
                      {tipologias.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-1 align-top text-right">
                    <Input
                      value={nuevaFila.medicion}
                      inputMode="decimal"
                      placeholder="0"
                      onChange={(e) => setNuevaFila((prev) => ({ ...prev, medicion: e.target.value }))}
                      className="ml-auto h-10 w-20 rounded-lg text-right"
                    />
                  </td>
                  <td className="py-2 pl-1 pr-2 align-top text-right">
                    <InputMoneda
                      value={nuevaFila.precio}
                      onChange={(valor) => setNuevaFila((prev) => ({ ...prev, precio: valor }))}
                      className="ml-auto h-10 w-28 rounded-lg text-right"
                    />
                  </td>
                  <td className="whitespace-nowrap py-2 pl-3 pr-2 text-right align-middle font-medium tabular-nums text-muted-foreground">
                    {calcularImporteContinente(nuevaFila.medicion, nuevaFila.precio)} €
                  </td>
                  <td className="py-2 align-middle text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={guardandoNueva || !nuevaFila.idTipologia}
                      onClick={anadirFila}
                      className="h-8 w-8 text-primary"
                      title="Añadir línea"
                    >
                      {guardandoNueva ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <h4 className="font-semibold">Detalle catastro</h4>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs font-medium text-muted-foreground">
                  <th className="w-full py-2 pr-4">Uso</th>
                  <th className="whitespace-nowrap py-2 pr-2 text-right">Superficie</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {detallesCatastro.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-3 text-sm text-muted-foreground">
                      Sin detalle catastro para esta póliza.
                    </td>
                  </tr>
                ) : (
                  detallesCatastro.map((fila) => {
                    const ocupada = filaOcupada === fila.recordId;
                    return (
                      <tr key={fila.recordId} className="border-b border-border/40">
                        <td className="py-2 pr-4">{fila.uso || "-"}</td>
                        <td className="whitespace-nowrap py-2 pr-2 text-right tabular-nums">
                          {fila.superficie ? `${formatSuperficie(fila.superficie)} m²` : "-"}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={ocupada}
                            onClick={() => borrarFilaCatastro(fila)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Borrar línea"
                          >
                            {ocupada ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};
