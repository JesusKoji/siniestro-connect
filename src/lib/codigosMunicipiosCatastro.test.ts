import { describe, expect, it } from "vitest";
import {
  CAMPO_CODIGO_CATASTRO,
  CAMPO_MUNICIPIO_CATASTRO,
  municipioIgualPoblacionC,
  partesCodigoMunicipioCatastro,
} from "@/lib/codigosMunicipiosCatastro";

describe("API_CodigosMunicipiosCatastro", () => {
  it("usa los campos Municipio y Codigo del layout", () => {
    expect(CAMPO_MUNICIPIO_CATASTRO).toBe("Municipio");
    expect(CAMPO_CODIGO_CATASTRO).toBe("Codigo");
  });

  it("partes del código 46900 coinciden con Left=46 y Right=900", () => {
    expect(partesCodigoMunicipioCatastro("46900")).toEqual({ del: "46", mun: "900" });
  });

  it("Municipio debe ser igual a PoblacionC (sin coincidencias parciales)", () => {
    expect(municipioIgualPoblacionC("Mislata", "Mislata")).toBe(true);
    expect(municipioIgualPoblacionC("MISLATA", "mislata")).toBe(true);
    expect(municipioIgualPoblacionC("Valencia", "Mislata")).toBe(false);
    expect(municipioIgualPoblacionC("Cheste", "Valencia")).toBe(false);
  });
});
