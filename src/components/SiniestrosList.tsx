import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listarSiniestrosEnCurso } from "@/lib/filemaker";
import { Siniestro } from "@/data/siniestros";
import { Search, ChevronRight, LogOut, Loader2, FileText } from "lucide-react";

interface SiniestrosListProps {
  onSelect: (s: Siniestro) => void;
  onLogout: () => void;
}

export const SiniestrosList = ({ onSelect, onLogout }: SiniestrosListProps) => {
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarSiniestrosEnCurso()
      .then(setSiniestros)
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return siniestros;
    return siniestros.filter((s) =>
      [s.numero, s.compania, s.asegurado, s.direccion, s.tipo]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [siniestros, query]);

  return (
    <div className="min-h-screen gradient-surface">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/60 safe-top">
        <div className="px-5 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Salir
          </Button>
        </div>
      </header>

      <div className="px-5 pt-6 pb-24">
        <div className="mb-5 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-foreground">Siniestros en curso</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Cargando…" : `${filtrados.length} ${filtrados.length === 1 ? "expediente" : "expedientes"}`}
          </p>
        </div>

        {/* Buscador */}
        <div className="relative mb-5 animate-fade-in-up">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nº, compañía, asegurado…"
            className="pl-10 h-12 rounded-2xl bg-card border-border/60 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No se han encontrado siniestros</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtrados.map((s, i) => (
              <li
                key={s.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <button
                  onClick={() => onSelect(s)}
                  className="w-full text-left bg-card rounded-2xl p-4 border border-border/60 shadow-sm hover:shadow-medium hover:border-accent/40 transition-smooth group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-accent tracking-wide">
                          {s.numero}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {s.compania}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground truncate">
                        {s.asegurado}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {s.direccion}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-smooth flex-shrink-0" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
