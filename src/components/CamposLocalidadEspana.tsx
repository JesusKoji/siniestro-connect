import { useCallback, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buscarLocalidadesPorCodigoPostal,
  normalizarCp,
  type LocalidadEspana,
} from "@/lib/codigosPostales";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type CamposLocalidadValues = {
  codigoPostal: string;
  poblacion: string;
  provincia: string;
};

type CamposLocalidadEspanaProps = {
  values: CamposLocalidadValues;
  onChange: (patch: Partial<CamposLocalidadValues>) => void;
  disabled?: boolean;
  className?: string;
};

function claveCandidato(localidad: LocalidadEspana) {
  return `${localidad.codigoPostal}|${localidad.poblacion}|${localidad.provincia}`;
}

export const CamposLocalidadEspana = ({
  values,
  onChange,
  disabled = false,
  className = "",
}: CamposLocalidadEspanaProps) => {
  const [buscandoCp, setBuscandoCp] = useState(false);
  const [candidatosCp, setCandidatosCp] = useState<LocalidadEspana[]>([]);
  const ultimoCpBuscadoRef = useRef("");

  const aplicarLocalidad = useCallback(
    (localidad: LocalidadEspana) => {
      onChange({
        codigoPostal: localidad.codigoPostal || normalizarCp(values.codigoPostal),
        poblacion: localidad.poblacion,
        provincia: localidad.provincia,
      });
      setCandidatosCp([]);
    },
    [onChange, values.codigoPostal]
  );

  const buscarPorCodigoPostal = useCallback(
    async (cpInput?: string) => {
      const cp = normalizarCp(cpInput ?? values.codigoPostal);
      if (cp.length !== 5) {
        setCandidatosCp([]);
        return;
      }

      if (ultimoCpBuscadoRef.current === cp) {
        return;
      }

      setBuscandoCp(true);
      try {
        const localidades = await buscarLocalidadesPorCodigoPostal(cp);
        ultimoCpBuscadoRef.current = cp;

        if (localidades.length === 0) {
          setCandidatosCp([]);
          toast.error("No se encontró población ni provincia para ese código postal");
          return;
        }

        if (localidades.length === 1) {
          aplicarLocalidad(localidades[0]);
          return;
        }

        setCandidatosCp(localidades);
        const coincide = localidades.some(
          (item) =>
            item.poblacion.toLowerCase() === values.poblacion.trim().toLowerCase() &&
            item.provincia.toLowerCase() === values.provincia.trim().toLowerCase()
        );
        if (!coincide) {
          onChange({ poblacion: "", provincia: "" });
        }
        toast.message("Varias localidades comparten ese CP. Selecciona la correcta.");
      } catch (error) {
        setCandidatosCp([]);
        toast.error(
          error instanceof Error ? error.message : "No se pudo consultar el código postal"
        );
      } finally {
        setBuscandoCp(false);
      }
    },
    [aplicarLocalidad, onChange, values.codigoPostal, values.poblacion, values.provincia]
  );

  const candidatoSeleccionado =
    candidatosCp.length > 1
      ? candidatosCp.find(
          (item) =>
            item.poblacion.toLowerCase() === values.poblacion.trim().toLowerCase() &&
            item.provincia.toLowerCase() === values.provincia.trim().toLowerCase()
        )
      : undefined;

  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      <div className="space-y-2">
        <Label>Código postal</Label>
        <div className="flex gap-2">
          <Input
            value={values.codigoPostal}
            onChange={(e) => {
              const cp = e.target.value.replace(/\D/g, "").slice(0, 5);
              onChange({ codigoPostal: cp });
              if (cp.length < 5) {
                setCandidatosCp([]);
                ultimoCpBuscadoRef.current = "";
                return;
              }
              void buscarPorCodigoPostal(cp);
            }}
            onBlur={() => void buscarPorCodigoPostal()}
            disabled={disabled || buscandoCp}
            inputMode="numeric"
            maxLength={5}
            placeholder="46013"
            className="h-11 rounded-xl"
          />
          {buscandoCp ? <Loader2 className="mt-3 h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Al completar 5 dígitos se rellenan población y provincia automáticamente.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Población</Label>
        {candidatosCp.length > 1 ? (
          <Select
            value={candidatoSeleccionado ? claveCandidato(candidatoSeleccionado) : undefined}
            onValueChange={(clave) => {
              const localidad = candidatosCp.find((item) => claveCandidato(item) === clave);
              if (localidad) aplicarLocalidad(localidad);
            }}
            disabled={disabled || buscandoCp}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Selecciona población" />
            </SelectTrigger>
            <SelectContent>
              {candidatosCp.map((localidad) => (
                <SelectItem key={claveCandidato(localidad)} value={claveCandidato(localidad)}>
                  {localidad.poblacion} · {localidad.provincia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={values.poblacion}
            onChange={(e) => onChange({ poblacion: e.target.value })}
            disabled={disabled || buscandoCp}
            placeholder="Población"
            className="h-11 rounded-xl"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Provincia</Label>
        <Input
          value={values.provincia}
          onChange={(e) => onChange({ provincia: e.target.value })}
          disabled={disabled || buscandoCp || candidatosCp.length > 1}
          placeholder="Provincia"
          className="h-11 rounded-xl"
        />
      </div>
    </div>
  );
};
