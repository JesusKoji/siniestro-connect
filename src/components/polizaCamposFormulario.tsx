import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Poliza } from "@/data/siniestros";
import { formatImporteEs, parseNumeroEs } from "@/lib/continente";
import { textoCampo } from "@/lib/textoCampo";

export type TipoCampoPolizaFormulario =
  | "moneda"
  | "numero"
  | "porcentaje"
  | "decimal2"
  | "checkbox"
  | "soloLectura";

export const InputMonedaPoliza = ({
  value,
  onChange,
  disabled,
  className,
  placeholder,
}: {
  value: string;
  onChange?: (valor: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
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
      placeholder={placeholder}
      onFocus={() => setEditando(true)}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={() => setEditando(false)}
      className={className}
    />
  );
};

export const formatearMonedaPoliza = (valor?: string) => {
  const texto = textoCampo(valor);
  if (!texto) return "-";
  return `${formatImporteEs(parseNumeroEs(texto))} €`;
};

export const formatearNumeroPoliza = (valor?: string) => {
  const texto = textoCampo(valor);
  return texto || "-";
};

export const formatearDecimal2Poliza = (valor?: string) => {
  const texto = textoCampo(valor);
  if (!texto) return "-";
  return parseNumeroEs(texto).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatearPorcentajePoliza = (valor?: string) => {
  const texto = textoCampo(valor);
  if (!texto) return "-";
  return `${parseNumeroEs(texto).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} %`;
};

const InputDecimal2Poliza = ({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange?: (valor: string) => void;
  className?: string;
  placeholder?: string;
}) => {
  const [editando, setEditando] = useState(false);
  const display = editando
    ? value
    : value.trim()
      ? formatearDecimal2Poliza(value)
      : "";

  return (
    <Input
      value={display}
      inputMode="decimal"
      placeholder={placeholder}
      onFocus={() => setEditando(true)}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={() => setEditando(false)}
      className={className}
    />
  );
};

const InputPorcentajePoliza = ({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange?: (valor: string) => void;
  className?: string;
  placeholder?: string;
}) => {
  const [editando, setEditando] = useState(false);
  const display = editando
    ? value
    : value.trim()
      ? formatearPorcentajePoliza(value)
      : "";

  return (
    <Input
      value={display}
      inputMode="decimal"
      placeholder={placeholder}
      onFocus={() => setEditando(true)}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={() => setEditando(false)}
      className={className}
    />
  );
};

type CampoPolizaFormularioProps = {
  label: string;
  campo: keyof Poliza;
  poliza: Poliza;
  tipo: TipoCampoPolizaFormulario;
  editable: boolean;
  soloLectura?: boolean;
  onChange?: (campo: keyof Poliza, valor: string) => void;
  placeholder?: string;
  titulo?: string;
  className?: string;
  ancho?: "normal" | "estrecho" | "medio";
};

const ANCHO_CAMPO_NORMAL = "w-[9.5rem]";
const ANCHO_CAMPO_MEDIO = "w-[11.5rem]";
const ANCHO_CAMPO_ESTRECHO = "w-[5.5rem]";
const CLASE_ETIQUETA = "block whitespace-nowrap text-xs font-medium leading-none";
const CLASE_INPUT = "h-11 w-full rounded-xl px-3 text-sm";
const CLASE_VALOR_LECTURA =
  "flex h-11 w-full items-center rounded-xl border border-input bg-muted/40 px-3 text-sm font-semibold";

const anchoContenedorCampo = (ancho: "normal" | "estrecho" | "medio") => {
  if (ancho === "estrecho") return ANCHO_CAMPO_ESTRECHO;
  if (ancho === "medio") return ANCHO_CAMPO_MEDIO;
  return ANCHO_CAMPO_NORMAL;
};

const claseContenedorCampo = (ancho: "normal" | "estrecho" | "medio", className?: string) =>
  className ?? `${anchoContenedorCampo(ancho)} shrink-0 space-y-2`;

const claseEtiquetaCampo = (ancho: "normal" | "estrecho" | "medio") =>
  ancho === "estrecho" ? `${CLASE_ETIQUETA} overflow-hidden text-ellipsis` : CLASE_ETIQUETA;

const formatearValorCampo = (tipo: TipoCampoPolizaFormulario, valor: string) => {
  if (tipo === "moneda" || tipo === "soloLectura") return formatearMonedaPoliza(valor);
  if (tipo === "checkbox") return valor === "1" ? "Sí" : "No";
  if (tipo === "porcentaje") return formatearPorcentajePoliza(valor);
  if (tipo === "decimal2") return formatearDecimal2Poliza(valor);
  return formatearNumeroPoliza(valor);
};

export const CampoPolizaFormulario = ({
  label,
  campo,
  poliza,
  tipo,
  editable,
  soloLectura = false,
  onChange,
  placeholder,
  titulo,
  className,
  ancho = "normal",
}: CampoPolizaFormularioProps) => {
  const valor = textoCampo(poliza[campo]);
  const contenedorClass = claseContenedorCampo(ancho, className);
  const etiquetaClass = claseEtiquetaCampo(ancho);
  const esSoloLectura = !editable || tipo === "soloLectura" || soloLectura;

  if (esSoloLectura) {
    return (
      <div className={contenedorClass} title={titulo}>
        <Label className={etiquetaClass}>{label}</Label>
        <div className={CLASE_VALOR_LECTURA}>
          <span className="truncate">{formatearValorCampo(tipo, valor)}</span>
        </div>
      </div>
    );
  }

  if (tipo === "checkbox") {
    return (
      <div className={contenedorClass} title={titulo}>
        <Label className={etiquetaClass}>{label}</Label>
        <label className={`flex items-center gap-2 border border-input bg-background ${CLASE_INPUT}`}>
          <Checkbox
            checked={valor === "1"}
            onCheckedChange={(checked) => onChange?.(campo, checked === true ? "1" : "0")}
          />
          <span className="text-sm">{valor === "1" ? "Sí" : "No"}</span>
        </label>
      </div>
    );
  }

  return (
    <div className={contenedorClass} title={titulo}>
      <Label className={etiquetaClass}>{label}</Label>
      {tipo === "moneda" ? (
        <InputMonedaPoliza
          value={valor}
          onChange={(nuevoValor) => onChange?.(campo, nuevoValor)}
          placeholder={placeholder}
          className={CLASE_INPUT}
        />
      ) : tipo === "porcentaje" ? (
        <InputPorcentajePoliza
          value={valor}
          onChange={(nuevoValor) => onChange?.(campo, nuevoValor)}
          placeholder={placeholder}
          className={CLASE_INPUT}
        />
      ) : tipo === "decimal2" ? (
        <InputDecimal2Poliza
          value={valor}
          onChange={(nuevoValor) => onChange?.(campo, nuevoValor)}
          placeholder={placeholder}
          className={CLASE_INPUT}
        />
      ) : (
        <Input
          value={valor}
          inputMode="decimal"
          placeholder={placeholder}
          onChange={(e) => onChange?.(campo, e.target.value)}
          className={CLASE_INPUT}
        />
      )}
    </div>
  );
};

export const FilaCamposPoliza = ({
  titulo,
  campos,
  poliza,
  editable,
  onChange,
}: {
  titulo?: string;
  campos: Omit<CampoPolizaFormularioProps, "poliza" | "editable" | "onChange">[];
  poliza: Poliza;
  editable: boolean;
  onChange?: (campo: keyof Poliza, valor: string) => void;
}) => (
  <div className="space-y-2">
    {titulo ? <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p> : null}
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-end gap-3">
        {campos.map((campo) => (
          <CampoPolizaFormulario
            key={String(campo.campo)}
            {...campo}
            poliza={poliza}
            editable={editable}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  </div>
);
