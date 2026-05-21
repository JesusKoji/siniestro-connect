import { useState } from "react";
import { Asegurado } from "@/data/siniestros";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink, IdCard, Mail, MapPin, Phone, UserRound, X } from "lucide-react";

type AseguradoCardProps = {
  asegurado: Asegurado | null;
  loading?: boolean;
};

export const AseguradoCard = ({ asegurado, loading = false }: AseguradoCardProps) => {
  const [mapaAbierto, setMapaAbierto] = useState(false);

  if (loading) {
    return (
      <section className="rounded-3xl border border-border/60 bg-background/70 p-5">
        <p className="text-sm text-muted-foreground">Cargando datos del asegurado...</p>
      </section>
    );
  }

  if (!asegurado) {
    return (
      <section className="rounded-3xl border border-dashed border-border/80 bg-background/50 p-5">
        <h3 className="font-semibold">Asegurado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No se han podido cargar los datos del asegurado vinculado a este siniestro.
        </p>
      </section>
    );
  }

  const direccionNormalizada = buildDireccionNormalizada(asegurado);
  const direccionMapa = direccionNormalizada || asegurado.direccionCompleta || "";
  const direccionBusquedaMapa = buildDireccionBusquedaMapa(asegurado) || normalizarDireccionParaMapa(direccionMapa);
  const encodedMapQuery = encodeURIComponent(direccionBusquedaMapa);
  const mapEmbedUrl = direccionBusquedaMapa
    ? `https://maps.google.com/maps?hl=es&q=${encodedMapQuery}&z=18&ie=UTF8&iwloc=B&output=embed`
    : "";
  const mapOpenUrl = direccionBusquedaMapa
    ? `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`
    : "";

  const esEmpresa = Boolean(asegurado.razonSocial);

  return (
    <section className="rounded-3xl border border-border/60 bg-background/70 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">Asegurado</h3>
            <Badge variant="secondary" className="rounded-full">
              {asegurado.tipoPersona || (esEmpresa ? "Persona jurídica" : "Persona física")}
            </Badge>
          </div>
          <p className="mt-2 text-2xl font-bold leading-tight text-foreground">
            {asegurado.displayName || "Sin nombre"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <InfoRow icon={esEmpresa ? Building2 : UserRound} label={esEmpresa ? "Razón social" : "Nombre completo"} value={asegurado.displayName} />
        <InfoRow icon={IdCard} label="Identificación fiscal" value={asegurado.nif} />
        <InfoRow icon={Phone} label="Teléfono" value={asegurado.telefono} />
        <InfoRow icon={Mail} label="Email" value={asegurado.email} />
      </div>

      <button
        type="button"
        onClick={() => direccionMapa && setMapaAbierto(true)}
        disabled={!direccionMapa}
        className="mt-4 w-full rounded-2xl border border-border/60 bg-card p-4 text-left transition-smooth hover:border-accent/60 hover:bg-accent/10 disabled:cursor-not-allowed disabled:hover:border-border/60 disabled:hover:bg-card"
      >
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Dirección normalizada</p>
            <p className="mt-1 font-semibold leading-snug">
              {direccionMapa || "-"}
            </p>
            {direccionMapa ? <p className="mt-2 text-xs font-medium text-accent">Ver en Google Maps</p> : null}
          </div>
        </div>
      </button>

      {mapaAbierto ? (
        <MapDialog
          title={asegurado.displayName || "Asegurado"}
          address={direccionMapa}
          searchAddress={direccionBusquedaMapa}
          embedUrl={mapEmbedUrl}
          openUrl={mapOpenUrl}
          onClose={() => setMapaAbierto(false)}
        />
      ) : null}
    </section>
  );
};

function buildDireccionNormalizada(asegurado: Asegurado) {
  return [
    [asegurado.via, asegurado.direccion, asegurado.numeroCalle].filter(Boolean).join(" "),
    [
      asegurado.bloque ? `Bloque ${asegurado.bloque}` : "",
      asegurado.escalera ? `Esc. ${asegurado.escalera}` : "",
      asegurado.planta ? `Planta ${asegurado.planta}` : "",
      asegurado.puerta ? `Puerta ${asegurado.puerta}` : "",
    ].filter(Boolean).join(" "),
    [asegurado.codigoPostal, asegurado.poblacion].filter(Boolean).join(" "),
    asegurado.provincia,
    asegurado.pais,
  ]
    .filter(Boolean)
    .join(" · ");
}

function buildDireccionBusquedaMapa(asegurado: Asegurado) {
  return [
    [asegurado.via, asegurado.direccion, asegurado.numeroCalle].filter(Boolean).join(" "),
    [asegurado.codigoPostal, asegurado.poblacion].filter(Boolean).join(" "),
    asegurado.provincia,
    asegurado.pais || "España",
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizarDireccionParaMapa(address: string) {
  return address
    .replace(/·/g, ",")
    .replace(/\b(Bloque|Blq\.|Esc\.|Escalera|Planta|Plt\.|Puerta|Pta\.)\s*[^,·]*/gi, "")
    .replace(/\s+/g, " ")
    .replace(/,+/g, ",")
    .replace(/,\s*,/g, ",")
    .trim();
}

type MapDialogProps = {
  title: string;
  address: string;
  searchAddress: string;
  embedUrl: string;
  openUrl: string;
  onClose: () => void;
};

const MapDialog = ({ title, address, searchAddress, embedUrl, openUrl, onClose }: MapDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-strong">
      <div className="flex items-start justify-between gap-4 border-b border-border/60 p-5">
        <div>
          <h2 className="text-xl font-bold">Ubicación del asegurado</h2>
          <p className="mt-1 text-sm font-medium">{title}</p>
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
        <p className="text-xs text-muted-foreground">La chincheta usa la dirección postal, sin bloque, escalera, planta ni puerta, para mejorar la precisión.</p>
        <a href={openUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-border/60 px-4 py-2 text-sm font-medium transition-smooth hover:bg-accent/10">
          Abrir en Google Maps
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </div>
    </div>
  </div>
);

type InfoRowProps = {
  icon: typeof UserRound;
  label: string;
  value?: string;
};

const InfoRow = ({ icon: Icon, label, value }: InfoRowProps) => (
  <div className="flex gap-3 rounded-2xl border border-border/60 bg-card p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-semibold leading-snug">{value || "-"}</p>
    </div>
  </div>
);
