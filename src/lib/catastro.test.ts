import { describe, expect, it } from "vitest";
import {
  agregarDetallesUsosPorTipo,
  calcularSuperficieTotalDesdeDetallesUsos,
  calcularSuperficieTotalDesdeUsosJson,
  detallesCatastroDesdeUsosParcelaJson,
  extraerDatosDnprcPorRc20,
  extraerUsosJsonDesdeConsultaDnprc,
  resolverSuperficieConstruidaTotalCatastro,
  sumarUsosJsonParcela,
  esConsultaCatastroPorReferencia,
  esReferenciaParcela,
  candidatoPreferidoDireccionCatastro,
  mapDtCatastroAPoliza,
  normalizarReferenciaCatastral,
  parametrosConsultaCatastro,
  parametrosConsultaCatastroPorReferencia,
  referenciaParcelaDesdeReferencia,
  filtrarDetallesUsosConstructivos,
  parseConsultaCatastro,
  parseConsultaDnpLoc,
  siglaDesdeVia,
} from "@/lib/catastro";
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
  nombreViaC: "Calle Campillo",
  viaC: "Calle",
  direccionC: "Campillo",
  numeroCalleC: "89",
  bloqueC: "",
  escaleraC: "",
  plantaC: "",
  puertaC: "",
  codigoPostalC: "",
  poblacionC: "Cheste",
  provinciaC: "Valencia",
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

describe("normalizarReferenciaCatastral", () => {
  it("acepta referencias de 14 y 20 caracteres", () => {
    expect(normalizarReferenciaCatastral("8744402XJ9784S")).toBe("8744402XJ9784S");
    expect(normalizarReferenciaCatastral("8744402XJ9784S0001DW")).toBe("8744402XJ9784S0001DW");
    expect(normalizarReferenciaCatastral("8744402 XJ9784S 0001 DW")).toBe("8744402XJ9784S0001DW");
  });

  it("acepta referencias rústicas con letras en el bloque territorial", () => {
    expect(normalizarReferenciaCatastral("13053A15300015")).toBe("13053A15300015");
    expect(normalizarReferenciaCatastral("13053A153000150000YA")).toBe("13053A153000150000YA");
  });

  it("rechaza referencias inválidas", () => {
    expect(normalizarReferenciaCatastral("123")).toBeNull();
    expect(normalizarReferenciaCatastral("")).toBeNull();
  });
});

describe("consulta por referencia catastral", () => {
  it("detecta consulta por referencia en la póliza", () => {
    expect(esConsultaCatastroPorReferencia({ ...polizaBase, catastro: "8744402XJ9784S0001DW" })).toBe(true);
    expect(esConsultaCatastroPorReferencia(polizaBase)).toBe(false);
  });

  it("genera parámetros de consulta por referencia", () => {
    expect(
      parametrosConsultaCatastroPorReferencia({ ...polizaBase, catastro: "8744402 XJ9784S" })
    ).toEqual({ RefCat: "8744402XJ9784S" });
  });

  it("parsea respuesta Consulta_DNPRC", () => {
    const payload = {
      consulta_dnprcResult: {
        bico: {
          bi: {
            idbi: { rc: { pc1: "8744402", pc2: "XJ9784S", car: "0001", cc1: "D", cc2: "W" } },
            dt: {
              np: "VALENCIA",
              nm: "CHESTE",
              ldt: "CL CAMPILLO 89 46380 CHESTE (VALENCIA)",
              locs: {
                lous: {
                  lourb: {
                    dir: { tv: "PL", nv: "INDUSTRIAL NORTE", pnp: "12" },
                    dp: "46380",
                  },
                },
              },
            },
            debi: { ant: "2005" },
          },
        },
      },
    };

    const resultado = parseConsultaCatastro(payload);
    expect(resultado.candidatos).toHaveLength(1);
    expect(resultado.candidatos[0].campos).toMatchObject({
      viaC: "Poligono",
      direccionC: "Industrial Norte",
      catastro: "8744402XJ9784S0001DW",
      anoConstruccion: "2005",
    });
    expect(parseConsultaDnpLoc(payload)).toEqual(resultado);
  });
});

describe("parametrosConsultaCatastro", () => {
  it("genera parámetros REST del catastro", () => {
    expect(parametrosConsultaCatastro(polizaBase)).toEqual({
      Provincia: "VALENCIA",
      Municipio: "CHESTE",
      Sigla: "CL",
      Calle: "CAMPILLO",
      Numero: "89",
    });
  });

  it("tolera campos numéricos de FileMaker", () => {
    expect(
      parametrosConsultaCatastro({
        ...polizaBase,
        direccionC: 89 as unknown as string,
        numeroCalleC: 89 as unknown as string,
      })
    ).toEqual({
      Provincia: "VALENCIA",
      Municipio: "CHESTE",
      Sigla: "CL",
      Calle: "CAMPILLO",
      Numero: "89",
    });
  });
});

describe("siglaDesdeVia", () => {
  it("convierte nombre de vía a sigla catastral", () => {
    expect(siglaDesdeVia("Calle")).toBe("CL");
    expect(siglaDesdeVia("Avenida")).toBe("AV");
  });
});

describe("parseConsultaDnpLoc", () => {
  it("mapea un inmueble único del catastro", () => {
    const payload = {
      consulta_dnplocResult: {
        control: { cudnp: 1 },
        bico: {
          bi: {
            idbi: { rc: { pc1: "8744402", pc2: "XJ9784S", car: "0001", cc1: "D", cc2: "W" } },
            dt: {
              np: "VALENCIA",
              nm: "CHESTE",
              ldt: "CL CAMPILLO 89 46380 CHESTE (VALENCIA)",
              locs: {
                lous: {
                  lourb: {
                    dir: { tv: "CL", nv: "CAMPILLO", pnp: "89" },
                    loint: { es: "T", pt: "OD", pu: "OS" },
                    dp: "46380",
                  },
                },
              },
            },
            debi: { luso: "Residencial", ant: "1998", sfc: "430" },
          },
        },
      },
    };

    const resultado = parseConsultaDnpLoc(payload);
    expect(resultado.candidatos).toHaveLength(1);
    expect(resultado.candidatos[0].campos).toMatchObject({
      viaC: "Calle",
      direccionC: "Campillo",
      numeroCalleC: "89",
      codigoPostalC: "46380",
      poblacionC: "Cheste",
      provinciaC: "Valencia",
      catastro: "8744402XJ9784S0001DW",
      anoConstruccion: "1998",
    });
    expect(resultado.candidatos[0].referenciaCatastral).toBe("8744402XJ9784S0001DW");
    expect(resultado.candidatos[0].detalleCatastro).toMatchObject({
      referenciaCatastral: "8744402XJ9784S0001DW",
      tipoUso: "Residencial",
      superficieConstruida: "430",
    });
  });

  it("desglosa varias unidades constructivas cuando solo hay calle y número", () => {
    const payload = {
      consulta_dnplocResult: {
        bico: {
          bi: {
            idbi: { rc: { pc1: "8744402", pc2: "XJ9784S", car: "0001", cc1: "D", cc2: "W" } },
            dt: {
              np: "VALENCIA",
              nm: "CHESTE",
              ldt: "CL CAMPILLO 89 46380 CHESTE (VALENCIA)",
              locs: {
                lous: {
                  lourb: {
                    dir: { tv: "CL", nv: "CAMPILLO", pnp: "89" },
                    dp: "46380",
                  },
                },
              },
            },
            debi: { ant: "1998" },
          },
          lcons: [
            { lcd: "VIVIENDA", dt: { lourb: { loint: { es: "1", pt: "00", pu: "A" } } }, dfcons: { stl: "85" }, dvcons: { dtip: "VIVIENDA" } },
            { lcd: "VIVIENDA", dt: { lourb: { loint: { es: "1", pt: "01", pu: "A" } } }, dfcons: { stl: "90" }, dvcons: { dtip: "VIVIENDA" } },
            { lcd: "VIVIENDA", dt: { lourb: { loint: { es: "1", pt: "02", pu: "A" } } }, dfcons: { stl: "88" }, dvcons: { dtip: "VIVIENDA" } },
          ],
        },
      },
    };

    const resultado = parseConsultaDnpLoc(payload);
    expect(resultado.candidatos).toHaveLength(3);
    expect(resultado.candidatos[0].campos.plantaC).toBe("00");
    expect(resultado.candidatos[0].detalleCatastro?.superficieConstruida).toBe("85");
    expect(resultado.candidatos[1].campos.plantaC).toBe("01");
    expect(resultado.candidatos[1].detalleCatastro?.superficieConstruida).toBe("90");
    expect(resultado.candidatos[2].campos.plantaC).toBe("02");
    expect(resultado.candidatos.every((c) => c.campos.catastro === "8744402XJ9784S0001DW")).toBe(true);
    expect(resultado.candidatos.every((c) => c.campos.anoConstruccion === "1998")).toBe(true);
    expect(resultado.detallesUsos).toHaveLength(3);
    expect(resultado.detallesUsos.map((d) => d.superficieConstruida)).toEqual(["85", "90", "88"]);
    expect(resultado.detallesUsos.every((d) => d.tipoUso === "Vivienda")).toBe(true);
  });

  it("extrae varios usos por referencia catastral (vivienda y elementos comunes)", () => {
    const payload = {
      consulta_dnprcResult: {
        bico: {
          bi: {
            idbi: { rc: { pc1: "7107501", pc2: "YJ2770G", car: "0110", cc1: "L", cc2: "R" } },
            dt: {
              np: "VALENCIA",
              nm: "VALENCIA",
              locs: {
                lous: {
                  lourb: {
                    dir: { tv: "CL", nv: "ESCRITOR RAFAEL FERRERES", pnp: "2" },
                    loint: { es: "3", pt: "02", pu: "05" },
                    dp: "46013",
                  },
                },
              },
            },
            debi: { luso: "Residencial", sfc: "130", ant: "1998" },
          },
          lcons: [
            {
              lcd: "VIVIENDA",
              dt: { lourb: { loint: { es: "3", pt: "02", pu: "A" } } },
              dfcons: { stl: "108" },
            },
            { lcd: "ELEMENTOS COMUNES", dfcons: { stl: "22" } },
          ],
        },
      },
    };

    const resultado = parseConsultaCatastro(payload);
    expect(resultado.detallesUsos).toEqual([
      {
        referenciaCatastral: "7107501YJ2770G0110LR",
        tipoUso: "Vivienda",
        superficieConstruida: "108",
      },
      {
        referenciaCatastral: "7107501YJ2770G0110LR",
        tipoUso: "Elementos Comunes",
        superficieConstruida: "22",
      },
    ]);
    expect(resultado.detallesUsos.find((d) => d.tipoUso === "Comercio")).toBeUndefined();
    expect(resultado.candidatos).toHaveLength(2);
    expect(resultado.candidatos[0].campos.codigoPostalC).toBe("46013");
    expect(resultado.candidatos[0].campos.plantaC).toBe("02");
    expect(resultado.candidatos[0].campos.puertaC).toBe("A");
    expect(resultado.candidatos[0].detalleCatastro?.tipoUso).toBe("Vivienda");
    expect(resultado.candidatos[0].detalleCatastro?.superficieConstruida).toBe("108");
    expect(candidatoPreferidoDireccionCatastro(resultado.candidatos)?.campos.codigoPostalC).toBe("46013");
  });

  it("no rellena detallesUsos con el uso agregado de DNPLOC (lrcdnp)", () => {
    const payload = {
      consulta_dnplocResult: {
        lrcdnp: {
          rcdnp: {
            dt: {
              np: "VALENCIA",
              nm: "VALENCIA",
              locs: { lous: { lourb: { dir: { tv: "CL", nv: "TEST", pnp: "1" }, dp: "46001" } } },
            },
            rc: { pc1: "7107501", pc2: "YJ2770G", car: "0110", cc1: "L", cc2: "R" },
            debi: { luso: "Residencial", sfc: "130", ant: "1998" },
          },
        },
      },
    };

    const resultado = parseConsultaCatastro(payload);
    expect(resultado.candidatos).toHaveLength(1);
    expect(resultado.detallesUsos).toEqual([]);
    expect(resultado.candidatos[0].detalleCatastro).toBeUndefined();
  });

  it("filtra el uso agregado Residencial cuando hay unidades en lcons", () => {
    expect(
      filtrarDetallesUsosConstructivos([
        { referenciaCatastral: "RC1", tipoUso: "Residencial", superficieConstruida: "130" },
        { referenciaCatastral: "RC1", tipoUso: "Vivienda", superficieConstruida: "108" },
        { referenciaCatastral: "RC1", tipoUso: "Elementos Comunes", superficieConstruida: "22" },
      ])
    ).toEqual([
      { referenciaCatastral: "RC1", tipoUso: "Vivienda", superficieConstruida: "108" },
      { referenciaCatastral: "RC1", tipoUso: "Elementos Comunes", superficieConstruida: "22" },
    ]);
  });

  it("agrega superficies por tipo de uso para una parcela", () => {
    expect(
      agregarDetallesUsosPorTipo(
        [
          { referenciaCatastral: "8744402XJ9784S0001DW", tipoUso: "Vivienda", superficieConstruida: "126" },
          { referenciaCatastral: "8744402XJ9784S0001DW", tipoUso: "Vivienda", superficieConstruida: "140" },
          { referenciaCatastral: "8744402XJ9784S0001DW", tipoUso: "Almacen", superficieConstruida: "18" },
          { referenciaCatastral: "8744402XJ9784S0001DW", tipoUso: "Aparcamiento", superficieConstruida: "12" },
          { referenciaCatastral: "8744402XJ9784S0001DW", tipoUso: "Aparcamiento", superficieConstruida: "134" },
        ],
        "8744402XJ9784S"
      )
    ).toEqual([
      { referenciaCatastral: "8744402XJ9784S", tipoUso: "Almacen", superficieConstruida: "18" },
      { referenciaCatastral: "8744402XJ9784S", tipoUso: "Aparcamiento", superficieConstruida: "146" },
      { referenciaCatastral: "8744402XJ9784S", tipoUso: "Vivienda", superficieConstruida: "266" },
    ]);
  });

  it("detecta referencia de parcela de 14 caracteres", () => {
    expect(referenciaParcelaDesdeReferencia("8744402XJ9784S0001DW")).toBe("8744402XJ9784S");
    expect(esReferenciaParcela("8744402XJ9784S")).toBe(true);
    expect(esReferenciaParcela("8744402XJ9784S0001DW")).toBe(false);
  });

  it("extrae uso principal y año desde bico.bi.debi", () => {
    const payload = {
      consulta_dnprcResult: {
        bico: {
          bi: { debi: { luso: "VIVIENDA", ant: "1985" } },
          lcons: [{ lcd: "VIVIENDA", dfcons: { stl: "50" } }],
        },
      },
    };

    expect(extraerDatosDnprcPorRc20(payload)).toMatchObject({
      usoPrincipal: "VIVIENDA",
      anoConstruccion: "1985",
      usosJson: { VIVIENDA: 50 },
      superficieConstruidaTotal: 50,
    });
  });

  it("extrae UsosJSON desde lcons como FileMaker", () => {
    const payload = {
      consulta_dnprcResult: {
        bico: {
          lcons: [
            { lcd: "VIVIENDA", dfcons: { stl: "126" } },
            { lcd: "COMERCIO", dfcons: { stl: "24,3" } },
            { lcd: "VIVIENDA", dfcons: { stl: "10" } },
          ],
        },
      },
    };

    expect(extraerUsosJsonDesdeConsultaDnprc(payload)).toEqual({
      VIVIENDA: 136,
      COMERCIO: 24.3,
    });
  });

  it("suma UsosJSON de todos los inmuebles de la parcela", () => {
    const agg = sumarUsosJsonParcela([
      { VIVIENDA: 1260, COMERCIO: 100 },
      { VIVIENDA: 50, COMERCIO: 143 },
    ]);

    expect(agg).toEqual({ VIVIENDA: 1310, COMERCIO: 243 });
    expect(detallesCatastroDesdeUsosParcelaJson("2431703YJ2723S", agg)).toEqual([
      { referenciaCatastral: "2431703YJ2723S", tipoUso: "COMERCIO", superficieConstruida: "243" },
      { referenciaCatastral: "2431703YJ2723S", tipoUso: "VIVIENDA", superficieConstruida: "1310" },
    ]);
  });
});

describe("mapDtCatastroAPoliza", () => {
  it("formatea título de calle y provincia", () => {
    expect(
      mapDtCatastroAPoliza({
        np: "VALENCIA",
        nm: "CHESTE",
        locs: { lous: { lourb: { dir: { tv: "CL", nv: "CAMPILLO", pnp: "89" }, dp: "46380" } } },
      })
    ).toMatchObject({
      nombreViaC: "Calle Campillo",
      provinciaC: "Valencia",
      poblacionC: "Cheste",
    });
  });

  it("calcula la superficie total desde los detalles de uso", () => {
    expect(
      calcularSuperficieTotalDesdeDetallesUsos([
        { referenciaCatastral: "9411902YJ2791C0007WD", tipoUso: "VIVIENDA", superficieConstruida: "74" },
        {
          referenciaCatastral: "9411902YJ2791C0007WD",
          tipoUso: "ELEMENTOS COMUNES",
          superficieConstruida: "10",
        },
      ])
    ).toBe(84);
  });

  it("suma vivienda y elementos comunes desde UsosJSON (100 + 10 = 110)", () => {
    const usosJson = { VIVIENDA: 100, "ELEMENTOS COMUNES": 10 };
    expect(calcularSuperficieTotalDesdeUsosJson(usosJson)).toBe(110);
    expect(
      resolverSuperficieConstruidaTotalCatastro(usosJson, [
        { referenciaCatastral: "RC1", tipoUso: "Vivienda", superficieConstruida: "100" },
      ])
    ).toBe(110);
  });
});
