import { Asegurado } from "@/data/siniestros";
import { Badge } from "@/components/ui/badge";
import { Building2, IdCard, Mail, MapPin, Phone, UserRound } from "lucide-react";

type AseguradoCardProps = {
  asegurado: Asegurado | null;
  loading?: boolean;
};

export const AseguradoCard = ({ asegurado, loading = false }: AseguradoCardProps) => {
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

  const direccionNormalizada = [
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
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">CIF / NIF</p>
          <p className="mt-1 font-semibold">{asegurado.nif || "-"}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <InfoRow icon={esEmpresa ? Building2 : UserRound} label={esEmpresa ? "Razón social" : "Nombre completo"} value={asegurado.displayName} />
        <InfoRow icon={IdCard} label="Identificación fiscal" value={asegurado.nif} />
        <InfoRow icon={Phone} label="Teléfono" value={asegurado.telefono} />
        <InfoRow icon={Mail} label="Email" value={asegurado.email} />
      </div>

      <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Dirección normalizada</p>
            <p className="mt-1 font-semibold leading-snug">
              {direccionNormalizada || asegurado.direccionCompleta || "-"}
            </p>
            {asegurado.direccionCompleta && direccionNormalizada && asegurado.direccionCompleta !== direccionNormalizada ? (
              <p className="mt-1 text-xs text-muted-foreground">Original: {asegurado.direccionCompleta}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

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
