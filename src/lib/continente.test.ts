import { describe, expect, it } from "vitest";
import { calcularImporteContinente, formatImporteEs, parseNumeroEs } from "@/lib/continente";

describe("parseNumeroEs", () => {
  it("interpreta coma decimal", () => {
    expect(parseNumeroEs("120,5")).toBe(120.5);
  });

  it("interpreta punto de miles y coma decimal", () => {
    expect(parseNumeroEs("1.234,56")).toBe(1234.56);
  });

  it("interpreta punto decimal", () => {
    expect(parseNumeroEs("12.5")).toBe(12.5);
  });

  it("interpreta el punto como separador de miles cuando agrupa de 3 en 3", () => {
    expect(parseNumeroEs("1.234")).toBe(1234);
    expect(parseNumeroEs("1.234.567")).toBe(1234567);
  });

  it("devuelve 0 para valores vacíos o no numéricos", () => {
    expect(parseNumeroEs("")).toBe(0);
    expect(parseNumeroEs(undefined)).toBe(0);
    expect(parseNumeroEs("abc")).toBe(0);
  });

  it("acepta números", () => {
    expect(parseNumeroEs(42)).toBe(42);
  });
});

describe("calcularImporteContinente", () => {
  it("multiplica medición por precio", () => {
    expect(calcularImporteContinente("100", "600")).toBe(formatImporteEs(60000));
  });

  it("funciona con decimales en formato español", () => {
    expect(calcularImporteContinente("120,5", "10")).toBe(formatImporteEs(1205));
  });

  it("devuelve 0,00 si falta algún valor", () => {
    expect(calcularImporteContinente("", "600")).toBe(formatImporteEs(0));
  });
});
