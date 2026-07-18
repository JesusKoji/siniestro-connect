import { prepararReferenciaCatastroWeb } from "@/lib/catastro";
import {
  codigoMunicipioCatastroInmediato,
  partesCodigoMunicipioCatastro,
  resolverCodigoMunicipioCatastro,
} from "@/lib/codigosMunicipiosCatastro";
import { Poliza } from "@/data/siniestros";
import { textoCampo } from "@/lib/textoCampo";

export { prepararReferenciaCatastroWeb };

export const URL_CATASTRO_BUSCAR_MAPA =
  "https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?buscar=S";

/** POLIZAS::Catastro (valor del campo, sin transformar la longitud). */
export function catastroPoliza(poliza: Poliza) {
  return textoCampo(poliza.catastro);
}

/** POLIZAS::PoblacionC → clave de relación con CodigosMunicipios::Municipio. */
export function poblacionCPoliza(poliza: Poliza) {
  return textoCampo(poliza.poblacionC);
}

/** Length ( POLIZAS::Catastro ) tras quitar espacios/puntos (como se usa en la URL). */
export function longitudCatastroPoliza(poliza: Poliza) {
  const ref = prepararReferenciaCatastroWeb(poliza.catastro);
  return ref?.length ?? 0;
}

export type CasoWebCatastroPoliza = "vacio" | "inmueble20" | "parcela14" | "invalido";

export function casoWebCatastroPoliza(poliza: Poliza): CasoWebCatastroPoliza {
  if (!catastroPoliza(poliza)) return "vacio";

  const len = longitudCatastroPoliza(poliza);
  if (len === 20) return "inmueble20";
  if (len === 14) return "parcela14";
  return "invalido";
}

/** RC normalizada para la URL (POLIZAS::Catastro). */
export function referenciaCatastroPolizaWeb(poliza: Poliza) {
  return prepararReferenciaCatastroWeb(poliza.catastro);
}

declare global {
  interface Window {
    FileMaker?: {
      PerformScript?: (script: string, parameter?: string) => void;
      PerformScriptWithOption?: (script: string, parameter?: string, option?: string) => void;
    };
  }
}

/**
 * polizas_CAT_CODIGO_MUNICIPIOS::Codigo: primero el de la relación en API_Polizas,
 * si no, búsqueda en API_CodigosMunicipiosCatastro (Municipio = PoblacionC).
 */
export async function codigoMunicipioCatastroPoliza(poliza: Poliza) {
  const desdeRelacion = textoCampo(poliza.codigoMunicipioCatastro);
  if (desdeRelacion) return desdeRelacion;

  return resolverCodigoMunicipioCatastro(poblacionCPoliza(poliza));
}

export function codigoMunicipioCatastroPolizaSync(poliza: Poliza) {
  const desdeRelacion = textoCampo(poliza.codigoMunicipioCatastro);
  if (desdeRelacion) return desdeRelacion;

  return codigoMunicipioCatastroInmediato(poblacionCPoliza(poliza));
}

export class ErrorWebCatastroSinCodigoMunicipio extends Error {
  readonly poblacionC: string;

  constructor(poblacionC: string) {
    super(
      `No se encontró el código de municipio catastro para PoblacionC «${poblacionC}». ` +
        "Comprueba en FileMaker: (1) layout API_CodigosMunicipiosCatastro en Data API con un registro Municipio = " +
        "ese texto y campo Codigo; (2) layout API_Polizas con polizas_CAT_CODIGO_MUNICIPIOS::Codigo; " +
        "(3) VITE_USE_MOCK=false y sesión iniciada."
    );
    this.name = "ErrorWebCatastroSinCodigoMunicipio";
    this.poblacionC = poblacionC;
  }
}

/**
 * Case() del guión FileMaker WebCatastro.
 * - Vacío → mapa
 * - Length = 20 → OVCConCiud + Left/Right(Codigo)
 * - Length = 14 → OVCListaBienes + Left/Right(Catastro, 7)
 */
export function construirUrlWebCatastro(catastro: string, codigoMunicipio?: string) {
  const ref = textoCampo(catastro)
    .toUpperCase()
    .replace(/[\s.-]/g, "");

  if (!ref) {
    return URL_CATASTRO_BUSCAR_MAPA;
  }

  if (ref.length === 20) {
    const { del, mun } = partesCodigoMunicipioCatastro(codigoMunicipio);
    return (
      "https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?UrbRus=U&RefC=" +
      ref +
      "&esBice=&RCBice1=&RCBice2=&DenoBice=&from=OVCBusqueda&pest=rc&RCCompleta=" +
      ref +
      "&final=&del=" +
      del +
      "&mun=" +
      mun
    );
  }

  if (ref.length === 14) {
    return (
      "https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx?RC1=" +
      ref.slice(0, 7) +
      "&RC2=" +
      ref.slice(7, 14) +
      "&RC3=&RC4=&esBice=&RCBice1=&RCBice2=&DenoBice=&pest=rc&final=&RCCompleta=%20" +
      ref +
      "&from=OVCBusqueda&tipoCarto=nuevo&ZV=NO&ZR=NO&anyoZV=&strFechaVR=&tematicos=&anyotem=&historica=&coordinadas="
    );
  }

  throw new Error("La referencia catastral debe tener 14 (parcela) o 20 (inmueble) caracteres");
}

export async function resolverUrlWebCatastroPoliza(poliza: Poliza) {
  const caso = casoWebCatastroPoliza(poliza);

  if (caso === "vacio") {
    return URL_CATASTRO_BUSCAR_MAPA;
  }

  if (caso === "invalido") {
    throw new Error("La referencia catastral debe tener 14 (parcela) o 20 (inmueble) caracteres");
  }

  const ref = referenciaCatastroPolizaWeb(poliza)!;

  if (caso === "parcela14") {
    return construirUrlWebCatastro(ref);
  }

  const poblacionC = poblacionCPoliza(poliza);
  const codigo = await codigoMunicipioCatastroPoliza(poliza);

  if (!codigo && poblacionC) {
    throw new ErrorWebCatastroSinCodigoMunicipio(poblacionC);
  }

  return construirUrlWebCatastro(ref, codigo);
}

export function resolverUrlWebCatastroPolizaSync(poliza: Poliza) {
  const caso = casoWebCatastroPoliza(poliza);

  if (caso === "vacio") {
    return URL_CATASTRO_BUSCAR_MAPA;
  }

  if (caso === "invalido") {
    throw new Error("La referencia catastral debe tener 14 (parcela) o 20 (inmueble) caracteres");
  }

  const ref = referenciaCatastroPolizaWeb(poliza)!;

  if (caso === "parcela14") {
    return construirUrlWebCatastro(ref);
  }

  return construirUrlWebCatastro(ref, codigoMunicipioCatastroPolizaSync(poliza));
}

/** @deprecated Usa resolverUrlWebCatastroPoliza */
export function urlSedeElectronicaCatastro(referenciaCatastral: string, codigoMunicipio?: string) {
  return construirUrlWebCatastro(referenciaCatastral, codigoMunicipio);
}

export function puedeEjecutarScriptFileMakerDesdeWeb() {
  return typeof window.FileMaker?.PerformScript === "function";
}

export function ejecutarScriptFileMakerDesdeWeb(script: string, parameter: string) {
  if (!puedeEjecutarScriptFileMakerDesdeWeb()) return false;

  try {
    window.FileMaker!.PerformScript!(script, parameter);
    return true;
  } catch {
    return false;
  }
}

/** Misma acción que el guión WebCatastro de FileMaker tras cargar la ficha. */
export const URL_IMPRIMIR_CROQUIS_CATASTRO = "javascript:ImprimirCroquisYDatos();";

const DELAY_IMPRIMIR_CROQUIS_MS = Number(
  import.meta.env.VITE_CATASTRO_IMPRIMIR_CROQUIS_MS ?? 4500
);

/**
 * Tras cargar la sede (RC de 20 caracteres), lanza ImprimirCroquisYDatos().
 * Requiere ventana abierta sin noopener (reservarVentanaCatastro / abrirVentanaUrlCatastro).
 */
export function programarImprimirCroquisYDatos(
  ventana: Window | null,
  opciones?: { delayMs?: number; reintentos?: number }
) {
  if (!ventana) return;

  const delayMs = opciones?.delayMs ?? DELAY_IMPRIMIR_CROQUIS_MS;
  const reintentos = opciones?.reintentos ?? 2;

  const lanzar = (intento: number) => {
    if (ventana.closed) return;

    try {
      ventana.location.href = URL_IMPRIMIR_CROQUIS_CATASTRO;
    } catch {
      if (intento < reintentos) {
        window.setTimeout(() => lanzar(intento + 1), 2000);
      }
    }
  };

  window.setTimeout(() => lanzar(0), delayMs);
}

export function debeImprimirCroquisTrasAbrir(poliza: Poliza) {
  return casoWebCatastroPoliza(poliza) === "inmueble20";
}

/** Sin noopener: el opener debe poder ejecutar el javascript: de la sede. */
export function abrirVentanaUrlCatastro(url: string) {
  const ventana = window.open(url, "_blank");

  if (!ventana) {
    throw new Error(
      "El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio e inténtalo de nuevo."
    );
  }

  return ventana;
}

export async function abrirVentanaWebCatastroPoliza(poliza: Poliza) {
  const url = await resolverUrlWebCatastroPoliza(poliza);
  return abrirVentanaUrlCatastro(url);
}

export function parametroScriptWebCatastro(poliza: Poliza) {
  const ref = referenciaCatastroPolizaWeb(poliza);
  if (!ref) throw new Error("La referencia catastral no es válida");

  return JSON.stringify({
    referenciaCatastral: ref,
    RefCat: ref,
    catastro: ref,
    poblacionC: poblacionCPoliza(poliza),
    imprimirCroquis: true,
  });
}
