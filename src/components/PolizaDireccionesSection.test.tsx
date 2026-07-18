import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PolizaDireccionesSection } from "@/components/PolizaDireccionesSection";
import { Poliza } from "@/data/siniestros";
import {
  esConsultaCatastroPorReferencia,
  puedeConsultarCatastroOficial,
} from "@/lib/catastro";
import { buildDireccionLibrePoliza } from "@/lib/direccionPoliza";

vi.mock("@/lib/codigosPostales", () => ({
  buscarLocalidadesPorCodigoPostal: vi.fn().mockResolvedValue([]),
  normalizarCp: (value: unknown) => String(value ?? "").replace(/\D/g, "").slice(0, 5),
}));

const polizaFm: Poliza = {
  id: "POL-1",
  recordId: "rec-1",
  idAsegurado: "ASEG-1",
  idRamo: "RAMO-1",
  idCompania: "COMP-1",
  asegurado: "Test Asegurado",
  compania: "Mapfre",
  numeroPoliza: "POL-2025-001",
  ramo: "Hogar",
  tipoRamo: "Vivienda",
  direccionCompleta: "C/ Mayor 23 · 28013 Madrid" as unknown as string,
  via: "Calle",
  direccion: "Mayor",
  numeroCalle: 23 as unknown as string,
  bloque: "",
  escalera: "",
  planta: "",
  puerta: "",
  codigoPostal: 28013 as unknown as string,
  poblacion: "Madrid",
  provincia: "Madrid",
  nombreViaC: "Mayor",
  viaC: "CL",
  direccionC: 89 as unknown as string,
  numeroCalleC: 89 as unknown as string,
  bloqueC: "",
  escaleraC: "",
  plantaC: "",
  puertaC: "",
  codigoPostalC: 46013 as unknown as string,
  poblacionC: "Valencia",
  provinciaC: "Valencia",
  catastro: "8744402XJ9784S0001DW",
  anoConstruccion: 1985 as unknown as string,
  fechaEfecto: "2025-01-01",
  nSiniestros: "0",
  agente: "",
  telefonoAgente: "",
  emailAgente: "",
  descripcion: "",
  informacion: "",
  comentarios: "",
  distancia: "12.5",
  latitud: "",
  longitud: "",
};

describe("PolizaDireccionesSection edit mode", () => {
  it("monta el editor con campos numéricos de FileMaker", () => {
    expect(() => buildDireccionLibrePoliza(polizaFm, "riesgo")).not.toThrow();
    expect(() => puedeConsultarCatastroOficial(polizaFm)).not.toThrow();
    expect(() => esConsultaCatastroPorReferencia(polizaFm)).not.toThrow();

    render(
      <PolizaDireccionesSection
        poliza={polizaFm}
        mode="edit"
        onChange={() => undefined}
        onApplyFields={() => undefined}
      />
    );

    expect(screen.getByText("Normalizar dirección")).toBeTruthy();
  });
});
