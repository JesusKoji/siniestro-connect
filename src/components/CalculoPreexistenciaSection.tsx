import { Poliza } from "@/data/siniestros";
import { FilaCamposPoliza } from "@/components/polizaCamposFormulario";

type CalculoPreexistenciaSectionProps = {
  poliza: Poliza;
  onChange?: (campo: keyof Poliza, valor: string) => void;
};

export const CalculoPreexistenciaSection = ({
  poliza,
  onChange,
}: CalculoPreexistenciaSectionProps) => {
  const editable = Boolean(onChange);

  return (
    <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
      <h4 className="font-semibold">Cálculo de la preexistencia</h4>
      <div className="mt-4 space-y-4">
        <FilaCamposPoliza
          titulo="Continente"
          poliza={poliza}
          editable={editable}
          onChange={onChange}
          campos={[
            {
              campo: "cteVn",
              label: "Cte VN",
              tipo: "moneda",
              soloLectura: true,
              titulo: "Capital continente a valor de nuevo (CteVN) — calculado en FileMaker",
            },
            {
              campo: "depreciaCte",
              label: "Dep. Cte",
              tipo: "porcentaje",
              ancho: "estrecho",
              placeholder: "%",
              titulo: "Depreciación continente en porcentaje (DepreciaCte)",
            },
            {
              campo: "cteVr",
              label: "Cte VR",
              tipo: "moneda",
              soloLectura: true,
              titulo: "Capital continente a valor real (CteVR) — calculado en FileMaker",
            },
            {
              campo: "primerRiesgo",
              label: "Primer riesgo",
              tipo: "checkbox",
              titulo: "PrimerRiesgo (0 = no, 1 = sí)",
            },
            {
              campo: "coefInfraCte",
              label: "Infra Cte VN",
              tipo: "decimal2",
              ancho: "estrecho",
              soloLectura: true,
              titulo: "Coeficiente infraseguro continente a VN (CoefInfraCte) — calculado en FileMaker",
            },
            {
              campo: "coefInfraCteVr",
              label: "Infra Cte VR",
              tipo: "decimal2",
              ancho: "estrecho",
              soloLectura: true,
              titulo: "Coeficiente infraseguro continente a VR (CoefInfraCteVR) — calculado en FileMaker",
            },
            {
              campo: "infraseguroCrawfordCte",
              label: "Infraseguro Crawford Cte",
              tipo: "decimal2",
              ancho: "medio",
              soloLectura: true,
              titulo: "Infraseguro Crawford continente (InfraseguroCrawfordCte) — calculado en FileMaker",
            },
          ]}
        />

        <FilaCamposPoliza
          titulo="Contenido"
          poliza={poliza}
          editable={editable}
          onChange={onChange}
          campos={[
            {
              campo: "ctdoVn",
              label: "Ctdo VN",
              tipo: "moneda",
              titulo: "Capital de contenido a valor de nuevo (CtdoVN)",
            },
            {
              campo: "depreciaCtdo",
              label: "Dep. Ctdo",
              tipo: "porcentaje",
              ancho: "estrecho",
              placeholder: "%",
              titulo: "Depreciación contenido en porcentaje (DepreciaCtdo)",
            },
            {
              campo: "ctdoVr",
              label: "Ctdo VR",
              tipo: "moneda",
              soloLectura: true,
              titulo: "Capital contenido a VR (CtdoVR) — calculado en FileMaker",
            },
            {
              campo: "coefInfraCtdo",
              label: "Infra Ctdo VN",
              tipo: "decimal2",
              ancho: "estrecho",
              soloLectura: true,
              titulo: "Coeficiente infraseguro contenido a VN (CoefInfraCtdo) — calculado en FileMaker",
            },
            {
              campo: "coefInfraCtdoVr",
              label: "Infra Ctdo VR",
              tipo: "decimal2",
              ancho: "estrecho",
              soloLectura: true,
              titulo: "Coeficiente infraseguro contenido a VR (CoefInfraCtdoVR) — calculado en FileMaker",
            },
            {
              campo: "infraseguroCrawfordCtdo",
              label: "Infraseguro Crawford Ctdo",
              tipo: "decimal2",
              ancho: "medio",
              soloLectura: true,
              titulo: "Infraseguro Crawford contenido (InfraseguroCrawfordCtdo) — calculado en FileMaker",
            },
          ]}
        />

        <FilaCamposPoliza
          titulo="Mobiliario y maquinaria"
          poliza={poliza}
          editable={editable}
          onChange={onChange}
          campos={[
            {
              campo: "mobYMaqVn",
              label: "Mob/Maq VN",
              tipo: "moneda",
              titulo: "Mobiliario y maquinaria a valor de nuevo (MobYMaqVN)",
            },
            {
              campo: "depreciaMobYMaq",
              label: "Dep. Mob/Maq",
              tipo: "porcentaje",
              ancho: "estrecho",
              placeholder: "%",
              titulo: "Depreciación mobiliario y maquinaria en porcentaje (DepreciaMobYMaq)",
            },
            {
              campo: "mobYMaqVr",
              label: "Mob/Maq VR",
              tipo: "moneda",
              soloLectura: true,
              titulo: "Mobiliario y maquinaria a VR (MobYMaqVR) — calculado en FileMaker",
            },
            {
              campo: "coefInfraMobYMaqVn",
              label: "Infra Mob VN",
              tipo: "decimal2",
              ancho: "estrecho",
              soloLectura: true,
              titulo: "Coeficiente infraseguro mobiliario y maquinaria a VN (CoefInfraMobYMaqVN) — calculado en FileMaker",
            },
            {
              campo: "coefInfraMobYMaqVr",
              label: "Infra Mob VR",
              tipo: "decimal2",
              ancho: "estrecho",
              soloLectura: true,
              titulo: "Coeficiente infraseguro mobiliario y maquinaria a VR (CoefInfraMobYMaqVR) — calculado en FileMaker",
            },
            {
              campo: "infraseguroCrawfordMob",
              label: "Infraseguro Crawford Mob",
              tipo: "decimal2",
              ancho: "medio",
              soloLectura: true,
              titulo: "Infraseguro Crawford mobiliario (InfraseguroCrawfordMob) — calculado en FileMaker",
            },
          ]}
        />

        <FilaCamposPoliza
          titulo="Existencias"
          poliza={poliza}
          editable={editable}
          onChange={onChange}
          campos={[
            {
              campo: "existenciasReales",
              label: "Existencias reales",
              tipo: "moneda",
              titulo: "Existencias reales del riesgo (ExistenciasReales)",
            },
            {
              campo: "coefInfraExistencias",
              label: "Infra exist.",
              tipo: "decimal2",
              ancho: "estrecho",
              soloLectura: true,
              titulo: "Coeficiente infraseguro existencias (CoefInfraExistencias) — calculado en FileMaker",
            },
            {
              campo: "infraseguroCrawfordExist",
              label: "Infraseguro Crawford exist.",
              tipo: "decimal2",
              ancho: "medio",
              soloLectura: true,
              titulo: "Infraseguro Crawford existencias (InfraseguroCrawfordExist) — calculado en FileMaker",
            },
          ]}
        />

        <FilaCamposPoliza
          titulo="Embarcación"
          poliza={poliza}
          editable={editable}
          onChange={onChange}
          campos={[
            {
              campo: "embarcacionVr",
              label: "Embarcación VR",
              tipo: "moneda",
              titulo: "Valor real embarcación (EmbarcacionVR)",
            },
            {
              campo: "coefInfraEmbarcacion",
              label: "Infra emb.",
              tipo: "decimal2",
              ancho: "estrecho",
              soloLectura: true,
              titulo: "Coeficiente infraseguro embarcación (CoefInfraEmbarcacion) — calculado en FileMaker",
            },
          ]}
        />

        <FilaCamposPoliza
          titulo="PEM y facturación"
          poliza={poliza}
          editable={editable}
          onChange={onChange}
          campos={[
            {
              campo: "capitalPem",
              label: "Capital PEM",
              tipo: "moneda",
              titulo: "Capital PEM real (CapitalPEM)",
            },
            {
              campo: "facturacionReal",
              label: "Facturación real",
              tipo: "moneda",
              titulo: "Facturación real según 390 (FacturacionReal)",
            },
          ]}
        />
      </div>
    </div>
  );
};
