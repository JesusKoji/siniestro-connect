import { describe, expect, it } from "vitest";
import type { Siniestro } from "@/data/siniestros";
import {
  agruparAsignadosAnual,
  filasGraficoAsignadosDiario,
  rangoFechaAnioAsignacion,
  totalAsignadosConFecha,
  totalOccidenteAsignados,
  valorBusquedaAnioFecha,
  valorBusquedaDia,
  valorBusquedaRangoMes,
} from "@/lib/asignadosSiniestros";

const siniestro = (fecha: string): Siniestro => ({
  id: fecha,
  numero: fecha,
  compania: "Demo",
  asegurado: "Demo",
  direccion: "Demo",
  fechaApertura: fecha,
  fechaAsignacion: fecha,
  tipo: "Daños",
  ramo: "Hogar",
  numeroPoliza: "POL-1",
  fechaOcurrencia: fecha,
  fechaCierre: "",
  valoracionTotal: "0",
  excluido: "0",
});

describe("agruparAsignadosAnual", () => {
  it("agrupa el total de siniestros por año", () => {
    const datos = [
      siniestro("2023-03-10"),
      siniestro("2023-11-02"),
      siniestro("2024-01-15"),
      siniestro("2025-06-01"),
      siniestro("2025-09-20"),
    ];

    expect(agruparAsignadosAnual(datos)).toEqual([
      { anio: 2025, etiqueta: "2025", total: 2 },
      { anio: 2024, etiqueta: "2024", total: 1 },
      { anio: 2023, etiqueta: "2023", total: 2 },
    ]);
    expect(totalAsignadosConFecha(datos)).toBe(5);
  });

  it("ignora siniestros sin fecha de asignación", () => {
    const datos = [
      siniestro("2024-05-01"),
      { ...siniestro(""), fechaApertura: "", fechaAsignacion: "" },
    ];

    expect(agruparAsignadosAnual(datos)).toEqual([
      { anio: 2024, etiqueta: "2024", total: 1 },
    ]);
    expect(totalAsignadosConFecha(datos)).toBe(1);
  });

  it("genera candidatos de búsqueda anual para FileMaker", () => {
    expect(rangoFechaAnioAsignacion(2025)).toBe("01/01/2025...12/31/2025");
    expect(valorBusquedaAnioFecha("dmy-rango", 2025)).toBe("01/01/2025...31/12/2025");
    expect(valorBusquedaAnioFecha("iso-rango", 2025)).toBe("2025-01-01...2025-12-31");
    expect(valorBusquedaRangoMes(3, 2025, "mes-anio")).toBe("3/2025");
    expect(valorBusquedaRangoMes(3, 2025, "mdy-rango")).toBe("03/01/2025...03/31/2025");
    expect(valorBusquedaDia(15, 3, 2025, "mdy-rango")).toBe("03/15/2025");
    expect(valorBusquedaDia(15, 3, 2025, "iso-rango")).toBe("2025-03-15");
  });

  it("suma el grupo Occident en el desglose mensual", () => {
    expect(
      totalOccidenteAsignados({
        total: 65,
        cia0001: 10,
        cia0002: 8,
        cia0210: 5,
        cia0003: 4,
        cia0347: 2,
        resto: 36,
      })
    ).toBe(29);
  });

  it("prepara filas diarias con Occident y Resto", () => {
    const filas = filasGraficoAsignadosDiario([
      {
        dia: 1,
        etiqueta: "1",
        mes: 6,
        anio: 2025,
        desglose: {
          total: 65,
          cia0001: 10,
          cia0002: 8,
          cia0210: 5,
          cia0003: 4,
          cia0347: 2,
          resto: 36,
        },
      },
    ]);

    expect(filas[0]).toMatchObject({ total: 65, occidente: 29, resto: 36 });
  });
});
