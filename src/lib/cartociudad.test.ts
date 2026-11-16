import { describe, expect, it } from "vitest";
import { mapearCandidatoCartociudad, type CandidatoCartociudad } from "@/lib/cartociudad";

const portalValencia: CandidatoCartociudad = {
  type: "portal",
  address: "CALLE MAJOR DE NATZARET / MAYOR DE NAZARET 12, València",
  tip_via: "CALLE",
  portalNumber: 12,
  postalCode: "46024",
  poblacion: "València",
  province: "València/Valencia",
  lat: 39.453378824490336,
  lng: -0.3334496789822456,
  refCatastral: "9406406YJ2790F",
};

describe("dirección de asegurado con CartoCiudad", () => {
  it("separa vía, nombre, número, localidad, coordenadas y parcela", () => {
    const direccion = mapearCandidatoCartociudad(portalValencia);
    expect(direccion).toMatchObject({
      via: "Calle",
      direccion: "MAYOR DE NAZARET",
      numeroCalle: "12",
      codigoPostal: "46024",
      poblacion: "València",
      provincia: "Valencia",
      latitud: "39.45337882",
      longitud: "-0.33344968",
      parcelaCatastral: "9406406YJ2790F",
    });
  });

  it("se queda con el nombre en castellano cuando vienen dos separados por una barra", () => {
    expect(
      mapearCandidatoCartociudad({
        address: "PLAZA AJUNTAMENT / AYUNTAMIENTO 1, València",
        tip_via: "PLAZA",
        portalNumber: 1,
        poblacion: "València",
      })?.direccion
    ).toBe("AYUNTAMIENTO");
    expect(
      mapearCandidatoCartociudad({
        address: "KALEA KALE BARRIA/CALLE NUEVA 1, Donostia/San Sebastián",
        tip_via: "KALEA",
        portalNumber: 1,
        poblacion: "Donostia/San Sebastián",
      })
    ).toMatchObject({ direccion: "CALLE NUEVA", poblacion: "San Sebastián" });
  });

  it("quita el número y la población del nombre de la vía", () => {
    expect(
      mapearCandidatoCartociudad({
        type: "portal",
        address: "CALLE MAYOR 12, Valencia del Ventoso",
        tip_via: "CALLE",
        portalNumber: 12,
        poblacion: "Valencia del Ventoso",
        province: "Badajoz",
        refCatastral: "1287913QC2318N",
      })?.direccion
    ).toBe("MAYOR");
  });

  it("guarda el número con su extensión", () => {
    const direccion = mapearCandidatoCartociudad({
      type: "portal",
      address: "CALLE MAYOR 10 12, Alfaro",
      tip_via: "CALLE",
      portalNumber: 10,
      extension: "12",
      poblacion: "Alfaro",
      province: "La Rioja",
    });
    expect(direccion?.direccion).toBe("MAYOR");
    expect(direccion?.numeroCalle).toBe("10 12");
  });

  it("guarda los 14 caracteres de la parcela cuando llega una referencia de inmueble", () => {
    expect(
      mapearCandidatoCartociudad({
        address: "CALLE MAYOR 1, Madrid",
        tip_via: "CALLE",
        portalNumber: 1,
        poblacion: "Madrid",
        refCatastral: "1234567AB1234C0001XY",
      })?.parcelaCatastral
    ).toBe("1234567AB1234C");
  });
});
