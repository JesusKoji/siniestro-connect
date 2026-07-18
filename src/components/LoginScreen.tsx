import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { autenticar } from "@/lib/filemaker";
import { Loader2, User, Lock } from "lucide-react";
import { toast } from "sonner";

interface LoginScreenProps {
  onLogin: (usuario: string) => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await autenticar(usuario, password);
      onLogin(usuario.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de acceso";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-surface flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12 safe-top">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="flex justify-center mb-10">
            <Logo size="lg" />
          </div>

          <div className="bg-card rounded-3xl p-8 shadow-medium border border-border/60">
            <h1 className="text-xl font-bold text-foreground mb-1">
              Bienvenido
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Accede a la gestión de tus siniestros
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-xs font-medium">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="tu.usuario"
                    className="pl-10 h-12 rounded-xl"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 h-12 rounded-xl"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl gradient-primary hover:opacity-95 text-primary-foreground font-semibold shadow-soft transition-smooth"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Conexión segura · FileMaker Data API
          </p>
        </div>
      </div>
    </div>
  );
};
