import { describe, expect, it } from "vitest";
import { Siniestro } from "@/data/siniestros";
import {
  buildDireccionBusquedaMapaSiniestro,
  buildDireccionLibreSiniestro,
  detalleInteriorDisplaySiniestro,
  direccionVistaDisplaySiniestro,
  patchDireccionNormalizadaSiniestro,
} from "@/lib/direccionSiniestro";

const base: Siniestro = {
  id: "1",
  numero: "S-1",
  compania: "Test",
  asegurado: "Ana",
  direccion: "",
  tipo: "",
  ramo: "",
  numeroPoliza: "",
  fechaOcurrencia: "",
  fechaCierre: "",
  valoracionTotal: "",
  excluido: "0",
  fechaApertura: "",
};

describe("direccionSiniestro", () => {
  it("formatea bloque, escalera, planta y puerta abreviados", () => {
    expect(
      detalleInteriorDisplaySiniestro({
        ...base,
        bloque: "3",
        escalera: "2",
        planta: "3",
        puerta: "45",
      })
    ).toBe("Blq 3, Esc 2 Pl. 3 Pta 45");
  });

  it("compone la dirección de vista con interior y localidad", () => {
    expect(
      direccionVistaDisplaySiniestro({
        ...base,
        via: "C/",
        calle: "mayor",
        numeroCalle: "10",
        bloque: "3",
        escalera: "2",
        planta: "3",
        puerta: "45",
        codPostal: "46001",
        poblacion: "valencia",
        provincia: "valencia",
      })
    ).toBe("C/ Mayor 10 · Blq 3, Esc 2 Pl. 3 Pta 45 · 46001 Valencia Valencia");
  });

  it("excluye el interior de la búsqueda del mapa", () => {
    expect(
      buildDireccionBusquedaMapaSiniestro({
        ...base,
        via: "Av.",
        calle: "Del Puerto",
        numeroCalle: "5",
        bloque: "1",
        escalera: "A",
        codPostal: "46024",
        poblacion: "Valencia",
        provincia: "Valencia",
      })
    ).toBe("Av. Del Puerto 5, 46024 Valencia Valencia, España");
  });

  it("mapea una dirección normalizada a campos de siniestro", () => {
    expect(
      patchDireccionNormalizadaSiniestro({
        via: "C/",
        direccion: "Mayor",
        numeroCalle: "10",
        codigoPostal: "46001",
        poblacion: "Valencia",
        provincia: "Valencia",
        pais: "España",
        direccionCompleta: "C/ Mayor 10, Valencia",
      })
    ).toMatchObject({
      via: "C/",
      calle: "Mayor",
      numeroCalle: "10",
      codPostal: "46001",
      poblacion: "Valencia",
      provincia: "Valencia",
    });
  });
});
