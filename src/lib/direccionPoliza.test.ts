import { describe, expect, it } from "vitest";
import {
  aplicarDireccionNormalizada,
  buildDireccionBusquedaMapaPoliza,
  buildDireccionLibrePoliza,
  buildDireccionNormalizadaPoliza,
  construirConsultaDesdeCatastro,
} from "@/lib/direccionPoliza";
import { Poliza } from "@/data/siniestros";

const polizaBase: Poliza = {
  id: "1",
  idAsegurado: "A1",
  idRamo: "",
  idCompania: "",
  asegurado: "",
  compania: "",
  numeroPoliza: "",
  ramo: "",
  tipoRamo: "",
  direccionCompleta: "",
  via: "",
  direccion: "",
  numeroCalle: "",
  bloque: "",
  escalera: "",
  planta: "",
  puerta: "",
  codigoPostal: "",
  poblacion: "",
  provincia: "",
  nombreViaC: "",
  viaC: "",
  direccionC: "",
  numeroCalleC: "",
  bloqueC: "",
  escaleraC: "",
  plantaC: "",
  puertaC: "",
  codigoPostalC: "",
  poblacionC: "",
  provinciaC: "",
  catastro: "",
  anoConstruccion: "",
  fechaEfecto: "",
  nSiniestros: "",
  agente: "",
  telefonoAgente: "",
  emailAgente: "",
  descripcion: "",
  informacion: "",
  comentarios: "",
  distancia: "",
  latitud: "",
  longitud: "",
};

describe("construirConsultaDesdeCatastro", () => {
  it("monta consulta con nombre de vía, número y población", () => {
    expect(
      construirConsultaDesdeCatastro({
        ...polizaBase,
        nombreViaC: "Campillo",
        numeroCalleC: "89",
        codigoPostalC: "46380",
        poblacionC: "Cheste",
        provinciaC: "Valencia",
      })
    ).toBe("Campillo 89, 46380, Cheste, Valencia, España");
  });
});

describe("aplicarDireccionNormalizada catastro", () => {
  it("rellena campos C del catastro", () => {
    const result = aplicarDireccionNormalizada(
      polizaBase,
      {
        via: "Calle",
        direccion: "Campillo",
        numeroCalle: "89",
        codigoPostal: "46380",
        poblacion: "Cheste",
        provincia: "Valencia",
        direccionCompleta: "Calle Campillo 89, Cheste",
      },
      "catastro"
    );

    expect(result.viaC).toBe("Calle");
    expect(result.direccionC).toBe("Campillo");
    expect(result.nombreViaC).toBe("Calle Campillo");
    expect(result.poblacionC).toBe("Cheste");
  });
});

describe("buildDireccionLibrePoliza", () => {
  it("prioriza nombreViaC en catastro", () => {
    expect(
      buildDireccionLibrePoliza(
        {
          ...polizaBase,
          nombreViaC: "Campillo",
          numeroCalleC: "89",
          poblacionC: "Cheste",
        },
        "catastro"
      )
    ).toBe("Campillo 89 Cheste");
  });

  it("tolera direccionCompleta numérica de FileMaker", () => {
    expect(
      buildDireccionLibrePoliza(
        {
          ...polizaBase,
          direccionCompleta: 28013 as unknown as string,
        },
        "riesgo"
      )
    ).toBe("28013");
  });
});

describe("buildDireccionNormalizadaPoliza", () => {
  it("tolera codigoPostal numérico al montar dirección", () => {
    expect(
      buildDireccionNormalizadaPoliza({
        ...polizaBase,
        via: "Calle",
        direccion: "Mayor",
        numeroCalle: "23",
        codigoPostal: 28013 as unknown as string,
        poblacion: "Madrid",
        provincia: "Madrid",
      })
    ).toBe("Calle Mayor 23 · 28013 Madrid · Madrid");
  });

  it("incluye el tipo de vía aunque exista direccionCompleta sin él", () => {
    expect(
      buildDireccionNormalizadaPoliza({
        ...polizaBase,
        via: "Calle",
        direccion: "Mayor",
        numeroCalle: "23",
        direccionCompleta: "Mayor 23 · 28013 Madrid",
        codigoPostal: "28013",
        poblacion: "Madrid",
        provincia: "Madrid",
      })
    ).toBe("Calle Mayor 23 · 28013 Madrid · Madrid");
  });
});
