import { describe, expect, it } from "vitest";
import { partesCodigoMunicipioCatastro } from "@/lib/codigosMunicipiosCatastro";
import {
  casoWebCatastroPoliza,
  codigoMunicipioCatastroPolizaSync,
  construirUrlWebCatastro,
  debeImprimirCroquisTrasAbrir,
  delegacionMunicipioParaDescarga,
  documentoNormalizacionCatastro,
  nombreVistaSateliteCatastro,
  referenciaParcelaMapa,
  resolverUrlWebCatastroPolizaSync,
  URL_CATASTRO_BUSCAR_MAPA,
  URL_IMPRIMIR_CROQUIS_CATASTRO,
} from "@/lib/catastroWeb";
import { Poliza } from "@/data/siniestros";

const polizaValencia: Poliza = {
  id: "1",
  idAsegurado: "",
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
  nombreViaC: "",
  viaC: "",
  direccionC: "",
  numeroCalleC: "",
  bloqueC: "",
  escaleraC: "",
  plantaC: "",
  puertaC: "",
  codigoPostalC: "46013",
  poblacionC: "Valencia",
  provinciaC: "Valencia",
  codigoMunicipioCatastro: "46900",
  catastro: "7107501YJ2770G0110LR",
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

const URL_EJEMPLO =
  "https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?UrbRus=U&RefC=7107501YJ2770G0110LR&esBice=&RCBice1=&RCBice2=&DenoBice=&from=OVCBusqueda&pest=rc&RCCompleta=7107501YJ2770G0110LR&final=&del=46&mun=900";

describe("construirUrlWebCatastro (guión WebCatastro)", () => {
  it("ImprimirCroquis solo para RC de 20 caracteres", () => {
    expect(debeImprimirCroquisTrasAbrir(polizaValencia)).toBe(true);
    expect(debeImprimirCroquisTrasAbrir({ ...polizaValencia, catastro: "2431703YJ2723S" })).toBe(
      false
    );
    expect(URL_IMPRIMIR_CROQUIS_CATASTRO).toBe("javascript:ImprimirCroquisYDatos();");
  });

  it("Case FileMaker: vacío / 20 / 14", () => {
    expect(casoWebCatastroPoliza({ ...polizaValencia, catastro: "" })).toBe("vacio");
    expect(casoWebCatastroPoliza(polizaValencia)).toBe("inmueble20");
    expect(casoWebCatastroPoliza({ ...polizaValencia, catastro: "2431703YJ2723S" })).toBe("parcela14");
  });

  it("sin referencia abre el mapa de búsqueda", () => {
    expect(construirUrlWebCatastro("")).toBe(URL_CATASTRO_BUSCAR_MAPA);
    expect(construirUrlWebCatastro()).toBe(URL_CATASTRO_BUSCAR_MAPA);
  });

  it("genera la URL exacta para 7107501YJ2770G0110LR con código Valencia 46900", () => {
    const url = construirUrlWebCatastro("7107501YJ2770G0110LR", "46900");
    expect(url).toBe(URL_EJEMPLO);
  });

  it("resolverUrlWebCatastroPolizaSync usa fallback Valencia → mun=900", () => {
    expect(resolverUrlWebCatastroPolizaSync(polizaValencia)).toBe(URL_EJEMPLO);
  });

  it("usa Codigo de la relación en la póliza si ya viene de FileMaker", () => {
    const polizaConRelacion: Poliza = {
      ...polizaValencia,
      codigoMunicipioCatastro: "46169",
      poblacionC: "Mislata",
    };
    expect(codigoMunicipioCatastroPolizaSync(polizaConRelacion)).toBe("46169");
    const url = resolverUrlWebCatastroPolizaSync(polizaConRelacion);
    expect(url).toContain("&mun=169");
    expect(url).not.toContain("&mun=900");
  });

  it("RC de 20 caracteres usa OVCConCiud con del y mun del código de municipio", () => {
    const ref = "8744402XJ9784S0001DW";
    const url = construirUrlWebCatastro(ref, "46900");

    expect(url).toContain("OVCConCiud.aspx");
    expect(url).toContain(`RefC=${ref}`);
    expect(url).toContain("&del=46");
    expect(url).toContain("&mun=900");
  });

  it("del y mun siguen la lógica Left/Right de FileMaker", () => {
    expect(partesCodigoMunicipioCatastro("46900")).toEqual({ del: "46", mun: "900" });
    expect(partesCodigoMunicipioCatastro("46054")).toEqual({ del: "46", mun: "054" });
  });

  it("RC de 14 caracteres usa OVCListaBienes con RC1 y RC2", () => {
    const ref = "2431703YJ2723S";
    const url = construirUrlWebCatastro(ref);

    expect(url).toContain("OVCListaBienes.aspx");
    expect(url).toContain("RC1=2431703");
    expect(url).toContain("RC2=YJ2723S");
    expect(url).toContain("RCCompleta=%20" + ref);
    expect(url).toContain("from=OVCBusqueda");
  });

  it("rechaza referencias con longitud distinta de 14 o 20", () => {
    expect(() => construirUrlWebCatastro("123")).toThrow();
  });

  it("acepta RC de 20 caracteres aunque no cumpla el patrón estricto de consulta API", () => {
    const ref = "7107501YJ2770G0110L1";
    const url = construirUrlWebCatastro(ref, "46900");
    expect(url).toContain(`RefC=${ref}`);
    expect(url).toContain("&del=46");
    expect(url).toContain("&mun=900");
  });

  it("inmueble de 20 caracteres descarga el PDF de consulta descriptiva y gráfica", () => {
    const doc = documentoNormalizacionCatastro("7107501YJ2770G0106KE", "46", "900");
    expect(doc?.tipo).toBe("pdf");
    expect(doc?.ruta).toContain("ref=7107501YJ2770G0106KE");
    expect(doc?.ruta).toContain("del=46");
    expect(doc?.ruta).toContain("mun=900");
    expect(doc?.nombre).toBe("7107501YJ2770G0106KE.pdf");
  });

  it("parcela de 14 caracteres descarga el Excel de referencias", () => {
    const doc = documentoNormalizacionCatastro("7107501YJ2770G", "", "");
    expect(doc?.tipo).toBe("excel");
    expect(doc?.ruta).toContain("rc=7107501YJ2770G");
    expect(doc?.nombre).toBe("Listado_inmuebles_7107501YJ2770G.xlsx");
  });

  it("la vista satélite usa la parcela y marca el nombre del inmueble", () => {
    expect(referenciaParcelaMapa("7107501YJ2770G0106KE")).toBe("7107501YJ2770G");
    expect(referenciaParcelaMapa("7107501YJ2770G")).toBe("7107501YJ2770G");
    expect(nombreVistaSateliteCatastro("7107501YJ2770G")).toBe("Cartografia_7107501YJ2770G.pdf");
    expect(nombreVistaSateliteCatastro("7107501YJ2770G0106KE")).toBe("Cartografia_7107501YJ2770G0106KE.pdf");
  });

  it("usa el código INE de la ficha del catastro para el PDF", () => {
    expect(
      delegacionMunicipioParaDescarga(
        { loine: { cp: "46", cm: "900" }, np: "VALENCIA", nm: "VALENCIA" },
        polizaValencia
      )
    ).toEqual({ del: "46", mun: "900" });
  });

  it("resolverUrlWebCatastroPolizaSync ignora otra RC y usa siempre poliza.catastro", () => {
    const polizaParcela: Poliza = { ...polizaValencia, catastro: "2431703YJ2723S" };
    const url = resolverUrlWebCatastroPolizaSync(polizaParcela);
    expect(url).toContain("OVCListaBienes.aspx");
    expect(url).toContain("RC1=2431703");
  });

  it("mun son los 3 últimos dígitos de Codigo (Right en FileMaker)", () => {
    const ref = "2431703YJ2723S0033XT";
    const url = construirUrlWebCatastro(ref, "46169");
    expect(url).toContain("&del=46");
    expect(url).toContain("&mun=169");
  });
});
