import { useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { SiniestrosList } from "@/components/SiniestrosList";
import { SiniestroDetail } from "@/components/SiniestroDetail";
import { Siniestro } from "@/data/siniestros";
import { cerrarSesion } from "@/lib/filemaker";

type Vista = "login" | "lista" | "detalle";

export const MobileApp = () => {
  const [vista, setVista] = useState<Vista>("login");
  const [seleccionado, setSeleccionado] = useState<Siniestro | null>(null);

  const logout = () => {
    cerrarSesion();
    setSeleccionado(null);
    setVista("login");
  };

  if (vista === "login") {
    return <LoginScreen onLogin={() => setVista("lista")} />;
  }

  if (vista === "detalle" && seleccionado) {
    return (
      <SiniestroDetail
        siniestro={seleccionado}
        onBack={() => setVista("lista")}
        onLogout={logout}
      />
    );
  }

  return (
    <SiniestrosList
      onSelect={(s) => {
        setSeleccionado(s);
        setVista("detalle");
      }}
      onLogout={logout}
    />
  );
};
