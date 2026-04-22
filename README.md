# Siniestros — App móvil para FileMaker

Aplicación web ligera, pensada para usarse desde el móvil, que se conecta a una
base de datos de **FileMaker Server** mediante la **Data API** y permite:

- Consultar el listado de siniestros en curso.
- Buscar por número, compañía o asegurado.
- Ver el detalle de cada siniestro (número, compañía, asegurado, dirección).
- Ejecutar un script de FileMaker para enviar un enlace al cliente.
- Volver al listado o cerrar sesión.

En ordenador muestra un aviso (“versión de escritorio próximamente”).

---

## 1. Requisitos en el Mac mini

- **macOS** con FileMaker Server instalado y la **Data API activada**
  (Admin Console → Connectors → FileMaker Data API → *Enabled*).
- **Node.js LTS** (https://nodejs.org → descarga el `.pkg` y siguiente, siguiente).
- Un usuario de FileMaker con el set de privilegios **`fmrest`** y permiso para
  ejecutar el script de envío de enlace.

Comprueba que Node está instalado:

```bash
node -v
npm -v
```

---

## 2. Bajar el código desde GitHub

En Lovable, arriba a la derecha: **GitHub → Connect to GitHub → Create
Repository**. Después, en el Mac mini:

```bash
git clone https://github.com/TU-USUARIO/TU-REPO.git
cd TU-REPO
npm install
```

> Si prefieres no usar git: en github.com, dentro del repo, botón verde
> **Code → Download ZIP**, y descomprime.

---

## 3. Configurar tus datos reales de FileMaker

Edita **`src/lib/filemaker.ts`**:

```ts
const USE_MOCK = false; // ← desactivar los datos de ejemplo

export const FM_CONFIG = {
  host: "",                              // vacío = mismo servidor (sin CORS)
  database: "NombreDeTuArchivo",         // sin la extensión .fmp12
  layout: "API_Siniestros",              // layout expuesto a la Data API
  scriptEnviarEnlace: "EnviarEnlace",    // nombre EXACTO del script
};
```

### Mapeo de campos

El layout `API_Siniestros` debe contener (al menos) estos campos. Si en tu
FileMaker se llaman distinto, ajusta el mapeo en la función real dentro de
`listarSiniestrosEnCurso` (bloque marcado como *Ejemplo real*):

| Campo en la app | Sugerencia de nombre en FileMaker |
|-----------------|------------------------------------|
| `numero`        | `NumeroSiniestro`                  |
| `compania`      | `Compania`                         |
| `asegurado`     | `Asegurado`                        |
| `direccion`     | `Direccion`                        |
| `tipo`          | `TipoSiniestro`                    |
| `fechaApertura` | `FechaApertura`                    |
| `estado`        | `Estado` (filtramos por "En curso")|

Si me pasas los nombres exactos, te dejo el mapeo escrito.

---

## 4. Compilar la web

Dentro de la carpeta del proyecto:

```bash
npm run build
```

Esto genera la carpeta **`dist/`** con HTML, CSS y JS estáticos.

---

## 5. Servirla desde el mismo FileMaker Server

Copia **el contenido de `dist/`** a la carpeta web de FileMaker Server. En
macOS suele ser:

```
/Library/FileMaker Server/HTTPServer/htdocs/peritaciones/
```

(crea la subcarpeta `peritaciones` si no existe).

Acceso desde el iPhone, en la misma red:

```
https://IP-DEL-MAC-MINI/peritaciones/
```

Al estar en el **mismo origen** que la Data API → no hay problemas de CORS y
las llamadas a `/fmi/data/...` funcionan directamente.

### Añadir a la pantalla de inicio del iPhone

Abre la URL en Safari → botón compartir → **Añadir a pantalla de inicio**.
Quedará como una app, a pantalla completa, con el logo como icono.

---

## 6. Actualizar la web tras cambios

Cada vez que cambies algo del código:

```bash
npm run build
```

y vuelve a copiar el contenido de `dist/` a la carpeta del servidor
(sustituyendo lo anterior).

---

## 7. Estructura del proyecto (lo que probablemente toques)

- `src/lib/filemaker.ts` — conexión con la Data API y nombres de DB/layout/script.
- `src/data/siniestros.ts` — datos de ejemplo (solo se usan con `USE_MOCK = true`).
- `src/components/SiniestrosList.tsx` — listado y buscador.
- `src/components/SiniestroDetail.tsx` — pantalla de detalle y botones.
- `src/components/LoginScreen.tsx` — pantalla de login.
- `src/index.css` y `tailwind.config.ts` — colores, tipografías, tema.
- `src/assets/logo.png` — logo (sustitúyelo si cambias de imagen).

---

## 8. Problemas habituales

- **`Usuario o contraseña incorrectos`**: el usuario debe tener el privilegio
  `fmrest` y el archivo debe estar abierto en FileMaker Server.
- **Error 404 al hacer login**: revisa el nombre de `database` en
  `FM_CONFIG` (sin `.fmp12`) y que la Data API esté activada.
- **Error al ejecutar el script**: el nombre en `scriptEnviarEnlace` debe ser
  EXACTO (mayúsculas, espacios, acentos).
- **No aparecen siniestros**: comprueba que el layout `API_Siniestros`
  contiene los campos esperados y que hay registros con `estado = "En curso"`.
