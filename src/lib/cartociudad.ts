export type CandidatoCartociudad = {
  type?: string;
  address?: string;
  tip_via?: string;
  portalNumber?: number | string | null;
  noNumber?: boolean;
  extension?: string | null;
  postalCode?: string | null;
  poblacion?: string | null;
  muni?: string | null;
  province?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  refCatastral?: string | null;
};

export type DireccionCartociudad = {
  tipo: string;
  via: string;
  direccion: string;
  numeroCalle: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;
  pais: string;
  direccionCompleta: string;
  latitud: string;
  longitud: string;
  parcelaCatastral: string;
  etiqueta: string;
};

export function tipoViaCartociudad(tipVia?: string | null) {
  const limpio = String(tipVia ?? "").trim();
  if (!limpio) return "";
  const minusculas = limpio.toLocaleLowerCase("es");
  return minusculas.charAt(0).toLocaleUpperCase("es") + minusculas.slice(1);
}

/**
 * CartoCiudad escribe el nombre local y el castellano separados por «/».
 * «MAJOR DE NATZARET / MAYOR DE NAZARET» queda como «MAYOR DE NAZARET».
 */
export function textoCastellanoCartociudad(texto: string) {
  const limpio = texto.trim();
  const barra = limpio.indexOf("/");
  if (barra < 0) return limpio;
  const izquierda = limpio.slice(0, barra).trim();
  const derecha = limpio.slice(barra + 1).trim();
  if (!izquierda || !derecha) return limpio;
  if (izquierda.toUpperCase() === "S" && derecha.toUpperCase() === "N") return limpio;
  return derecha;
}

/** «València/Valencia» queda como Valencia, el nombre que usa la ficha. */
export function provinciaCartociudad(province?: string | null) {
  return textoCastellanoCartociudad(String(province ?? ""));
}

export function nombreViaCartociudad(candidato: CandidatoCartociudad) {
  let texto = String(candidato.address ?? "").trim();
  const localidad = String(candidato.poblacion || candidato.muni || "").trim();
  if (localidad) {
    const marca = `, ${localidad}`;
    if (texto.toLocaleLowerCase("es").endsWith(marca.toLocaleLowerCase("es"))) {
      texto = texto.slice(0, texto.length - marca.length).trim();
    }
  }

  const tipo = String(candidato.tip_via ?? "").trim();
  if (tipo && texto.toLocaleLowerCase("es").startsWith(`${tipo.toLocaleLowerCase("es")} `)) {
    texto = texto.slice(tipo.length).trim();
  }

  const numero = candidato.portalNumber == null ? "" : String(candidato.portalNumber).trim();
  const extension = String(candidato.extension ?? "").trim();
  if (numero && extension && texto.endsWith(` ${numero} ${extension}`)) {
    texto = texto.slice(0, -(` ${numero} ${extension}`.length)).trim();
  }
  if (numero && texto.endsWith(` ${numero}`)) {
    texto = texto.slice(0, -(numero.length + 1)).trim();
  }
  return textoCastellanoCartociudad(texto);
}

function numeroCalleCartociudad(candidato: CandidatoCartociudad) {
  if (candidato.noNumber) return "S/N";
  const numero = candidato.portalNumber == null ? "" : String(candidato.portalNumber).trim();
  const extension = String(candidato.extension ?? "").trim();
  if (!numero) return extension;
  return extension ? `${numero} ${extension}` : numero;
}

function coordenadaCartociudad(valor: number | string | null | undefined) {
  const numero = typeof valor === "number" ? valor : Number(String(valor ?? "").trim());
  if (!Number.isFinite(numero)) return "";
  return String(Math.round(numero * 1e8) / 1e8);
}

function parcelaCartociudad(ref?: string | null) {
  const limpia = String(ref ?? "").trim().toUpperCase();
  if (limpia.length >= 14) return limpia.slice(0, 14);
  return limpia;
}

export function mapearCandidatoCartociudad(candidato: CandidatoCartociudad): DireccionCartociudad | null {
  const via = tipoViaCartociudad(candidato.tip_via);
  const direccion = nombreViaCartociudad(candidato);
  const numeroCalle = numeroCalleCartociudad(candidato);
  const codigoPostal = String(candidato.postalCode ?? "").trim();
  const poblacion = textoCastellanoCartociudad(String(candidato.poblacion || candidato.muni || ""));
  const provincia = provinciaCartociudad(candidato.province);
  const etiqueta = String(candidato.address ?? "").trim();
  if (!etiqueta && !direccion && !via) return null;

  const pais = "España";
  const direccionCompleta = [
    [via, direccion, numeroCalle].filter(Boolean).join(" "),
    [codigoPostal, poblacion].filter(Boolean).join(" "),
    provincia,
    pais,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    tipo: String(candidato.type ?? "").trim(),
    via,
    direccion,
    numeroCalle,
    codigoPostal,
    poblacion,
    provincia,
    pais,
    direccionCompleta,
    latitud: coordenadaCartociudad(candidato.lat),
    longitud: coordenadaCartociudad(candidato.lng),
    parcelaCatastral: parcelaCartociudad(candidato.refCatastral),
    etiqueta: etiqueta || direccionCompleta,
  };
}

export async function normalizarDireccionCartociudad(consulta: string) {
  const q = consulta.trim();
  if (!q) throw new Error("Introduce una dirección para normalizar");

  const res = await fetch(`/api/cartociudad/candidates?${new URLSearchParams({ q })}`);
  const data = (await res.json().catch(() => null)) as CandidatoCartociudad[] | { error?: string } | null;
  if (!res.ok) {
    const motivo = data && !Array.isArray(data) ? data.error : "";
    throw new Error(motivo || "No se pudo consultar CartoCiudad");
  }
  if (!Array.isArray(data)) throw new Error("CartoCiudad no devolvió direcciones");

  const mapeados = data
    .map((candidato) => mapearCandidatoCartociudad(candidato))
    .filter((candidato): candidato is DireccionCartociudad => Boolean(candidato));
  const portales = mapeados.filter((candidato) => candidato.tipo === "portal");
  const elegidos = portales.length ? portales : mapeados;
  if (!elegidos.length) throw new Error("CartoCiudad no encontró esa dirección");
  return elegidos;
}
