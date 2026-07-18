import { Poliza } from "@/data/siniestros";
import { textoCampo } from "@/lib/textoCampo";

const CAMPOS_POLIZA: (keyof Poliza)[] = [
  "id",
  "recordId",
  "idAsegurado",
  "idRamo",
  "idCompania",
  "asegurado",
  "compania",
  "numeroPoliza",
  "ramo",
  "tipoRamo",
  "direccionCompleta",
  "via",
  "direccion",
  "numeroCalle",
  "bloque",
  "escalera",
  "planta",
  "puerta",
  "codigoPostal",
  "poblacion",
  "provincia",
  "nombreViaC",
  "viaC",
  "direccionC",
  "numeroCalleC",
  "bloqueC",
  "escaleraC",
  "plantaC",
  "puertaC",
  "codigoPostalC",
  "poblacionC",
  "provinciaC",
  "codigoMunicipioCatastro",
  "catastro",
  "anoConstruccion",
  "totalSuperficie",
  "supConstruidaTotal",
  "antiguedad",
  "fechaEfecto",
  "nSiniestros",
  "agente",
  "telefonoAgente",
  "emailAgente",
  "descripcion",
  "informacion",
  "comentarios",
  "medidasPci",
  "medidasRobo",
  "ctePoliza",
  "ctdoPoliza",
  "mobYMaqPoliza",
  "existenciasPoliza",
  "embarcacion",
  "capitalPemPoliza",
  "capitalRcPoliza",
  "facturacionDeclarada",
  "propietario",
  "totalContinente",
  "cteVn",
  "depreciaCte",
  "cteVr",
  "primerRiesgo",
  "coefInfraCte",
  "coefInfraCteVr",
  "infraseguroCrawfordCte",
  "ctdoVn",
  "depreciaCtdo",
  "ctdoVr",
  "coefInfraCtdo",
  "coefInfraCtdoVr",
  "infraseguroCrawfordCtdo",
  "mobYMaqVn",
  "depreciaMobYMaq",
  "mobYMaqVr",
  "coefInfraMobYMaqVn",
  "coefInfraMobYMaqVr",
  "infraseguroCrawfordMob",
  "existenciasReales",
  "coefInfraExistencias",
  "infraseguroCrawfordExist",
  "embarcacionVr",
  "coefInfraEmbarcacion",
  "capitalPem",
  "facturacionReal",
  "distancia",
  "latitud",
  "longitud",
];

/** Convierte todos los campos de póliza a string (FileMaker puede devolver números). */
export function normalizarPoliza(poliza: Poliza): Poliza {
  const normalizada = { ...poliza } as Record<keyof Poliza, string | undefined>;

  for (const campo of CAMPOS_POLIZA) {
    const valor = poliza[campo];
    if (valor === undefined || valor === null) {
      normalizada[campo] = "";
      continue;
    }
    normalizada[campo] = textoCampo(valor);
  }

  return normalizada as Poliza;
}

/** Mezcla póliza vacía + datos y normaliza para formularios. */
export function prepararPolizaParaFormulario(base: Poliza, datos: Partial<Poliza>): Poliza {
  return normalizarPoliza({ ...base, ...datos });
}
