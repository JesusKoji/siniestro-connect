import { describe, expect, it } from "vitest";
import { Poliza } from "@/data/siniestros";
import { normalizarPoliza, prepararPolizaParaFormulario } from "@/lib/normalizarPoliza";

const polizaBase = { id: "1", idAsegurado: "A1" } as Poliza;

describe("normalizarPoliza", () => {
  it("convierte campos numéricos a string", () => {
    const normalizada = normalizarPoliza({
      ...polizaBase,
      codigoPostal: 28013 as unknown as string,
      numeroCalle: 23 as unknown as string,
      direccionCompleta: 123 as unknown as string,
    });

    expect(normalizada.codigoPostal).toBe("28013");
    expect(normalizada.numeroCalle).toBe("23");
    expect(normalizada.direccionCompleta).toBe("123");
  });
});

describe("prepararPolizaParaFormulario", () => {
  it("mezcla y normaliza datos para el formulario", () => {
    const preparada = prepararPolizaParaFormulario(
      { id: "", codigoPostal: "" } as Poliza,
      { id: "POL-1", codigoPostal: 46013 as unknown as string }
    );

    expect(preparada.id).toBe("POL-1");
    expect(preparada.codigoPostal).toBe("46013");
  });
});
