import { CatastroDt, prepararReferenciaCatastroWeb } from "@/lib/catastro";
import {
  codigoMunicipioCatastroInmediato,
  partesCodigoMunicipioCatastro,
  resolverCodigoMunicipioCatastro,
} from "@/lib/codigosMunicipiosCatastro";
import { Poliza } from "@/data/siniestros";
import { textoCampo } from "@/lib/textoCampo";
import { anticiparCarpetaPortatil, guardarDocumentoEnPortatil } from "@/lib/guardarDocSiniestroNavegador";

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

export function delegacionMunicipioParaDescarga(dt: CatastroDt | undefined, poliza: Poliza) {
  const delDt = textoCampo(dt?.loine?.cp);
  const munDt = textoCampo(dt?.loine?.cm);
  if (delDt && munDt) return { del: delDt, mun: munDt };

  return partesCodigoMunicipioCatastro(codigoMunicipioCatastroPolizaSync(poliza));
}

export type DocumentoNormalizacionCatastro = {
  tipo: "pdf" | "excel";
  ruta: string;
  nombre: string;
};

/** Inmueble (20): PDF de consulta descriptiva y gráfica. Parcela (14): Excel de referencias. */
export function documentoNormalizacionCatastro(
  referencia: string,
  del: string,
  mun: string
): DocumentoNormalizacionCatastro | null {
  const ref = prepararReferenciaCatastroWeb(referencia);
  if (!ref) return null;

  if (ref.length === 20) {
    if (!del || !mun) return null;
    return {
      tipo: "pdf",
      ruta: `/api/catastro/consulta-pdf?${new URLSearchParams({ del, mun, ref })}`,
      nombre: `${ref}.pdf`,
    };
  }

  if (ref.length === 14) {
    return {
      tipo: "excel",
      ruta: `/api/catastro/lista-excel?${new URLSearchParams({ rc: ref })}`,
      nombre: `Listado_inmuebles_${ref}.xlsx`,
    };
  }

  return null;
}

function guardarDescarga(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // La imagen satélite pesa más que el Excel: revocar al momento cancela esa descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type ResultadoDescargaCatastro = { destino: "doc"; ruta: string } | { destino: "descarga" };

/** La carpeta del siniestro está en el portátil que abre la web, no en el servidor. */
export function anticiparCarpetaDocPortatil() {
  anticiparCarpetaPortatil();
}

async function guardarBlobCatastro(
  blob: Blob,
  nombre: string,
  numerosSiniestro?: string[]
): Promise<ResultadoDescargaCatastro> {
  if (!numerosSiniestro?.length) {
    guardarDescarga(blob, nombre);
    return { destino: "descarga" };
  }

  try {
    const guardado = await guardarDocumentoEnPortatil(blob, nombre, numerosSiniestro);
    if (guardado.destino === "descarga") guardarDescarga(blob, nombre);
    return guardado;
  } catch (error) {
    guardarDescarga(blob, nombre);
    const motivo = error instanceof Error ? error.message : "No se pudo guardar en la carpeta del siniestro";
    throw new Error(`${motivo}. El archivo se ha descargado en el navegador.`);
  }
}

export async function descargarDocumentoNormalizacionCatastro(
  doc: DocumentoNormalizacionCatastro,
  numerosSiniestro?: string[]
) {
  const res = await fetch(doc.ruta);
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "No se pudo descargar el documento del catastro");
  }

  return guardarBlobCatastro(await res.blob(), doc.nombre, numerosSiniestro);
}

export function referenciaParcelaMapa(referencia: string) {
  const ref = prepararReferenciaCatastroWeb(referencia);
  if (!ref || (ref.length !== 14 && ref.length !== 20)) return null;
  return ref.slice(0, 14);
}

export function nombreVistaSateliteCatastro(referencia: string) {
  const ref = prepararReferenciaCatastroWeb(referencia);
  if (!ref || (ref.length !== 14 && ref.length !== 20)) return null;
  return `Cartografia_${ref}.pdf`;
}

/** Cartografía del catastro con ortofoto, la misma vista de la opción Cartografía. */
export async function descargarVistaSateliteCatastro(referencia: string, numerosSiniestro?: string[]) {
  const nombre = nombreVistaSateliteCatastro(referencia);
  const ref = prepararReferenciaCatastroWeb(referencia);
  if (!nombre || !ref) return null;

  const res = await fetch(`/api/catastro/vista-satelite?rc=${encodeURIComponent(ref)}`);
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "No se pudo descargar la vista satélite del catastro");
  }

  return guardarBlobCatastro(await res.blob(), nombre, numerosSiniestro);
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
