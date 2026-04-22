// Datos de ejemplo para desarrollo. Sustituir por la llamada real a FileMaker Data API.
export interface Siniestro {
  id: string;
  numero: string;
  compania: string;
  asegurado: string;
  direccion: string;
  fechaApertura: string;
  tipo: string;
}

export const siniestrosMock: Siniestro[] = [
  {
    id: "1",
    numero: "2025/00142",
    compania: "Mapfre",
    asegurado: "García López, Antonio",
    direccion: "C/ Mayor 23, 4ºB · 28013 Madrid",
    fechaApertura: "2025-04-12",
    tipo: "Daños por agua",
  },
  {
    id: "2",
    numero: "2025/00138",
    compania: "Allianz",
    asegurado: "Martínez Ruiz, Carmen",
    direccion: "Av. de la Constitución 45 · 41001 Sevilla",
    fechaApertura: "2025-04-10",
    tipo: "Robo",
  },
  {
    id: "3",
    numero: "2025/00135",
    compania: "Generali",
    asegurado: "Fernández Pérez, Javier",
    direccion: "C/ Bailén 12, 2ºA · 48003 Bilbao",
    fechaApertura: "2025-04-08",
    tipo: "Incendio",
  },
  {
    id: "4",
    numero: "2025/00131",
    compania: "AXA",
    asegurado: "Sánchez Moreno, Laura",
    direccion: "Pg. de Gràcia 88 · 08008 Barcelona",
    fechaApertura: "2025-04-05",
    tipo: "Cristales",
  },
  {
    id: "5",
    numero: "2025/00128",
    compania: "Mutua Madrileña",
    asegurado: "Rodríguez Gil, Manuel",
    direccion: "C/ del Carmen 7 · 46001 Valencia",
    fechaApertura: "2025-04-03",
    tipo: "Responsabilidad civil",
  },
  {
    id: "6",
    numero: "2025/00124",
    compania: "Reale Seguros",
    asegurado: "López Vega, Isabel",
    direccion: "C/ Real 34, bajo · 15003 A Coruña",
    fechaApertura: "2025-04-01",
    tipo: "Daños por agua",
  },
  {
    id: "7",
    numero: "2025/00120",
    compania: "Mapfre",
    asegurado: "Jiménez Castro, Pedro",
    direccion: "Av. de Andalucía 102 · 29006 Málaga",
    fechaApertura: "2025-03-29",
    tipo: "Vendaval",
  },
];
