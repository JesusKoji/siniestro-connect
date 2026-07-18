import { Poliza } from "@/data/siniestros";
import { DireccionNormalizada } from "@/lib/geocode";
import { textoCampo } from "@/lib/textoCampo";

export type TipoDireccionPoliza = "riesgo" | "catastro";

type CamposDireccion = {
  via: keyof Poliza;
  direccion: keyof Poliza;
  numeroCalle: keyof Poliza;
  bloque: keyof Poliza;
  escalera: keyof Poliza;
  planta: keyof Poliza;
  puerta: keyof Poliza;
  codigoPostal: keyof Poliza;
  poblacion: keyof Poliza;
  provincia: keyof Poliza;
  direccionCompleta?: keyof Poliza;
  nombreVia?: keyof Poliza;
};

export const CAMPOS_DIRECCION: Record<TipoDireccionPoliza, CamposDireccion> = {
  riesgo: {
    via: "via",
    direccion: "direccion",
    numeroCalle: "numeroCalle",
    bloque: "bloque",
    escalera: "escalera",
    planta: "planta",
    puerta: "puerta",
    codigoPostal: "codigoPostal",
    poblacion: "poblacion",
    provincia: "provincia",
    direccionCompleta: "direccionCompleta",
  },
  catastro: {
    nombreVia: "nombreViaC",
    via: "viaC",
    direccion: "direccionC",
    numeroCalle: "numeroCalleC",
    bloque: "bloqueC",
    escalera: "escaleraC",
    planta: "plantaC",
    puerta: "puertaC",
    codigoPostal: "codigoPostalC",
    poblacion: "poblacionC",
    provincia: "provinciaC",
  },
};

export function leerCampoDireccion(poliza: Poliza, tipo: TipoDireccionPoliza, campo: keyof CamposDireccion): string {
  const key = CAMPOS_DIRECCION[tipo][campo];
  if (!key) return "";
  return textoCampo(poliza[key as keyof Poliza]);
}

function tieneDireccionEstructuradaPoliza(poliza: Poliza, tipo: TipoDireccionPoliza): boolean {
  if (tipo === "catastro") {
    return Boolean(
      textoCampo(poliza.nombreViaC) ||
        leerCampoDireccion(poliza, tipo, "via") ||
        leerCampoDireccion(poliza, tipo, "direccion") ||
        leerCampoDireccion(poliza, tipo, "numeroCalle") ||
        leerCampoDireccion(poliza, tipo, "codigoPostal") ||
        leerCampoDireccion(poliza, tipo, "poblacion")
    );
  }

  return Boolean(
    leerCampoDireccion(poliza, tipo, "via") ||
      leerCampoDireccion(poliza, tipo, "direccion") ||
      leerCampoDireccion(poliza, tipo, "numeroCalle") ||
      leerCampoDireccion(poliza, tipo, "codigoPostal") ||
      leerCampoDireccion(poliza, tipo, "poblacion")
  );
}

export function buildDireccionLibrePoliza(poliza: Poliza, tipo: TipoDireccionPoliza = "riesgo"): string {
  const direccionCompleta = textoCampo(poliza.direccionCompleta);

  if (tipo === "catastro") {
    const nombreVia = textoCampo(poliza.nombreViaC);
    if (nombreVia) {
      return [
        nombreVia,
        textoCampo(poliza.numeroCalleC),
        textoCampo(poliza.codigoPostalC),
        textoCampo(poliza.poblacionC),
        textoCampo(poliza.provinciaC),
      ]
        .filter(Boolean)
        .join(" ");
    }
  }

  if (tipo === "riesgo" && direccionCompleta && !tieneDireccionEstructuradaPoliza(poliza, tipo)) {
    return direccionCompleta;
  }

  return [
    leerCampoDireccion(poliza, tipo, "via"),
    leerCampoDireccion(poliza, tipo, "direccion"),
    leerCampoDireccion(poliza, tipo, "numeroCalle"),
    leerCampoDireccion(poliza, tipo, "codigoPostal"),
    leerCampoDireccion(poliza, tipo, "poblacion"),
    leerCampoDireccion(poliza, tipo, "provincia"),
  ]
    .filter(Boolean)
    .join(" ");
}

function componerDireccionNormalizadaPoliza(
  poliza: Poliza,
  tipo: TipoDireccionPoliza
): string {
  const via = leerCampoDireccion(poliza, tipo, "via");
  const direccion = leerCampoDireccion(poliza, tipo, "direccion");
  const numero = leerCampoDireccion(poliza, tipo, "numeroCalle");
  const bloque = leerCampoDireccion(poliza, tipo, "bloque");
  const escalera = leerCampoDireccion(poliza, tipo, "escalera");
  const planta = leerCampoDireccion(poliza, tipo, "planta");
  const puerta = leerCampoDireccion(poliza, tipo, "puerta");
  const cp = leerCampoDireccion(poliza, tipo, "codigoPostal");
  const poblacion = leerCampoDireccion(poliza, tipo, "poblacion");
  const provincia = leerCampoDireccion(poliza, tipo, "provincia");

  const nombreViaC = textoCampo(poliza.nombreViaC);
  const calle =
    tipo === "catastro" && nombreViaC
      ? nombreViaC
      : [via, direccion, numero].filter(Boolean).join(" ");

  return [
    calle,
    [
      bloque ? `Bloque ${bloque}` : "",
      escalera ? `Esc. ${escalera}` : "",
      planta ? `Planta ${planta}` : "",
      puerta ? `Puerta ${puerta}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    [cp, poblacion].filter(Boolean).join(" "),
    provincia,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function buildDireccionNormalizadaPoliza(
  poliza: Poliza,
  tipo: TipoDireccionPoliza = "riesgo"
): string {
  const direccionCompleta = textoCampo(poliza.direccionCompleta);
  const compuesta = componerDireccionNormalizadaPoliza(poliza, tipo);

  if (compuesta) return compuesta;
  if (tipo === "riesgo" && direccionCompleta) return direccionCompleta;

  return "";
}

export function buildDireccionBusquedaMapaPoliza(
  poliza: Poliza,
  tipo: TipoDireccionPoliza = "riesgo"
): string {
  const via = leerCampoDireccion(poliza, tipo, "via");
  const direccion = leerCampoDireccion(poliza, tipo, "direccion");
  const numero = leerCampoDireccion(poliza, tipo, "numeroCalle");
  const cp = leerCampoDireccion(poliza, tipo, "codigoPostal");
  const poblacion = leerCampoDireccion(poliza, tipo, "poblacion");
  const provincia = leerCampoDireccion(poliza, tipo, "provincia");

  const nombreViaC = textoCampo(poliza.nombreViaC);
  const calle =
    tipo === "catastro" && nombreViaC
      ? nombreViaC
      : [via, direccion, numero].filter(Boolean).join(" ");

  return [calle, [cp, poblacion].filter(Boolean).join(" "), provincia, "España"]
    .filter(Boolean)
    .join(", ");
}

export function construirConsultaDesdeCatastro(poliza: Poliza): string {
  const calle =
    textoCampo(poliza.nombreViaC) ||
    [textoCampo(poliza.viaC), textoCampo(poliza.direccionC)].filter(Boolean).join(" ");

  if (!calle && !textoCampo(poliza.codigoPostalC) && !textoCampo(poliza.poblacionC)) return "";

  const partes = [calle].filter(Boolean);
  const numeroCalleC = textoCampo(poliza.numeroCalleC);
  if (numeroCalleC && !calle.includes(numeroCalleC)) {
    partes[0] = `${calle} ${numeroCalleC}`.trim();
  }
  if (textoCampo(poliza.codigoPostalC)) partes.push(textoCampo(poliza.codigoPostalC));
  if (textoCampo(poliza.poblacionC)) partes.push(textoCampo(poliza.poblacionC));
  if (textoCampo(poliza.provinciaC)) partes.push(textoCampo(poliza.provinciaC));
  partes.push("España");

  return partes.join(", ");
}

export function aplicarDireccionNormalizada(
  poliza: Poliza,
  data: DireccionNormalizada & { googleFormattedAddress?: string },
  tipo: TipoDireccionPoliza
): Partial<Poliza> {
  const campos = CAMPOS_DIRECCION[tipo];
  const actualizado: Partial<Poliza> = {
    [campos.via]: data.via || "",
    [campos.direccion]: data.direccion || "",
    [campos.numeroCalle]: data.numeroCalle || "",
    [campos.bloque]: data.bloque || "",
    [campos.escalera]: data.escalera || "",
    [campos.planta]: data.planta || "",
    [campos.puerta]: data.puerta || "",
    [campos.codigoPostal]: data.codigoPostal || "",
    [campos.poblacion]: data.poblacion || "",
    [campos.provincia]: data.provincia || "",
  };

  if (tipo === "catastro" && campos.nombreVia) {
    actualizado[campos.nombreVia] =
      [data.via, data.direccion].filter(Boolean).join(" ").trim() ||
      data.direccionCompleta ||
      data.googleFormattedAddress ||
      "";
  }

  if (tipo === "riesgo" && campos.direccionCompleta) {
    actualizado[campos.direccionCompleta] =
      data.direccionCompleta || data.googleFormattedAddress || buildDireccionLibrePoliza({ ...poliza, ...actualizado }, tipo);
  }

  return actualizado;
}

export function tieneDatosCatastro(poliza: Poliza): boolean {
  return Boolean(
    textoCampo(poliza.nombreViaC) ||
      textoCampo(poliza.viaC) ||
      textoCampo(poliza.direccionC) ||
      textoCampo(poliza.numeroCalleC) ||
      textoCampo(poliza.codigoPostalC) ||
      textoCampo(poliza.poblacionC)
  );
}
