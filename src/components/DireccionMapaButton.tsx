import { useState } from "react";
import { MapPin } from "lucide-react";
import { DireccionMapaDialog } from "@/components/DireccionMapaDialog";
import { normalizarDireccionParaMapa } from "@/lib/direccionMapa";

type MetaItem = {
  label: string;
  value?: string;
  onClick?: () => void;
  title?: string;
};

type DireccionMapaButtonProps = {
  label: string;
  dialogTitle: string;
  subtitle?: string;
  address: string;
  searchAddress?: string;
  metaItems?: MetaItem[];
  footer?: React.ReactNode;
  className?: string;
  layout?: "stacked" | "address-left-meta-right";
};

export const DireccionMapaButton = ({
  label,
  dialogTitle,
  subtitle,
  address,
  searchAddress,
  metaItems,
  footer,
  className = "",
  layout = "stacked",
}: DireccionMapaButtonProps) => {
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const direccionMapa = address.trim();
  const direccionBusquedaMapa =
    searchAddress?.trim() || normalizarDireccionParaMapa(direccionMapa);

  const bloqueDireccion = (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold leading-snug">{direccionMapa || "-"}</p>
      {direccionMapa ? (
        <p className="mt-2 text-xs font-medium text-accent">Ver en Google Maps</p>
      ) : null}
    </div>
  );

  const bloqueMeta = metaItems?.length ? (
    <div className="min-w-0 space-y-3 lg:text-right">
      {metaItems.map((item) => {
        const valor = item.value?.trim() || "";
        const puedePinchar = Boolean(item.onClick && valor);

        return (
          <div key={item.label}>
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            {puedePinchar ? (
              <button
                type="button"
                title={item.title}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  item.onClick?.();
                }}
                className="mt-1 max-w-full break-all text-left text-sm font-semibold leading-snug text-primary underline-offset-2 hover:underline"
              >
                {valor}
              </button>
            ) : (
              <p className="mt-1 text-sm font-semibold leading-snug">{valor || "-"}</p>
            )}
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <div
        className={`w-full rounded-2xl border border-border/60 bg-card p-4 text-left ${className}`}
      >
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          {layout === "address-left-meta-right" ? (
            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <button
                type="button"
                onClick={() => direccionMapa && setMapaAbierto(true)}
                disabled={!direccionMapa}
                className="min-w-0 flex-1 rounded-lg text-left transition-smooth hover:bg-accent/10 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                {bloqueDireccion}
              </button>
              {bloqueMeta ? <div className="lg:ml-auto lg:shrink-0">{bloqueMeta}</div> : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => direccionMapa && setMapaAbierto(true)}
              disabled={!direccionMapa}
              className="min-w-0 flex-1 rounded-lg text-left transition-smooth hover:bg-accent/10 disabled:cursor-not-allowed"
            >
              {bloqueDireccion}
            </button>
          )}
        </div>
      </div>

      {footer ? <div className="mt-3">{footer}</div> : null}

      {mapaAbierto ? (
        <DireccionMapaDialog
          dialogTitle={dialogTitle}
          subtitle={subtitle}
          address={direccionMapa}
          searchAddress={direccionBusquedaMapa}
          onClose={() => setMapaAbierto(false)}
        />
      ) : null}
    </>
  );
};
