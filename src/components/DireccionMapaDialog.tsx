import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsOpenUrl,
} from "@/lib/direccionMapa";

type DireccionMapaDialogProps = {
  dialogTitle: string;
  subtitle?: string;
  address: string;
  searchAddress: string;
  onClose: () => void;
};

export const DireccionMapaDialog = ({
  dialogTitle,
  subtitle,
  address,
  searchAddress,
  onClose,
}: DireccionMapaDialogProps) => {
  const embedUrl = buildGoogleMapsEmbedUrl(searchAddress);
  const openUrl = buildGoogleMapsOpenUrl(searchAddress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-strong">
        <div className="flex items-start justify-between gap-4 border-b border-border/60 p-5">
          <div>
            <h2 className="text-xl font-bold">{dialogTitle}</h2>
            {subtitle ? <p className="mt-1 text-sm font-medium">{subtitle}</p> : null}
            <p className="mt-1 text-sm text-muted-foreground">{address}</p>
            {searchAddress && searchAddress !== address ? (
              <p className="mt-1 text-xs text-muted-foreground">Búsqueda en mapa: {searchAddress}</p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="h-[68vh] min-h-[420px] bg-muted">
          <iframe
            title={`Mapa de ${searchAddress || address}`}
            src={embedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <div className="flex flex-col gap-2 border-t border-border/60 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            La chincheta usa la dirección postal, sin bloque, escalera, planta ni puerta, para mejorar la
            precisión.
          </p>
          <a
            href={openUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-border/60 px-4 py-2 text-sm font-medium transition-smooth hover:bg-accent/10"
          >
            Abrir en Google Maps
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
