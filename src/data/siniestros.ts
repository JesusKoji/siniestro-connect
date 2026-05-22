// Datos de ejemplo para desarrollo. Sustituir por la llamada real a FileMaker Data API.
export interface Siniestro {
  id: string;
  numero: string;
  compania: string;
  asegurado: string;
  direccion: string;
  fechaApertura: string;
  tipo: string;
  ramo: string;
  numeroPoliza: string;
  fechaCierre: string;
  valoracionTotal: string;
  excluido: string;
  idSiniestro?: string;
  idAsegurado?: string;
  idPoliza?: string;
}

export interface Asegurado {
  id: string;
  recordId?: string;
  nif: string;
  tipoPersona: string;
  clientePrivado: string;
  aplicaRetencion: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  nombreCompleto: string;
  razonSocial: string;
  displayName: string;
  via: string;
  direccion: string;
  numeroCalle: string;
  bloque: string;
  escalera: string;
  planta: string;
  puerta: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;
  pais: string;
  direccionCompleta: string;
  email: string;
  telefono: string;
}

export interface ContactoAsegurado {
  id: string;
  recordId?: string;
  idAsegurado: string;
  nombre: string;
  nombreCompleto: string;
  cargo: string;
  telefono: string;
  telefono2: string;
  movil: string;
  mail: string;
  notas: string;
}

export interface Poliza {
  id: string;
  idAsegurado: string;
  idRamo: string;
  numeroPoliza: string;
  ramo: string;
  tipoRamo: string;
  direccionCompleta: string;
  fechaEfecto: string;
  nSiniestros: string;
  poblacion: string;
  provincia: string;
  agente: string;
  telefonoAgente: string;
  emailAgente: string;
}

export interface Ramo {
  id: string;
  ramo: string;
  tipoRamo: string;
}

export const aseguradoMock: Asegurado = {
  id: "ASEG-1",
  recordId: "1",
  nif: "12345678Z",
  tipoPersona: "Persona física",
  clientePrivado: "0",
  aplicaRetencion: "0",
  nombre: "Antonio",
  apellido1: "García",
  apellido2: "López",
  nombreCompleto: "Antonio García López",
  razonSocial: "",
  displayName: "Antonio García López",
  via: "C/",
  direccion: "Mayor",
  numeroCalle: "23",
  bloque: "",
  escalera: "",
  planta: "4",
  puerta: "B",
  codigoPostal: "28013",
  poblacion: "Madrid",
  provincia: "Madrid",
  pais: "España",
  direccionCompleta: "C/ Mayor 23 · 4 B · 28013 Madrid",
  email: "antonio@example.com",
  telefono: "600000000",
};

export const contactosAseguradoMock: ContactoAsegurado[] = [
  { id: "CONT-1", recordId: "1", idAsegurado: "ASEG-1", nombre: "Antonio García", nombreCompleto: "Antonio García López", cargo: "Asegurado", telefono: "961000000", telefono2: "", movil: "600000000", mail: "antonio@example.com", notas: "" },
];

export const polizasMock: Poliza[] = [
  { id: "POL-1", idAsegurado: "ASEG-1", idRamo: "RAMO-1", numeroPoliza: "POL-2025-001", ramo: "Hogar", tipoRamo: "Multirriesgo", direccionCompleta: "C/ Mayor 23 · 28013 Madrid", fechaEfecto: "01/01/2025", nSiniestros: "3", poblacion: "Madrid", provincia: "Madrid", agente: "", telefonoAgente: "", emailAgente: "" },
];

export const siniestrosMock: Siniestro[] = [
  { id: "1", idSiniestro: "SIN-1", idAsegurado: "ASEG-1", idPoliza: "POL-1", numero: "2025/00142", compania: "Mapfre", asegurado: "García López, Antonio", direccion: "C/ Mayor 23, 4ºB · 28013 Madrid", fechaApertura: "2025-04-12", tipo: "Daños por agua", ramo: "Hogar", numeroPoliza: "POL-2025-001", fechaCierre: "", valoracionTotal: "1.250,00", excluido: "0" },
  { id: "2", idSiniestro: "SIN-2", idAsegurado: "ASEG-1", idPoliza: "POL-2", numero: "2025/00138", compania: "Allianz", asegurado: "Martínez Ruiz, Carmen", direccion: "Av. de la Constitución 45 · 41001 Sevilla", fechaApertura: "2025-04-10", tipo: "Robo", ramo: "Comercio", numeroPoliza: "POL-2025-002", fechaCierre: "18/04/2025", valoracionTotal: "0", excluido: "1" },
];
