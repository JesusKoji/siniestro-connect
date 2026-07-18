// Datos de ejemplo para desarrollo. Sustituir por la llamada real a FileMaker Data API.
export interface Siniestro {
  id: string;
  recordId?: string;
  numero: string;
  numeroSiniestro2?: string;
  crawfordSini?: string;
  compania: string;
  /** Alias de la compañía (tabla Companias vía póliza). */
  alias?: string;
  asegurado: string;
  direccion: string;
  /** Via + Direccion + NumeroCalle + Bloque + Escalera + Planta + Puerta */
  direccionCalle?: string;
  via?: string;
  calle?: string;
  numeroCalle?: string;
  bloque?: string;
  escalera?: string;
  planta?: string;
  puerta?: string;
  distancia?: string;
  poblacion?: string;
  codPostal?: string;
  provincia?: string;
  fechaRecepcion?: string;
  horaRecepcion?: string;
  horaAsignacion?: string;
  fechaEfectoPoliza?: string;
  descripcionRiesgo?: string;
  relatoSiniestro?: string;
  notasTramitacion?: string;
  fechaApertura: string;
  /** Fecha de asignación / encargo del siniestro. */
  fechaAsignacion?: string;
  diasAbierto?: string;
  diasUltimoPrevio?: string;
  siguientePrevio?: string;
  zSumaPrevio?: string;
  /** Total Crawford en curso (campo resumen del layout API_Siniestros). */
  zTotalCrawford?: string;
  tipo: string;
  ramo: string;
  numeroPoliza: string;
  fechaOcurrencia: string;
  fechaCierre: string;
  valoracionTotal: string;
  excluido: string;
  idSiniestro?: string;
  idAsegurado?: string;
  idPoliza?: string;
}

export const siniestroVacio: Siniestro = {
  id: "",
  numero: "",
  compania: "",
  asegurado: "",
  direccion: "",
  tipo: "",
  ramo: "",
  numeroPoliza: "",
  fechaOcurrencia: "",
  fechaCierre: "",
  valoracionTotal: "",
  excluido: "0",
  fechaApertura: "",
};

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
  telefonoSecundario: string;
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
  recordId?: string;
  idAsegurado: string;
  idRamo: string;
  idCompania: string;
  asegurado: string;
  compania: string;
  numeroPoliza: string;
  ramo: string;
  tipoRamo: string;
  direccionCompleta: string;
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
  nombreViaC: string;
  viaC: string;
  direccionC: string;
  numeroCalleC: string;
  bloqueC: string;
  escaleraC: string;
  plantaC: string;
  puertaC: string;
  codigoPostalC: string;
  poblacionC: string;
  provinciaC: string;
  /** polizas_CAT_CODIGO_MUNICIPIOS::Codigo (relación PoblacionC ↔ Municipio). */
  codigoMunicipioCatastro?: string;
  catastro: string;
  anoConstruccion: string;
  /** TotalSuperficie de la póliza. */
  totalSuperficie: string;
  /** SupConstruidaTotal (suma de usos del catastro). */
  supConstruidaTotal?: string;
  /** Antiguedad (años) de la póliza. */
  antiguedad: string;
  fechaEfecto: string;
  nSiniestros: string;
  agente: string;
  telefonoAgente: string;
  emailAgente: string;
  descripcion: string;
  informacion: string;
  comentarios: string;
  medidasPci: string;
  medidasRobo: string;
  /** CtePoliza — capital de continente contratado en la póliza. */
  ctePoliza: string;
  /** CtdoPoliza — capital de contenido contratado en la póliza. */
  ctdoPoliza: string;
  /** MobYMaqPoliza — capital de mobiliario y maquinaria contratado en la póliza. */
  mobYMaqPoliza: string;
  /** ExistenciasPoliza — capital de existencias contratado en la póliza. */
  existenciasPoliza: string;
  /** Embarcacion — capital asegurado embarcación. */
  embarcacion: string;
  /** CapitalPEMPoliza — presupuesto ejecución material en TRC contratado. */
  capitalPemPoliza: string;
  /** CapitalRCPoliza — capital RC contratado en la póliza. */
  capitalRcPoliza: string;
  /** FacturacionDeclarada — facturación declarada en la póliza. */
  facturacionDeclarada: string;
  /** Propietario del riesgo asegurado. */
  propietario: string;
  /** TotalContinente — suma del continente (DETALLECONTINENTE). */
  totalContinente: string;
  /** CteVN — capital continente a valor de nuevo. */
  cteVn: string;
  /** DepreciaCte — depreciación continente (años). */
  depreciaCte: string;
  /** CteVR — capital continente a valor real. */
  cteVr: string;
  /** PrimerRiesgo — 0 no / 1 sí. */
  primerRiesgo: string;
  /** CoefInfraCte — coeficiente infraseguro continente VN. */
  coefInfraCte: string;
  /** CoefInfraCteVR — coeficiente infraseguro continente VR. */
  coefInfraCteVr: string;
  /** InfraseguroCrawfordCte — infraseguro Crawford continente. */
  infraseguroCrawfordCte: string;
  /** CtdoVN — capital contenido a VN. */
  ctdoVn: string;
  /** DepreciaCtdo — depreciación contenido. */
  depreciaCtdo: string;
  /** CtdoVR — capital contenido a VR. */
  ctdoVr: string;
  /** CoefInfraCtdo — coeficiente infraseguro contenido VN. */
  coefInfraCtdo: string;
  /** CoefInfraCtdoVR — coeficiente infraseguro contenido VR. */
  coefInfraCtdoVr: string;
  /** InfraseguroCrawfordCtdo — infraseguro Crawford contenido. */
  infraseguroCrawfordCtdo: string;
  /** MobYMaqVN — mobiliario y maquinaria a VN. */
  mobYMaqVn: string;
  /** DepreciaMobYMaq — depreciación mobiliario y maquinaria. */
  depreciaMobYMaq: string;
  /** MobYMaqVR — mobiliario y maquinaria a VR. */
  mobYMaqVr: string;
  /** CoefInfraMobYMaqVN — coeficiente infraseguro mob VN. */
  coefInfraMobYMaqVn: string;
  /** CoefInfraMobYMaqVR — coeficiente infraseguro mob VR. */
  coefInfraMobYMaqVr: string;
  /** InfraseguroCrawfordMob — infraseguro Crawford mobiliario. */
  infraseguroCrawfordMob: string;
  /** ExistenciasReales — existencias reales del riesgo. */
  existenciasReales: string;
  /** CoefInfraExistencias — coeficiente infraseguro existencias. */
  coefInfraExistencias: string;
  /** InfraseguroCrawfordExist — infraseguro Crawford existencias. */
  infraseguroCrawfordExist: string;
  /** EmbarcacionVR — valor real embarcación. */
  embarcacionVr: string;
  /** CoefInfraEmbarcacion — coeficiente infraseguro embarcación. */
  coefInfraEmbarcacion: string;
  /** CapitalPEM — capital PEM real. */
  capitalPem: string;
  /** FacturacionReal — facturación real según 390. */
  facturacionReal: string;
  distancia: string;
  latitud: string;
  longitud: string;
}

export interface Ramo {
  id: string;
  recordId?: string;
  idCompania: string;
  ramo: string;
  tipoRamo: string;
}

export interface Compania {
  id: string;
  recordId?: string;
  nombre: string;
  alias: string;
}

/** Catálogo de tipologías de continente (tabla TIPOLOGIASCONTINENTE). */
export interface TipologiaContinente {
  /** ClavePrincipal de TIPOLOGIASCONTINENTE (lo que guarda _kf_ID_Tipologias). */
  id: string;
  recordId?: string;
  /** Campo TipoContinente. */
  nombre: string;
  /** Campo Precio (precio sugerido para la tipología). */
  precio: string;
}

/** Línea de preexistencia de continente (tabla DETALLECONTINENTE). */
export interface DetalleContinente {
  /** ClavePrincipal de DETALLECONTINENTE. */
  id: string;
  recordId?: string;
  /** _kf_ID_Poliza. */
  idPoliza: string;
  /** _kf_ID_Tipologias (ClavePrincipal de la tipología relacionada). */
  idTipologia: string;
  /** Medicion (superficie). */
  medicion: string;
  /** Precio. */
  precio: string;
  /** Importe (Medicion × Precio). */
  importe: string;
}

/** Línea de detalle catastro de una póliza (tabla DETALLECATASTRO), solo lectura. */
export interface DetalleCatastroPoliza {
  recordId: string;
  idPoliza: string;
  uso: string;
  superficie: string;
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
  telefonoSecundario: "",
};

export const contactosAseguradoMock: ContactoAsegurado[] = [
  { id: "CONT-1", recordId: "1", idAsegurado: "ASEG-1", nombre: "Antonio García", nombreCompleto: "Antonio García López", cargo: "Asegurado", telefono: "961000000", telefono2: "", movil: "600000000", mail: "antonio@example.com", notas: "" },
];

export const companiasMock: Compania[] = [
  { id: "CIA-1", recordId: "1", nombre: "Mapfre", alias: "Mapfre" },
  { id: "CIA-2", recordId: "2", nombre: "Allianz", alias: "Allianz" },
];

export const polizasMock: Poliza[] = [
  {
    id: "POL-1",
    recordId: "1",
    idAsegurado: "ASEG-1",
    idRamo: "RAMO-1",
    idCompania: "CIA-1",
    asegurado: "Antonio García López",
    compania: "Mapfre",
    numeroPoliza: "POL-2025-001",
    ramo: "Hogar",
    tipoRamo: "Multirriesgo",
    direccionCompleta: "C/ Mayor 23 · 28013 Madrid",
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
    nombreViaC: "",
    viaC: "",
    direccionC: "",
    numeroCalleC: "",
    bloqueC: "",
    escaleraC: "",
    plantaC: "",
    puertaC: "",
    codigoPostalC: "",
    poblacionC: "",
    provinciaC: "",
    catastro: "",
    anoConstruccion: "",
    totalSuperficie: "180",
    antiguedad: "30",
    fechaEfecto: "01/01/2025",
    nSiniestros: "3",
    agente: "Agente Demo",
    telefonoAgente: "961000000",
    emailAgente: "agente@example.com",
    descripcion: "Vivienda principal asegurada.",
    informacion: "Información general de la póliza.",
    comentarios: "Sin comentarios.",
    medidasPci: "",
    medidasRobo: "",
    ctePoliza: "350.000,00",
    ctdoPoliza: "45.000,00",
    mobYMaqPoliza: "12.500,00",
    existenciasPoliza: "8.000,00",
    embarcacion: "",
    capitalPemPoliza: "",
    capitalRcPoliza: "300.000,00",
    facturacionDeclarada: "120.000,00",
    propietario: "Propietario",
    totalContinente: "320.000,00",
    cteVn: "320.000,00",
    depreciaCte: "30",
    cteVr: "256.000,00",
    primerRiesgo: "0",
    coefInfraCte: "",
    coefInfraCteVr: "",
    infraseguroCrawfordCte: "",
    ctdoVn: "",
    depreciaCtdo: "",
    ctdoVr: "",
    coefInfraCtdo: "",
    coefInfraCtdoVr: "",
    infraseguroCrawfordCtdo: "",
    mobYMaqVn: "",
    depreciaMobYMaq: "",
    mobYMaqVr: "",
    coefInfraMobYMaqVn: "",
    coefInfraMobYMaqVr: "",
    infraseguroCrawfordMob: "",
    existenciasReales: "",
    coefInfraExistencias: "",
    infraseguroCrawfordExist: "",
    embarcacionVr: "",
    coefInfraEmbarcacion: "",
    capitalPem: "",
    facturacionReal: "118.500,00",
    distancia: "",
    latitud: "",
    longitud: "",
  },
];

export const siniestrosMock: Siniestro[] = [
  {
    id: "1",
    recordId: "101",
    idSiniestro: "SIN-1",
    idAsegurado: "ASEG-1",
    idPoliza: "POL-1",
    numero: "2025/00142",
    numeroSiniestro2: "CRW-142",
    crawfordSini: "Sí",
    compania: "Mapfre",
    alias: "Mapfre",
    asegurado: "García López, Antonio",
    direccion: "C/ Mayor 23 4ºB · 28013 Madrid",
    direccionCalle: "C/ Mayor 23 4ºB",
    via: "C/",
    calle: "Mayor",
    numeroCalle: "23",
    planta: "4º",
    puerta: "B",
    distancia: "12",
    poblacion: "Madrid",
    codPostal: "28013",
    provincia: "Madrid",
    fechaRecepcion: "12/04/2025",
    horaRecepcion: "09:15",
    horaAsignacion: "09:20",
    fechaEfectoPoliza: "2019-05-07",
    descripcionRiesgo: "Vivienda unifamiliar planta baja y primera",
    relatoSiniestro: "Filtración en baño por rotura de tubería empotrada.",
    notasTramitacion: "Pendiente visita perito.",
    fechaApertura: "2025-04-12",
    fechaAsignacion: "2025-04-12",
    diasAbierto: "12",
    diasUltimoPrevio: "8",
    siguientePrevio: "20/05/2025",
    zSumaPrevio: "3",
    zTotalCrawford: "1",
    tipo: "Daños por agua",
    ramo: "Hogar",
    numeroPoliza: "POL-2025-001",
    fechaOcurrencia: "2025-04-11",
    fechaCierre: "",
    valoracionTotal: "1.250,00",
    excluido: "0",
  },
  {
    id: "2",
    idSiniestro: "SIN-2",
    idAsegurado: "ASEG-1",
    idPoliza: "POL-2",
    numero: "2025/00138",
    numeroSiniestro2: "",
    crawfordSini: "No",
    compania: "Allianz",
    alias: "Allianz",
    asegurado: "Martínez Ruiz, Carmen",
    direccion: "Av. de la Constitución 45 · 41001 Sevilla",
    direccionCalle: "Av. de la Constitución 45",
    poblacion: "Sevilla",
    codPostal: "41001",
    provincia: "Sevilla",
    fechaRecepcion: "10/04/2025",
    horaRecepcion: "11:30",
    fechaApertura: "2025-04-10",
    fechaAsignacion: "2025-04-10",
    diasAbierto: "30",
    diasUltimoPrevio: "16",
    siguientePrevio: "01/05/2025",
    zSumaPrevio: "1",
    tipo: "Robo",
    ramo: "Comercio",
    numeroPoliza: "POL-2025-002",
    fechaOcurrencia: "09/04/2025",
    fechaCierre: "18/04/2025",
    valoracionTotal: "0",
    excluido: "1",
  },
  {
    id: "3",
    idSiniestro: "SIN-3",
    idAsegurado: "ASEG-1",
    idPoliza: "POL-1",
    numero: "2024/00981",
    compania: "Mapfre",
    alias: "Mapfre",
    asegurado: "García López, Antonio",
    direccion: "C/ Mayor 23 4ºB · 28013 Madrid",
    direccionCalle: "C/ Mayor 23 4ºB",
    poblacion: "Madrid",
    fechaRecepcion: "03/08/2024",
    fechaApertura: "2024-08-03",
    fechaAsignacion: "2024-08-03",
    diasAbierto: "60",
    diasUltimoPrevio: "20",
    siguientePrevio: "15/09/2024",
    zSumaPrevio: "2",
    tipo: "Incendio",
    ramo: "Hogar",
    numeroPoliza: "POL-2025-001",
    fechaOcurrencia: "02/08/2024",
    fechaCierre: "15/09/2024",
    valoracionTotal: "4.500,00",
    excluido: "0",
  },
  {
    id: "4",
    recordId: "104",
    idSiniestro: "SIN-4",
    idAsegurado: "ASEG-1",
    idPoliza: "POL-1",
    numero: "2024/00412",
    compania: "Mapfre",
    alias: "Mapfre",
    asegurado: "García López, Antonio",
    direccion: "C/ Mayor 23 4ºB · 28013 Madrid",
    direccionCalle: "C/ Mayor 23 4ºB",
    poblacion: "Madrid",
    fechaRecepcion: "18/02/2024",
    fechaApertura: "2024-02-18",
    fechaAsignacion: "2024-02-18",
    diasAbierto: "22",
    diasUltimoPrevio: "12",
    siguientePrevio: "10/03/2024",
    zSumaPrevio: "4",
    tipo: "Daños por agua",
    ramo: "Hogar",
    numeroPoliza: "POL-2025-001",
    fechaOcurrencia: "17/02/2024",
    fechaCierre: "",
    valoracionTotal: "890,00",
    excluido: "0",
  },
  {
    id: "5",
    idSiniestro: "SIN-5",
    idAsegurado: "ASEG-1",
    idPoliza: "POL-1",
    numero: "2023/01105",
    compania: "Allianz",
    alias: "Allianz",
    asegurado: "García López, Antonio",
    direccion: "C/ Mayor 23 4ºB · 28013 Madrid",
    direccionCalle: "C/ Mayor 23 4ºB",
    poblacion: "Madrid",
    fechaRecepcion: "22/11/2023",
    fechaApertura: "2023-11-22",
    fechaAsignacion: "2023-11-22",
    tipo: "Robo",
    ramo: "Hogar",
    numeroPoliza: "POL-2025-001",
    fechaOcurrencia: "21/11/2023",
    fechaCierre: "10/01/2024",
    valoracionTotal: "2.100,00",
    excluido: "0",
  },
  {
    id: "6",
    idSiniestro: "SIN-6",
    idAsegurado: "ASEG-1",
    idPoliza: "POL-1",
    numero: "2023/00307",
    compania: "Mapfre",
    alias: "Mapfre",
    asegurado: "García López, Antonio",
    direccion: "C/ Mayor 23 4ºB · 28013 Madrid",
    direccionCalle: "C/ Mayor 23 4ºB",
    poblacion: "Madrid",
    fechaRecepcion: "05/03/2023",
    fechaApertura: "2023-03-05",
    fechaAsignacion: "2023-03-05",
    tipo: "Daños por agua",
    ramo: "Hogar",
    numeroPoliza: "POL-2025-001",
    fechaOcurrencia: "04/03/2023",
    fechaCierre: "25/03/2023",
    valoracionTotal: "650,00",
    excluido: "0",
  },
];
