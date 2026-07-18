import { describe, expect, it } from "vitest";
import {
  construirConsultaGeocodificacion,
  DIRECCION_REFERENCIA_OFICINA,
} from "@/lib/distanciaPoliza";

describe("construirConsultaGeocodificacion", () => {
  it("incluye población y código postal cuando vienen por separado", () => {
    expect(
      construirConsultaGeocodificacion({
        via: "Calle",
        direccion: "Campillo",
        numeroCalle: "89",
        codigoPostal: "46380",
        poblacion: "Cheste",
        provincia: "Valencia",
      })
    ).toBe("Calle Campillo 89, 46380, Cheste, Valencia, España");
  });

  it("completa direccionCompleta con población ausente en el texto", () => {
    expect(
      construirConsultaGeocodificacion({
        direccionCompleta: "Campillo 89",
        poblacion: "Cheste",
        provincia: "Valencia",
        codigoPostal: "46380",
      })
    ).toBe("Campillo 89, 46380, Cheste, Valencia, España");
  });
});

describe("DIRECCION_REFERENCIA_OFICINA", () => {
  it("incluye código postal y provincia", () => {
    expect(DIRECCION_REFERENCIA_OFICINA).toContain("46013");
    expect(DIRECCION_REFERENCIA_OFICINA).toContain("Valencia");
  });
});
