import { describe, expect, it } from "vitest";
import {
  CarpetaSiniestrosNoEncontrada,
  coincideCarpetaConNumero,
  elegirCarpetaDocSiniestro,
  elegirDirectorioDocSiniestro,
  jpegAPdf,
  nombreArchivoSeguro,
  numerosSiniestroEnCursoDePoliza,
  raicesDropboxDesdeInfo,
  type DirectorioAbierto,
  type EntradaDirectorio,
} from "@/lib/carpetaDocSiniestro";

function arbol(rutas: string[]) {
  const directorios = new Set<string>();
  rutas.forEach((ruta) => {
    const partes = ruta.split("/").filter(Boolean);
    for (let i = 1; i <= partes.length; i += 1) directorios.add(`/${partes.slice(0, i).join("/")}`);
  });

  return (directorio: string): EntradaDirectorio[] => {
    const prefijo = directorio.endsWith("/") ? directorio : `${directorio}/`;
    const hijos = new Map<string, boolean>();
    directorios.forEach((ruta) => {
      if (!ruta.startsWith(prefijo)) return;
      const nombre = ruta.slice(prefijo.length).split("/")[0];
      if (nombre) hijos.set(nombre, true);
    });
    rutas.forEach((ruta) => {
      if (!ruta.startsWith(prefijo)) return;
      const resto = ruta.slice(prefijo.length);
      if (!resto || resto.includes("/")) return;
      hijos.set(resto, false);
    });
    return [...hijos.entries()].map(([nombre, esDirectorio]) => ({ nombre, esDirectorio }));
  };
}

describe("carpeta DOC del siniestro", () => {
  const raiz = "/Users/portatil/Dropbox Escritorio";
  const base = `${raiz}/Peritaciones/Gestión Informes Periciales/Siniestros en curso`;
  const listar = arbol([
    `${base}/2026/43531857 GARCIA/DOC`,
    `${base}/2026/130202616712 OTRO/DOC`,
    `${base}/cerrados/99999999`,
  ]);

  it("lee las carpetas de Dropbox del escritorio y del portátil", () => {
    expect(
      raicesDropboxDesdeInfo(
        JSON.stringify({
          personal: { path: "/Users/jesus/Library/CloudStorage/Dropbox" },
          business: { path: "C:\\Users\\jesus\\Dropbox" },
        })
      )
    ).toEqual(["/Users/jesus/Library/CloudStorage/Dropbox", "C:\\Users\\jesus\\Dropbox"]);
  });

  it("localiza DOC aunque el nombre lleve acento y el número vaya con el asegurado", () => {
    expect(elegirCarpetaDocSiniestro([raiz], ["43531857"], listar)).toBe(
      `${base}/2026/43531857 GARCIA/DOC`
    );
  });

  it("no confunde un número con otro más largo", () => {
    expect(coincideCarpetaConNumero("130202616712 OTRO", "1612")).toBe(false);
    expect(coincideCarpetaConNumero("CR-55 GARCIA", "CR-55")).toBe(true);
    expect(elegirCarpetaDocSiniestro([raiz], ["130202616712"], listar)).toBe(
      `${base}/2026/130202616712 OTRO/DOC`
    );
  });

  it("usa el siniestro en curso de la póliza abierta, el más reciente", () => {
    expect(
      numerosSiniestroEnCursoDePoliza(
        { id: "P1", numeroPoliza: "286601" },
        [
          { idPoliza: "P1", numero: "11112222", fechaCierre: "01/01/2026", fechaRecepcion: "01/01/2026" },
          { idPoliza: "P9", numero: "99998888", fechaRecepcion: "02/02/2026" },
          { idPoliza: "P1", numero: "43531857", numeroSiniestro2: "CR-55", fechaRecepcion: "01/03/2026" },
          { numeroPoliza: "286601", numero: "130202616712", fechaRecepcion: "15/06/2026" },
        ]
      )
    ).toEqual(["130202616712", "43531857", "CR-55"]);
  });

  it("rechaza un nombre de archivo que salga de DOC", () => {
    expect(nombreArchivoSeguro("../../secreto.pdf")).toBe("secreto.pdf");
    expect(nombreArchivoSeguro("")).toBeNull();
  });

  it("guarda en el DOC del portátil aunque la carpeta elegida sea Dropbox y el nombre lleve acento", async () => {
    type Arbol = { [nombre: string]: Arbol };
    const arbol: Arbol = {
      Peritaciones: {
        "Gestión Informes Periciales": {
          "Siniestros en curso": {
            "01202600562267": {},
          },
        },
      },
    };
    const comoDirectorio = (nombre: string, nodo: Arbol): DirectorioAbierto => ({
      nombre,
      async listar() {
        return Object.keys(nodo).map((hijo) => ({ nombre: hijo, esDirectorio: true }));
      },
      async abrir(hijo) {
        const siguiente = nodo[hijo];
        return siguiente ? comoDirectorio(hijo, siguiente) : null;
      },
      async crear(hijo) {
        nodo[hijo] = nodo[hijo] ?? {};
        return comoDirectorio(hijo, nodo[hijo]);
      },
      async escribirArchivo() {},
    });

    const doc = await elegirDirectorioDocSiniestro(comoDirectorio("Dropbox", arbol), ["01202600562267"]);
    expect(doc.ruta).toBe(
      "Peritaciones/Gestión Informes Periciales/Siniestros en curso/01202600562267/DOC"
    );
    expect(doc.directorio.nombre).toBe("DOC");
  });

  it("acepta que el navegador ya esté situado en Siniestros en curso", async () => {
    type Arbol = { [nombre: string]: Arbol };
    const arbol: Arbol = { "2026": { "01202600562267 GARCIA": { DOC: {} } } };
    const comoDirectorio = (nombre: string, nodo: Arbol): DirectorioAbierto => ({
      nombre,
      async listar() {
        return Object.keys(nodo).map((hijo) => ({ nombre: hijo, esDirectorio: true }));
      },
      async abrir(hijo) {
        const siguiente = nodo[hijo];
        return siguiente ? comoDirectorio(hijo, siguiente) : null;
      },
      async crear(hijo) {
        nodo[hijo] = nodo[hijo] ?? {};
        return comoDirectorio(hijo, nodo[hijo]);
      },
      async escribirArchivo() {},
    });

    const doc = await elegirDirectorioDocSiniestro(comoDirectorio("Siniestros en curso", arbol), [
      "01202600562267",
    ]);
    expect(doc.ruta).toBe("Siniestros en curso/2026/01202600562267 GARCIA/DOC");
    expect(doc.directorio.nombre).toBe("DOC");
  });

  it("avisa si la carpeta elegida en el portátil no contiene los siniestros", async () => {
    const vacia: DirectorioAbierto = {
      nombre: "Dropbox",
      async listar() {
        return [];
      },
      async abrir() {
        return null;
      },
      async crear(nombre) {
        return { ...vacia, nombre };
      },
      async escribirArchivo() {},
    };
    await expect(elegirDirectorioDocSiniestro(vacia, ["01202600562267"])).rejects.toBeInstanceOf(
      CarpetaSiniestrosNoEncontrada
    );
  });

  it("envuelve la ortofoto en un PDF", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const pdf = jpegAPdf(jpeg, 960, 720);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.includes(jpeg)).toBe(true);
    expect(pdf.toString("latin1")).toContain("%%EOF");
  });
});
