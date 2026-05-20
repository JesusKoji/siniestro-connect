# Mapa parcial de estructura FileMaker - GestionPericial

Fuente: DDR parcial aportado en `Archivo.zip` el 2026-05-19. Este documento se irá ampliando con nuevos módulos.

## Resumen

- **Asegurados**: 47 campos
- **ContactosAsegurados**: 15 campos
- **Polizas**: 129 campos
- **Siniestros**: 335 campos
- **ContactosSiniestros**: 15 campos

## Criterios ya confirmados para la web

- Base de datos: `GestionPericial`
- Layout API actual para listado/enlaces: `API_EnlacesSiniestros`
- Script para enlaces/WhatsApp: `SMS`
- Siniestros en curso: campo `FechaCierre` vacío (`=` en búsqueda FileMaker)
- Campos usados inicialmente en la web: `NumeroSiniestro`, `Asegurado`, `zVistaDireccionCrawfordEnLinea`, `TipoSiniestro`, `siniestros_polizas_COMPANIAS::Alias` / `siniestros_polizas_COMPANIAS:Alias`

## Layouts API disponibles

- `API_Asegurados`: layout API para tabla `Asegurados`.
- `API_ContactosAsegurado`: layout API para tabla `ContactosAsegurados`.
- `API_Polizas`: layout API para tabla `Polizas`.
- `API_Siniestros`: layout API para tabla `Siniestros`.
- `API_ContactosSiniestros`: layout API para tabla `ContactosSiniestros`.
- `API_EnlacesSiniestros`: layout API utilizado actualmente por la web para siniestros en curso y envío de enlaces.

## Modelo funcional inicial

```text
Asegurados
├── ContactosAsegurados
├── Polizas
│   └── Siniestros
└── Siniestros
    └── ContactosSiniestros
```

## Relaciones confirmadas

### Asegurados → ContactosAsegurados

```text
Asegurados::_kp_ID_Asegurado
        =
ContactosAsegurados::_kf_ID_Asegurado
```

- Clave primaria de `Asegurados`: `_kp_ID_Asegurado`.
- Clave primaria de `ContactosAsegurados`: `_kp_ID_ContactoAseg`.
- Clave foránea en `ContactosAsegurados` hacia `Asegurados`: `_kf_ID_Asegurado`.

### Asegurados → Polizas

```text
Asegurados::_kp_ID_Asegurado
        =
Polizas::_kf_ID_Asegurado
```

- Clave primaria de `Polizas`: `_kp_ID_Poliza`.
- Clave foránea en `Polizas` hacia `Asegurados`: `_kf_ID_Asegurado`.

### Asegurados → Siniestros

```text
Asegurados::_kp_ID_Asegurado
        =
Siniestros::_kf_ID_Asegurado
```

- Clave primaria de `Siniestros`: `_kp_ID_Siniestro`.
- Clave foránea en `Siniestros` hacia `Asegurados`: `_kf_ID_Asegurado`.

### Polizas → Siniestros

```text
Polizas::_kp_ID_Poliza
        =
Siniestros::_kf_ID_Poliza
```

- Clave primaria de `Siniestros`: `_kp_ID_Siniestro`.
- Clave foránea en `Siniestros` hacia `Polizas`: `_kf_ID_Poliza`.

### Siniestros → ContactosSiniestros

```text
Siniestros::_kp_ID_Siniestro
        =
ContactosSiniestros::_kf_ID_Siniestro
```

- Clave primaria de `ContactosSiniestros`: `_kp_ID_ContSini`.
- Clave foránea en `ContactosSiniestros` hacia `Siniestros`: `_kf_ID_Siniestro`.

## Campos clave para la interfaz web

### Asegurados

- `_kp_ID_Asegurado`: clave primaria textual del asegurado.
- `_kp_ID_Aseg_UUIDNumber`: identificador UUIDNumber.
- `Nombre`, `Apellido1`, `Apellido2`, `NombreCompleto`, `Apellidos`, `RazonSocial`.
- `is_CIF`, `not_CIF`, `NIF`.
- `Via`, `Direccion`, `DireccCompleta`, `NumeroCalle`, `Bloque`, `Escalera`, `Planta`, `Puerta`, `CodPostal`, `Poblacion`, `Provincia`, `Comunidad`, `Pais`.
- `latitud`, `longitud`, `CoordenadasGMS`.
- `email`, `Telefono`.
- `Is_ClientePrivado`, `Is_Retencion`, `TipoAseg`.

### ContactosAsegurados

- `_kp_ID_ContactoAseg`: clave primaria.
- `_kf_ID_Asegurado`: clave foránea al asegurado; se relaciona con `Asegurados::_kp_ID_Asegurado`.
- `Nombre`, `NombreCompleto`.
- `Telefono`, `Telefono2`, `Fax`, `Movil`, `Mail`.
- `Cargo`, `Notas`.

### Polizas

- `_kp_ID_Poliza`: clave primaria.
- `_kp_ID_Poliza_UUIDNumber`: identificador UUIDNumber.
- `_kf_ID_Asegurado`: clave foránea al asegurado; se relaciona con `Asegurados::_kp_ID_Asegurado`.
- `_kf_ID_Asegurado_UUIDNumber`.
- `_kf_ID_Compania`, `_kf_ID_Ramo`, `_kf_ID_ContPol`.
- `NumeroPoliza`.
- `Agente`, `TlfAgente`, `TlfAgente2`, `EmailAgente`.
- Dirección del riesgo: `Via`, `Direccion`, `NumeroCalle`, `Bloque`, `Escalera`, `Planta`, `Puerta`, `CodPostal`, `Poblacion`, `Provincia`, `Comunidad`, `Pais`, `DireccionCompleta`, `PosGPS`.
- Dirección normalizada/catastro: `ViaC`, `NombreViaC`, `DireccionC`, `NumeroCalleC`, `BloqueC`, `EscaleraC`, `PlantaC`, `PuertaC`, `CodPostaclC`, `PoblacionC`, `ProvinciaC`, `CLAVE_DIRECCION_BUSQUEDA`.
- Capitales y valoración: `CtePoliza`, `CtdoPoliza`, `MobYMaqPoliza`, `ExistenciasPoliza`, `Embarcacion`, `AnoConstruccion`, `Antiguedad`, `CapitalRCPoliza`, `CapitalPEMPoliza`, `CapitalPEM`.
- Infraseguro: campos `CoefInfra*`, `Is_Infraseg_*`, `TextoInfraseguro*`, `InfraseguroCrawford*`.
- Catastro: `Catastro`, `CatastroVerificado`, `CatastroJSONRaw`, `CatastroUltAct`, `CatastroJSONclean`, `UsosJSON`, `UsosParcelaJSON`, `SupConstruidaTotal`, `UsoPrincipal`.

### Siniestros

Tabla principal operativa. El DDR parcial incluye 335 campos. Campos especialmente relevantes para la web/agente:

- Clave primaria: `_kp_ID_Siniestro`.
- Claves foráneas: `_kf_ID_Poliza`, `_kf_ID_Asegurado`.
- Identificación: `NumeroSiniestro`, `NumeroSiniestro2`, `id`.
- Estado/ciclo: `FechaCierre` se usa para filtrar en curso cuando está vacío.
- Asegurado: `NombreAseg`, `RazonSocial`, `NIFAsegurado`, `Asegurado` si está disponible en layout API.
- Dirección: `NumeroCalle`, `Poblacion`, `Provincia`, `Pais`, `PosGPS`, `zVistaDireccionCrawfordEnLinea`, `LatitudG`, `LongitudG`, `CoordenadasGMS`.
- Tipo/ramo: `Ramo`, `RamoCrawford`, `TipoSiniestro`, `CausaCrawford`.
- Comunicación/correo: `Gmail_Importado`, `MailEncuesta`, `MailTramitador`, `TextoSMS`, `NombreMensajes`.
- Documentación/informes: `PathPDF`, `ResumenPDF`, `PrimerInformePrevio`, `PortalPlusUltra`.
- Valoración/facturación: `Honorarios`, `HonorariosNuevos`, `HonorariosPartAntiguos`, `Indemnizacion`, `Infraseguro`, `ObservacionesFacturacion`, `_kf_ID_Facturacion`, `NuevosGastos`.
- Tramitación: `NotasTramitacion`, `Observaciones`, `Sugerencias`, `Perjudicado`, `Retencion15`.

### ContactosSiniestros

- `_kp_ID_ContSini`: clave primaria.
- `_kf_ID_Siniestro`: clave foránea al siniestro; se relaciona con `Siniestros::_kp_ID_Siniestro`.
- `Nombre`, `NombreCompleto`.
- `Telefono`, `Telefono2`, `Movil`, `Mail`.
- `Cargo`, `Notas`.
- `Telefono Copia`: campo calculado/formateado.

## Implicaciones para el desarrollo web

1. La vista operativa principal debe seguir centrada en `Siniestros` y no en `Asegurados`.
2. Para enriquecer la ficha de siniestro se deberán añadir endpoints/cargas para:
   - contactos del siniestro (`ContactosSiniestros`),
   - asegurado vinculado,
   - póliza vinculada,
   - contactos del asegurado (`ContactosAsegurados`).
3. El agente de correos debe poder identificar siniestros por:
   - `NumeroSiniestro`,
   - email/teléfono en `ContactosSiniestros`,
   - email/teléfono en `ContactosAsegurados`,
   - `NIF` / `NIFAsegurado`,
   - número de póliza `NumeroPoliza`.
4. Para la fase documental conviene añadir o mapear una tabla específica de índice documental, porque los archivos no se guardan como contenedores en FileMaker.
5. Para cargar contactos del asegurado desde la web se debe obtener primero `_kp_ID_Asegurado` del asegurado vinculado y luego buscar en `ContactosAsegurados::_kf_ID_Asegurado`.
6. Para cargar pólizas del asegurado desde la web se debe obtener primero `_kp_ID_Asegurado` del asegurado vinculado y luego buscar en `Polizas::_kf_ID_Asegurado`.
7. Para cargar contactos del siniestro desde la web se debe obtener primero `_kp_ID_Siniestro` y luego buscar en `ContactosSiniestros::_kf_ID_Siniestro`.
8. Para cargar la póliza concreta del siniestro se debe usar `Siniestros::_kf_ID_Poliza` contra `Polizas::_kp_ID_Poliza`.
9. Los layouts API disponibles permiten cargar estos módulos de forma separada desde la web usando la Data API.

## Pendiente de ampliar

- Scripts relacionados con `SMS`, Dropbox, enlaces y alta documental.
- Tablas de documentos, comunicaciones, alertas, tareas, facturación e informes.
- Campos exactos incluidos actualmente en cada layout API.
