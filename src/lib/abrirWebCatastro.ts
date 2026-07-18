import { Poliza } from "@/data/siniestros";
import {
  abrirVentanaUrlCatastro,
  debeImprimirCroquisTrasAbrir,
  ejecutarScriptFileMakerDesdeWeb,
  parametroScriptWebCatastro,
  programarImprimirCroquisYDatos,
  referenciaCatastroPolizaWeb,
  resolverUrlWebCatastroPoliza,
} from "@/lib/catastroWeb";
import { ejecutarScriptWebCatastro, FM_CONFIG } from "@/lib/filemaker";

/** Reserva la ventana en el mismo gesto del clic (evita bloqueo de pop-ups). */
export function reservarVentanaCatastro() {
  try {
    return window.open("about:blank", "_blank");
  } catch {
    return null;
  }
}

function navegarVentanaReservada(ventana: Window | null, url: string): Window {
  if (ventana && !ventana.closed) {
    ventana.location.replace(url);
    ventana.focus();
    return ventana;
  }

  return abrirVentanaUrlCatastro(url);
}

/**
 * Abre la sede del catastro con la misma URL que el guión WebCatastro de FileMaker.
 */
export async function abrirWebCatastroPoliza(poliza: Poliza, ventanaReservada?: Window | null) {
  const ref = referenciaCatastroPolizaWeb(poliza);
  const refRaw = poliza.catastro?.toString().trim() ?? "";

  if (refRaw && !ref) {
    ventanaReservada?.close();
    throw new Error("La referencia catastral debe tener 14 (parcela) o 20 (inmueble) caracteres");
  }

  const ventana = ventanaReservada ?? null;
  const url = await resolverUrlWebCatastroPoliza(poliza);

  const ventanaCatastro = navegarVentanaReservada(ventana, url);

  if (debeImprimirCroquisTrasAbrir(poliza)) {
    programarImprimirCroquisYDatos(ventanaCatastro);
  }

  if (
    ejecutarScriptFileMakerDesdeWeb(
      FM_CONFIG.scriptWebCatastro,
      ref ? parametroScriptWebCatastro(poliza) : JSON.stringify({ imprimirCroquis: false })
    )
  ) {
    return { origen: "filemaker-webviewer" as const, url };
  }

  if (poliza.recordId && ref) {
    void ejecutarScriptWebCatastro(poliza, ref).catch(() => {
      // El guión en servidor no abre el navegador; la URL ya se abrió arriba.
    });
  }

  return {
    origen: poliza.recordId ? ("filemaker-data-api" as const) : ("navegador" as const),
    url,
  };
}
