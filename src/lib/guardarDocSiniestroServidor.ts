import fs from "fs";
import os from "os";
import path from "path";
import {
  elegirCarpetaDocSiniestro,
  nombreArchivoSeguro,
  raicesDropboxDesdeInfo,
  type EntradaDirectorio,
} from "./carpetaDocSiniestro";

function listar(ruta: string): EntradaDirectorio[] {
  return fs.readdirSync(ruta, { withFileTypes: true }).map((entrada) => ({
    nombre: entrada.name,
    esDirectorio: entrada.isDirectory(),
  }));
}

export function raicesDropboxDeEsteEquipo() {
  const raices: string[] = [];
  const anadir = (ruta: string) => {
    const limpia = ruta.trim();
    if (!limpia || raices.includes(limpia) || !fs.existsSync(limpia)) return;
    raices.push(limpia);
  };

  const info = path.join(os.homedir(), ".dropbox", "info.json");
  if (fs.existsSync(info)) {
    try {
      raicesDropboxDesdeInfo(fs.readFileSync(info, "utf8")).forEach(anadir);
    } catch {
      // Si el archivo de Dropbox no se puede leer, se prueban las rutas habituales.
    }
  }

  anadir(path.join(os.homedir(), "Dropbox"));
  const nube = path.join(os.homedir(), "Library", "CloudStorage");
  if (fs.existsSync(nube)) {
    for (const nombre of fs.readdirSync(nube)) {
      if (nombre === "Dropbox" || nombre.startsWith("Dropbox-")) anadir(path.join(nube, nombre));
    }
  }

  return raices;
}

export function guardarDocumentoEnDocSiniestro(numeros: string[], nombre: string, contenido: Buffer) {
  const archivo = nombreArchivoSeguro(nombre);
  if (!archivo) throw new Error("El nombre del archivo del catastro no es válido");
  if (!contenido.length) throw new Error("El documento del catastro está vacío");

  const carpetaDoc = elegirCarpetaDocSiniestro(raicesDropboxDeEsteEquipo(), numeros, listar);
  fs.mkdirSync(carpetaDoc, { recursive: true });
  const destino = path.resolve(carpetaDoc, archivo);
  const raiz = path.resolve(carpetaDoc);
  if (!destino.startsWith(`${raiz}${path.sep}`)) {
    throw new Error("La ruta de destino queda fuera de la carpeta DOC");
  }
  fs.writeFileSync(destino, contenido);
  return destino;
}
