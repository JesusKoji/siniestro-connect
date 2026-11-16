export type EntradaDirectorio = { nombre: string; esDirectorio: boolean };

function separadorDe(ruta: string) {
  return ruta.includes("\\") && !ruta.includes("/") ? "\\" : "/";
}

function unir(raiz: string, nombre: string) {
  const sep = separadorDe(raiz);
  return `${raiz.replace(/[/\\]+$/, "")}${sep}${nombre}`;
}

export type ListarDirectorio = (ruta: string) => EntradaDirectorio[];

const SEGMENTOS_SINIESTROS = ["Peritaciones", "Gestion Informes Periciales", "Siniestros en curso"] as const;

export function normalizarNombreCarpeta(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** El número del siniestro tiene que ser el nombre de la carpeta o un trozo separado, no parte de otro número. */
export function coincideCarpetaConNumero(nombreCarpeta: string, numero: string) {
  const trozosNumero = normalizarNombreCarpeta(numero)
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  if (trozosNumero.join("").length < 4) return false;
  const trozos = normalizarNombreCarpeta(nombreCarpeta).split(/[^A-Z0-9]+/).filter(Boolean);
  for (let i = 0; i <= trozos.length - trozosNumero.length; i += 1) {
    if (trozosNumero.every((trozo, desplazamiento) => trozos[i + desplazamiento] === trozo)) return true;
  }
  return false;
}

export function nombreArchivoSeguro(nombre: string) {
  const base = (nombre.split(/[/\\]/).pop() ?? "").replace(/[^A-Za-z0-9._-]/g, "_");
  if (!base || base === "." || base === ".." || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/.test(base)) {
    return null;
  }
  return base;
}

export function raicesDropboxDesdeInfo(infoJson: string) {
  const data = JSON.parse(infoJson) as Record<string, { path?: string }>;
  return Object.values(data)
    .map((cuenta) => String(cuenta?.path ?? "").trim())
    .filter(Boolean);
}

export function jpegAPdf(jpeg: Buffer, anchoPx: number, altoPx: number) {
  if (anchoPx <= 0 || altoPx <= 0) {
    throw new Error("La imagen de la vista satélite no tiene tamaño");
  }

  const ancho = 720;
  const alto = Math.max(1, Math.round((ancho * altoPx) / anchoPx));
  const contenido = Buffer.from(`q\n${ancho} 0 0 ${alto} 0 0 cm\n/Im Do\nQ\n`, "latin1");
  const objetos = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1"),
    Buffer.from("<< /Type /Pages /Count 1 /Kids [3 0 R] >>", "latin1"),
    Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ancho} ${alto}] /Contents 4 0 R /Resources << /XObject << /Im 5 0 R >> >> >>`,
      "latin1"
    ),
    Buffer.from(`<< /Length ${contenido.length} >>\nstream\n${contenido.toString("latin1")}endstream`, "latin1"),
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${anchoPx} /Height ${altoPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
        "latin1"
      ),
      jpeg,
      Buffer.from("\nendstream", "latin1"),
    ]),
  ];

  const partes: Buffer[] = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets = [0];
  let cursor = partes[0].length;
  objetos.forEach((cuerpo, indice) => {
    offsets.push(cursor);
    const envuelto = Buffer.concat([
      Buffer.from(`${indice + 1} 0 obj\n`, "latin1"),
      cuerpo,
      Buffer.from("\nendobj\n", "latin1"),
    ]);
    partes.push(envuelto);
    cursor += envuelto.length;
  });

  let xref = `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${cursor}\n%%EOF\n`;
  partes.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(partes);
}

function hijoPorNombre(directorio: string, esperado: string, listar: ListarDirectorio) {
  let entradas: EntradaDirectorio[] = [];
  try {
    entradas = listar(directorio);
  } catch {
    return null;
  }
  const normalizado = normalizarNombreCarpeta(esperado);
  const encontrado = entradas.find(
    (entrada) => entrada.esDirectorio && normalizarNombreCarpeta(entrada.nombre) === normalizado
  );
  return encontrado ? unir(directorio, encontrado.nombre) : null;
}

export type DirectorioAbierto = {
  nombre: string;
  listar: () => Promise<EntradaDirectorio[]>;
  abrir: (nombre: string) => Promise<DirectorioAbierto | null>;
  crear: (nombre: string) => Promise<DirectorioAbierto>;
  escribirArchivo: (nombre: string, contenido: Uint8Array) => Promise<void>;
};

export class CarpetaSiniestrosNoEncontrada extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CarpetaSiniestrosNoEncontrada";
  }
}

async function hijoPorNombreAsync(directorio: DirectorioAbierto, esperado: string) {
  const entradas = await directorio.listar();
  const normalizado = normalizarNombreCarpeta(esperado);
  const encontrado = entradas.find(
    (entrada) => entrada.esDirectorio && normalizarNombreCarpeta(entrada.nombre) === normalizado
  );
  if (!encontrado) return null;
  return directorio.abrir(encontrado.nombre);
}

/** Desde la carpeta que elija el navegador: Dropbox, Peritaciones o ya Siniestros en curso. */
export async function directorioSiniestrosEnCursoAsync(raiz: DirectorioAbierto) {
  const indiceActual = SEGMENTOS_SINIESTROS.findIndex(
    (segmento) => normalizarNombreCarpeta(segmento) === normalizarNombreCarpeta(raiz.nombre)
  );
  let actual = raiz;
  const nombres = indiceActual >= 0 ? [raiz.nombre] : [];
  for (let indice = indiceActual >= 0 ? indiceActual + 1 : 0; indice < SEGMENTOS_SINIESTROS.length; indice += 1) {
    const hijo = await hijoPorNombreAsync(actual, SEGMENTOS_SINIESTROS[indice]);
    if (!hijo) return null;
    actual = hijo;
    nombres.push(hijo.nombre);
  }
  return { directorio: actual, ruta: nombres.join("/") };
}

export async function elegirDirectorioDocSiniestro(raiz: DirectorioAbierto, numeros: string[]) {
  const candidatos = numeros.map((numero) => numero.trim()).filter((numero) => numero.length >= 4);
  if (candidatos.length === 0) {
    throw new Error("La póliza abierta no tiene un siniestro en curso con número de referencia");
  }

  const enCurso = await directorioSiniestrosEnCursoAsync(raiz);
  if (!enCurso) {
    throw new CarpetaSiniestrosNoEncontrada(
      "En la carpeta elegida no está Peritaciones/Gestion Informes Periciales/Siniestros en curso. Elige la carpeta Dropbox de este portátil o la de Siniestros en curso."
    );
  }

  const encontradas: {
    directorio: DirectorioAbierto;
    ruta: string;
    indiceNumero: number;
    exacta: boolean;
    profundidad: number;
  }[] = [];

  const recorrer = async (directorio: DirectorioAbierto, ruta: string, profundidad: number) => {
    let entradas: EntradaDirectorio[] = [];
    try {
      entradas = await directorio.listar();
    } catch {
      return;
    }
    for (const entrada of entradas) {
      if (!entrada.esDirectorio || entrada.nombre.startsWith(".")) continue;
      const hijo = await directorio.abrir(entrada.nombre);
      if (!hijo) continue;
      const rutaHijo = `${ruta}/${entrada.nombre}`;
      const indiceNumero = candidatos.findIndex((numero) => coincideCarpetaConNumero(entrada.nombre, numero));
      if (indiceNumero >= 0) {
        const numero = candidatos[indiceNumero] ?? "";
        const exacta =
          normalizarNombreCarpeta(entrada.nombre).replace(/[^A-Z0-9]/g, "") ===
          normalizarNombreCarpeta(numero).replace(/[^A-Z0-9]/g, "");
        encontradas.push({
          directorio: hijo,
          ruta: rutaHijo,
          indiceNumero,
          exacta,
          profundidad: rutaHijo.split("/").length,
        });
      }
      if (profundidad < 5) await recorrer(hijo, rutaHijo, profundidad + 1);
    }
  };

  await recorrer(enCurso.directorio, enCurso.ruta, 0);

  if (encontradas.length === 0) {
    throw new Error(`No hay una carpeta de siniestro en curso para ${candidatos.join(" o ")}`);
  }

  encontradas.sort((a, b) => {
    if (a.indiceNumero !== b.indiceNumero) return a.indiceNumero - b.indiceNumero;
    if (a.exacta !== b.exacta) return a.exacta ? -1 : 1;
    return a.profundidad - b.profundidad;
  });

  const carpeta = encontradas[0];
  if (!carpeta) {
    throw new Error(`No hay una carpeta de siniestro en curso para ${candidatos.join(" o ")}`);
  }
  const docExistente = await hijoPorNombreAsync(carpeta.directorio, "DOC");
  const doc = docExistente ?? (await carpeta.directorio.crear("DOC"));
  return { directorio: doc, ruta: `${carpeta.ruta}/DOC` };
}

export function directorioSiniestrosEnCurso(raizDropbox: string, listar: ListarDirectorio) {
  let actual = raizDropbox;
  for (const segmento of SEGMENTOS_SINIESTROS) {
    const hijo = hijoPorNombre(actual, segmento, listar);
    if (!hijo) return null;
    actual = hijo;
  }
  return actual;
}

function recorrerCarpetas(
  directorio: string,
  listar: ListarDirectorio,
  profundidad: number,
  visita: (ruta: string, nombre: string) => void
) {
  let entradas: EntradaDirectorio[] = [];
  try {
    entradas = listar(directorio);
  } catch {
    return;
  }
  entradas.forEach((entrada) => {
    if (!entrada.esDirectorio || entrada.nombre.startsWith(".")) return;
    const ruta = unir(directorio, entrada.nombre);
    visita(ruta, entrada.nombre);
    if (profundidad < 5) recorrerCarpetas(ruta, listar, profundidad + 1, visita);
  });
}

export function elegirCarpetaDocSiniestro(
  raicesDropbox: string[],
  numeros: string[],
  listar: ListarDirectorio
) {
  const candidatos = numeros.map((numero) => numero.trim()).filter((numero) => numero.length >= 4);
  if (candidatos.length === 0) {
    throw new Error("La póliza abierta no tiene un siniestro en curso con número de referencia");
  }

  const raicesEnCurso = raicesDropbox
    .map((raiz) => directorioSiniestrosEnCurso(raiz, listar))
    .filter(Boolean) as string[];
  if (raicesEnCurso.length === 0) {
    throw new Error(
      "No está la carpeta Dropbox/Peritaciones/Gestion Informes Periciales/Siniestros en curso en este equipo"
    );
  }

  const encontradas: { ruta: string; indiceNumero: number; exacta: boolean; profundidad: number }[] = [];
  raicesEnCurso.forEach((raiz) => {
    recorrerCarpetas(raiz, listar, 0, (ruta, nombre) => {
      const indiceNumero = candidatos.findIndex((numero) => coincideCarpetaConNumero(nombre, numero));
      if (indiceNumero < 0) return;
      const exacta = normalizarNombreCarpeta(nombre).replace(/[^A-Z0-9]/g, "") ===
        normalizarNombreCarpeta(candidatos[indiceNumero]).replace(/[^A-Z0-9]/g, "");
      encontradas.push({
        ruta,
        indiceNumero,
        exacta,
        profundidad: ruta.split(/[/\\]/).length,
      });
    });
  });

  if (encontradas.length === 0) {
    throw new Error(
      `No hay una carpeta de siniestro en curso para ${candidatos.join(" o ")}`
    );
  }

  encontradas.sort((a, b) => {
    if (a.indiceNumero !== b.indiceNumero) return a.indiceNumero - b.indiceNumero;
    if (a.exacta !== b.exacta) return a.exacta ? -1 : 1;
    return a.profundidad - b.profundidad;
  });

  const carpetaSiniestro = encontradas[0].ruta;
  const docExistente = hijoPorNombre(carpetaSiniestro, "DOC", listar);
  return docExistente ?? unir(carpetaSiniestro, "DOC");
}

export type SiniestroParaCarpetaDoc = {
  idPoliza?: string;
  numeroPoliza?: string;
  numero?: string;
  numeroSiniestro2?: string;
  fechaCierre?: string;
  fechaRecepcion?: string;
};

function tiempoFecha(valor?: string) {
  const texto = String(valor ?? "").trim();
  const barra = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (barra) {
    const primero = Number(barra[1]);
    const segundo = Number(barra[2]);
    const anio = Number(barra[3].length === 2 ? `20${barra[3]}` : barra[3]);
    const [dia, mes] = primero > 12 ? [primero, segundo] : segundo > 12 ? [segundo, primero] : [segundo, primero];
    return Date.UTC(anio, mes - 1, dia);
  }
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return 0;
}

/** Números de los siniestros en curso de la póliza abierta, el más reciente primero. */
export function numerosSiniestroEnCursoDePoliza(
  poliza: { id?: string; numeroPoliza?: string },
  siniestros: SiniestroParaCarpetaDoc[]
) {
  const id = String(poliza.id ?? "").trim();
  const numeroPoliza = String(poliza.numeroPoliza ?? "").trim();
  const relacionados = siniestros.filter((siniestro) => {
    if (String(siniestro.fechaCierre ?? "").trim()) return false;
    const mismaPoliza = id && String(siniestro.idPoliza ?? "").trim() === id;
    const mismoNumero = numeroPoliza && String(siniestro.numeroPoliza ?? "").trim() === numeroPoliza;
    return mismaPoliza || mismoNumero;
  });

  return [...relacionados]
    .sort((a, b) => tiempoFecha(b.fechaRecepcion) - tiempoFecha(a.fechaRecepcion))
    .flatMap((siniestro) => [siniestro.numero, siniestro.numeroSiniestro2])
    .map((numero) => String(numero ?? "").trim())
    .filter((numero, indice, lista) => numero.length >= 4 && lista.indexOf(numero) === indice);
}
