import { Asegurado } from "@/data/siniestros";

export type DireccionNormalizada = Pick<
  Asegurado,
  | "via"
  | "direccion"
  | "numeroCalle"
  | "bloque"
  | "escalera"
  | "planta"
  | "puerta"
  | "codigoPostal"
  | "poblacion"
  | "provincia"
  | "pais"
  | "direccionCompleta"
> & {
  latitud?: string;
  longitud?: string;
};

export async function normalizarDireccion(direccionLibre: string): Promise<DireccionNormalizada> {
  const q = direccionLibre.trim();
  if (!q) throw new Error("Introduce una dirección para normalizar");

  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "No se pudo normalizar la dirección");
  }

  return data as DireccionNormalizada;
}
