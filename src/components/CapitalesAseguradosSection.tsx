import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Poliza } from "@/data/siniestros";
import { listarValoresListaPropiedadPoliza } from "@/lib/filemaker";
import { textoCampo } from "@/lib/textoCampo";
import {
  CampoPolizaFormulario,
  formatearMonedaPoliza,
  InputMonedaPoliza,
} from "@/components/polizaCamposFormulario";
import { Loader2 } from "lucide-react";

type CapitalesAseguradosSectionProps = {
  poliza: Poliza;
  onChange?: (campo: keyof Poliza, valor: string) => void;
};

type CampoConfig = {
  campo: keyof Poliza;
  label: string;
  descripcion: string;
  tipo: "moneda" | "listaPropiedad";
  anchoCompleto?: boolean;
};

const CAMPOS_CAPITALES: CampoConfig[] = [
  {
    campo: "ctePoliza",
    label: "Continente",
    descripcion: "Capital de continente contratado en la póliza (CtePoliza)",
    tipo: "moneda",
  },
  {
    campo: "ctdoPoliza",
    label: "Contenido",
    descripcion: "Capital de contenido contratado en la póliza (CtdoPoliza)",
    tipo: "moneda",
  },
  {
    campo: "mobYMaqPoliza",
    label: "Mobiliario y maquinaria",
    descripcion: "Capital de mobiliario y maquinaria contratado en la póliza (MobYMaqPoliza)",
    tipo: "moneda",
  },
  {
    campo: "existenciasPoliza",
    label: "Existencias",
    descripcion: "Capital de existencias contratado en la póliza (ExistenciasPoliza)",
    tipo: "moneda",
  },
  {
    campo: "embarcacion",
    label: "Embarcación",
    descripcion: "Capital asegurado embarcación (Embarcacion)",
    tipo: "moneda",
  },
  {
    campo: "capitalRcPoliza",
    label: "Capital RC",
    descripcion: "Capital RC contratado en la póliza (CapitalRCPoliza)",
    tipo: "moneda",
  },
  {
    campo: "capitalPemPoliza",
    label: "PEM TRC",
    descripcion: "Presupuesto ejecución material en TRC contratado (CapitalPEMPoliza)",
    tipo: "moneda",
  },
  {
    campo: "facturacionDeclarada",
    label: "Facturación declarada",
    descripcion: "Facturación declarada en la póliza (FacturacionDeclarada)",
    tipo: "moneda",
  },
  {
    campo: "propietario",
    label: "Propietario",
    descripcion: "Propietario del riesgo asegurado (Propietario) — Propietario / Inquilino",
    tipo: "listaPropiedad",
    anchoCompleto: true,
  },
];

export const CapitalesAseguradosSection = ({
  poliza,
  onChange,
}: CapitalesAseguradosSectionProps) => {
  const editable = Boolean(onChange);
  const [valoresPropiedad, setValoresPropiedad] = useState<string[]>([]);
  const [cargandoPropiedad, setCargandoPropiedad] = useState(false);

  useEffect(() => {
    if (!editable) return;

    let activo = true;
    setCargandoPropiedad(true);

    listarValoresListaPropiedadPoliza(poliza.recordId, { forzarRecarga: true })
      .then((valores) => {
        if (!activo) return;
        setValoresPropiedad(valores);
      })
      .finally(() => {
        if (activo) setCargandoPropiedad(false);
      });

    return () => {
      activo = false;
    };
  }, [editable, poliza.recordId]);

  const renderPropietario = (valor: string, className?: string) => {
    const opciones = valoresPropiedad.includes(valor)
      ? valoresPropiedad
      : valor
        ? [valor, ...valoresPropiedad]
        : valoresPropiedad;

    if (!editable) {
      return (
        <div className={className}>
          <p className="text-xs font-medium text-muted-foreground">Propietario</p>
          <p className="mt-1 text-sm font-semibold">{valor || "-"}</p>
        </div>
      );
    }

    return (
      <div className={`space-y-2 ${className ?? ""}`} title="Propietario del riesgo asegurado (Propietario)">
        <div className="flex items-center gap-2">
          <Label>Propietario</Label>
          {cargandoPropiedad ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
        </div>
        <select
          value={valor}
          disabled={cargandoPropiedad}
          onChange={(e) => onChange?.("propietario", e.target.value)}
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">{cargandoPropiedad ? "Cargando..." : "Selecciona propiedad"}</option>
          {opciones.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
      <h4 className="font-semibold">Capitales asegurados</h4>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CAMPOS_CAPITALES.map(({ campo, label, descripcion, tipo, anchoCompleto }) => {
          const valor = textoCampo(poliza[campo]);
          const className = anchoCompleto ? "sm:col-span-2 xl:col-span-3" : undefined;

          if (tipo === "listaPropiedad") {
            return <div key={campo}>{renderPropietario(valor, className)}</div>;
          }

          if (!editable) {
            return (
              <div key={campo} className={className} title={descripcion}>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold">{formatearMonedaPoliza(valor)}</p>
              </div>
            );
          }

          return (
            <div key={campo} className={`space-y-2 ${className ?? ""}`} title={descripcion}>
              <Label>{label}</Label>
              <InputMonedaPoliza
                value={valor}
                onChange={(nuevoValor) => onChange?.(campo, nuevoValor)}
                className="rounded-xl"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
