import { toast } from "sonner";
import {
  CarpetaSiniestrosNoEncontrada,
  elegirDirectorioDocSiniestro,
  nombreArchivoSeguro,
  type DirectorioAbierto,
} from "@/lib/carpetaDocSiniestro";

const BASE = "siniestro-connect-carpetas";
const ALMACEN = "handles";
const CLAVE = "dropbox-siniestros";

type CarpetaConPermiso = FileSystemDirectoryHandle & {
  entries: () => AsyncIterable<[string, FileSystemHandle]>;
  queryPermission: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
};

type VentanaConCarpeta = Window & {
  showDirectoryPicker?: (opciones?: {
    id?: string;
    mode?: "read" | "readwrite";
  }) => Promise<FileSystemDirectoryHandle>;
};

function comoCarpeta(handle: FileSystemDirectoryHandle) {
  return handle as CarpetaConPermiso;
}

type DecisionCarpeta = FileSystemDirectoryHandle | "descarga";

let decision: Promise<DecisionCarpeta> | null = null;

function envolver(handle: FileSystemDirectoryHandle): DirectorioAbierto {
  const carpeta = comoCarpeta(handle);
  return {
    nombre: carpeta.name,
    async listar() {
      const entradas: { nombre: string; esDirectorio: boolean }[] = [];
      for await (const [nombre, hijo] of carpeta.entries()) {
        entradas.push({ nombre, esDirectorio: hijo.kind === "directory" });
      }
      return entradas;
    },
    async abrir(nombre: string) {
      try {
        return envolver(await handle.getDirectoryHandle(nombre));
      } catch {
        return null;
      }
    },
    async crear(nombre: string) {
      return envolver(await handle.getDirectoryHandle(nombre, { create: true }));
    },
    async escribirArchivo(nombre: string, contenido: Uint8Array) {
      const archivo = await handle.getFileHandle(nombre, { create: true });
      const writable = await archivo.createWritable();
      const bytes = new Uint8Array(contenido.byteLength);
      bytes.set(contenido);
      await writable.write(new Blob([bytes]));
      await writable.close();
    },
  };
}

function abrirBase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const peticion = indexedDB.open(BASE, 1);
    peticion.onupgradeneeded = () => {
      if (!peticion.result.objectStoreNames.contains(ALMACEN)) {
        peticion.result.createObjectStore(ALMACEN);
      }
    };
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });
}

async function leerHandle() {
  try {
    const base = await abrirBase();
    const valor = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const peticion = base.transaction(ALMACEN).objectStore(ALMACEN).get(CLAVE);
      peticion.onsuccess = () => resolve((peticion.result as FileSystemDirectoryHandle | undefined) ?? null);
      peticion.onerror = () => reject(peticion.error);
    });
    base.close();
    return valor;
  } catch {
    return null;
  }
}

async function guardarHandle(handle: FileSystemDirectoryHandle) {
  const base = await abrirBase();
  await new Promise<void>((resolve, reject) => {
    const transaccion = base.transaction(ALMACEN, "readwrite");
    transaccion.objectStore(ALMACEN).put(handle, CLAVE);
    transaccion.oncomplete = () => resolve();
    transaccion.onerror = () => reject(transaccion.error);
  });
  base.close();
}

async function borrarHandle() {
  try {
    const base = await abrirBase();
    await new Promise<void>((resolve, reject) => {
      const transaccion = base.transaction(ALMACEN, "readwrite");
      transaccion.objectStore(ALMACEN).delete(CLAVE);
      transaccion.oncomplete = () => resolve();
      transaccion.onerror = () => reject(transaccion.error);
    });
    base.close();
  } catch {
    // La próxima normalización volverá a pedir la carpeta.
  }
}

async function handleConPermiso() {
  const handle = await leerHandle();
  if (!handle) return null;
  try {
    const permiso = await comoCarpeta(handle).queryPermission({ mode: "readwrite" });
    return permiso === "granted" ? handle : null;
  } catch {
    return null;
  }
}

function decidirCarpetaPortatil() {
  if (decision) return decision;
  let resolver: (valor: DecisionCarpeta) => void = () => {};
  const pendiente = new Promise<DecisionCarpeta>((resolve) => {
    resolver = resolve;
  });
  decision = pendiente.then((valor) => {
    if (valor === "descarga") decision = null;
    return valor;
  });
  void ejecutarDecision(resolver);
  return decision;
}

async function ejecutarDecision(resolver: (valor: DecisionCarpeta) => void) {
  const concedido = await handleConPermiso();
  if (concedido) {
    resolver(concedido);
    return;
  }

  const selector = (window as VentanaConCarpeta).showDirectoryPicker;
  if (typeof selector !== "function") {
    toast.warning(
      "Este navegador no puede guardar en las carpetas del portátil. Ábrelo con Chrome o Edge. El archivo se descarga en el navegador."
    );
    resolver("descarga");
    return;
  }

  let resuelto = false;
  let eligiendo = false;
  const terminar = (valor: DecisionCarpeta) => {
    if (resuelto) return;
    resuelto = true;
    toast.dismiss(id);
    resolver(valor);
  };

  const id = toast.message(
    "Elige la carpeta Dropbox de este portátil, donde está Peritaciones, o directamente Siniestros en curso.",
    {
      duration: Number.POSITIVE_INFINITY,
      action: {
        label: "Elegir carpeta",
        onClick: () => {
          eligiendo = true;
          void selector
            .call(window, { id: "siniestros-dropbox-portatil", mode: "readwrite" })
            .then((handle) => {
              void guardarHandle(handle);
              terminar(handle);
            })
            .catch(() => terminar("descarga"));
        },
      },
      cancel: {
        label: "Descargar",
        onClick: () => terminar("descarga"),
      },
      onDismiss: () => {
        window.setTimeout(() => {
          if (!eligiendo) terminar("descarga");
        }, 0);
      },
    }
  );
}

/** Empieza a pedir la carpeta mientras se descarga el PDF, sin esperar al final. */
export function anticiparCarpetaPortatil() {
  void decidirCarpetaPortatil();
}

export async function guardarDocumentoEnPortatil(blob: Blob, nombre: string, numeros: string[]) {
  const archivo = nombreArchivoSeguro(nombre);
  if (!archivo) throw new Error("El nombre del archivo del catastro no es válido");
  if (!blob.size) throw new Error("El documento del catastro está vacío");

  const elegida = await decidirCarpetaPortatil();
  if (elegida === "descarga") return { destino: "descarga" as const };

  try {
    const doc = await elegirDirectorioDocSiniestro(envolver(elegida), numeros);
    await doc.directorio.escribirArchivo(archivo, new Uint8Array(await blob.arrayBuffer()));
    return { destino: "doc" as const, ruta: `${doc.ruta}/${archivo}` };
  } catch (error) {
    if (error instanceof CarpetaSiniestrosNoEncontrada) {
      decision = null;
      await borrarHandle();
    }
    throw error;
  }
}
