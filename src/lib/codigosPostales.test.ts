import { describe, expect, it } from "vitest";
import {
  buscarLocalidadesPorCodigoPostal,
  listarPoblacionesCodigosPostales,
  listarProvinciasCodigosPostales,
  resolverLocalidadUnica,
} from "@/lib/codigosPostales";

describe("codigosPostales (mock)", () => {
  it("resuelve población y provincia por código postal", async () => {
    const localidades = await buscarLocalidadesPorCodigoPostal("46006");
    expect(resolverLocalidadUnica(localidades)).toEqual({
      codigoPostal: "46006",
      poblacion: "Valencia",
      provincia: "Valencia",
    });
  });

  it("resuelve otro código postal de Valencia", async () => {
    const localidades = await buscarLocalidadesPorCodigoPostal("46013");
    expect(resolverLocalidadUnica(localidades)).toEqual({
      codigoPostal: "46013",
      poblacion: "Valencia",
      provincia: "Valencia",
    });
  });

  it("lista poblaciones filtradas por provincia", async () => {
    const poblaciones = await listarPoblacionesCodigosPostales("Valencia", "ches");
    expect(poblaciones).toContain("Cheste");
  });

  it("lista provincias", async () => {
    const provincias = await listarProvinciasCodigosPostales();
    expect(provincias).toContain("Valencia");
    expect(provincias).toContain("Madrid");
  });
});
