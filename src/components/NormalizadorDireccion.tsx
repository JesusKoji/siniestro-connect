import { ReactNode } from "react";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DireccionNormalizada } from "@/lib/geocode";

export type CandidatoDireccion = DireccionNormalizada & {
  googleFormattedAddress?: string;
  placeId?: string;
  consultaUsada?: string;
};

type NormalizadorDireccionProps = {
  direccionLibre: string;
  onDireccionLibreChange: (value: string) => void;
  normalizando: boolean;
  candidatos: CandidatoDireccion[];
  onNormalizar: () => void;
  onAplicarCandidato: (candidato: CandidatoDireccion) => void;
  extraActions?: ReactNode;
  descripcion?: string;
};

export const NormalizadorDireccion = ({
  direccionLibre,
  onDireccionLibreChange,
  normalizando,
  candidatos,
  onNormalizar,
  onAplicarCandidato,
  extraActions,
  descripcion = "Si hay varias coincidencias, selecciona la dirección correcta de la lista.",
}: NormalizadorDireccionProps) => (
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
            {candidato.consultaUsada ? (
              <p className="mt-1 text-[11px] text-muted-foreground">Consulta usada: {candidato.consultaUsada}</p>
            ) : null}
          </button>
        ))}
      </div>
    ) : null}
  </div>
);
