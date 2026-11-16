import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { jpegAPdf } from "./src/lib/carpetaDocSiniestro";
import { guardarDocumentoEnDocSiniestro } from "./src/lib/guardarDocSiniestroServidor";

/** Misma regla que src/lib/catastro.ts (sin importar el módulo: usa alias @/). */
function esReferenciaCatastralValida(ref: string) {
  return /^(?:[A-Z0-9]{14}|[A-Z0-9]{20})$/.test(ref);
}

/** Certificado propio (.certs) con las IPs de red en el SAN, si existe. */
function leerCertificadoDev() {
  const keyPath = path.resolve(__dirname, ".certs/dev-key.pem");
  const certPath = path.resolve(__dirname, ".certs/dev-cert.pem");
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  }
  return null;
}

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GeocodeResult = {
  formatted_address?: string;
  place_id?: string;
  address_components?: AddressComponent[];
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};

type GoogleGeocodeResponse = {
  status?: string;
  error_message?: string;
  results?: GeocodeResult[];
};

type NormalizedAddress = ReturnType<typeof normalizeGoogleResult>;

function cartociudadPlugin(): Plugin {
  return {
    name: "local-cartociudad-api",
    configureServer(server) {
      server.middlewares.use("/api/cartociudad/candidates", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const q = url.searchParams.get("q")?.trim();
          if (!q) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Falta la dirección a normalizar" }));
            return;
          }

          const destino = new URL("https://www.cartociudad.es/geocoder/api/geocoder/candidates");
          destino.searchParams.set("q", q);
          destino.searchParams.set("limit", "8");
          const cartociudadRes = await fetch(destino, { signal: AbortSignal.timeout(20000) });
          const data = await cartociudadRes.json().catch(() => null);
          if (!cartociudadRes.ok || !Array.isArray(data)) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "CartoCiudad no devolvió direcciones" }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error consultando CartoCiudad" }));
        }
      });
    },
  };
}

function geocodePlugin(apiKey?: string): Plugin {
  return {
    name: "local-geocode-api",
    configureServer(server) {
      server.middlewares.use("/api/geocode", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const q = url.searchParams.get("q")?.trim();

          if (!q) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Falta la dirección a normalizar" }));
            return;
          }

          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Falta GOOGLE_MAPS_API_KEY en .env.local" }));
            return;
          }

          const geocodeResult = await geocodeWithRetries(q, apiKey);

          if (geocodeResult.candidates.length === 0) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: geocodeResult.error || "Google Maps no devolvió resultados" }));
            return;
          }

          const first = geocodeResult.candidates[0];
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ...first, candidates: geocodeResult.candidates }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error normalizando dirección" }));
        }
      });
    },
  };
}

async function geocodeWithRetries(q: string, apiKey: string): Promise<{ candidates: NormalizedAddress[]; error?: string }> {
  const variants = buildQueryVariants(q);
  const candidates: NormalizedAddress[] = [];
  const seen = new Set<string>();
  let lastError = "";

  for (const query of variants) {
    const googleUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    googleUrl.searchParams.set("address", query);
    googleUrl.searchParams.set("components", "country:ES");
    googleUrl.searchParams.set("region", "es");
    googleUrl.searchParams.set("language", "es");
    googleUrl.searchParams.set("key", apiKey);

    const googleRes = await fetch(googleUrl);
    const googleData = (await googleRes.json()) as GoogleGeocodeResponse;

    if (googleRes.ok && googleData.status === "OK" && googleData.results?.length) {
      for (const result of googleData.results.slice(0, 5)) {
        const normalized = { ...normalizeGoogleResult(result), consultaUsada: query };
        const key = normalized.placeId || normalized.direccionCompleta || normalized.googleFormattedAddress;
        if (key && !seen.has(key)) {
          seen.add(key);
          candidates.push(normalized);
        }
      }
    } else {
      lastError = googleData.error_message || `Google Maps no devolvió resultados: ${googleData.status || "sin estado"}`;
    }

    if (candidates.length >= 8) break;
  }

  return { candidates: candidates.slice(0, 8), error: lastError };
}

function buildQueryVariants(q: string) {
  const clean = q.trim().replace(/\s+/g, " ");
  const lower = clean.toLowerCase();
  const hasKnownType = /^(carrer|calle|avenida|avinguda|av\.?|passeig|paseo|plaza|plaça|camino|camí|carretera|ronda|travesía|travessera)\b/.test(lower);
  const hasValencia = /\b(valencia|valència)\b/.test(lower);
  const parsed = splitLooseStreetNumber(clean);
  const locationSuffix = formatLocationSuffix(parsed, hasValencia);

  if (hasKnownType) {
    return unique([clean, `${clean}${locationSuffix}`, `${clean}, España`]);
  }

  const loose = [
    clean,
    `${clean}${locationSuffix}`,
    `${clean}, España`,
    `Calle ${clean}${locationSuffix}`,
    `Carrer ${clean}${locationSuffix}`,
  ];

  if (!parsed) {
    return unique(loose);
  }

  const { street, number } = parsed;
  return unique([
    `Calle ${street}, ${number}${locationSuffix}`,
    `Carrer ${street}, ${number}${locationSuffix}`,
    `${street}, ${number}${locationSuffix}`,
    ...loose,
  ]);
}

function formatLocationSuffix(
  parsed: { city: string; postalCode?: string } | null,
  hasValencia: boolean
): string {
  if (parsed?.postalCode) {
    const cityPart = parsed.city ? `, ${parsed.city}` : "";
    return `, ${parsed.postalCode}${cityPart}, Valencia, España`;
  }

  if (parsed?.city) {
    if (/\b(valencia|valència)\b/i.test(parsed.city)) {
      return `, ${parsed.city}, España`;
    }
    return `, ${parsed.city}, Valencia, España`;
  }

  if (hasValencia) return ", España";
  return ", Valencia, España";
}

function splitLooseStreetNumber(q: string): { street: string; number: string; city: string; postalCode?: string } | null {
  const normalized = q.trim().replace(/\s+/g, " ");

  const cpMatch = normalized.match(/^(.*?)\s+(\d{5})(?:\s+(.+))?$/);
  if (cpMatch) {
    const before = cpMatch[1].trim();
    const postalCode = cpMatch[2];
    const cityAfterCp = cpMatch[3]?.trim() || "";
    const streetNum = before.match(/^(.*?)\s+(\d+[a-zA-Z]?)$/);
    if (streetNum) {
      return {
        street: streetNum[1].trim(),
        number: streetNum[2],
        city: cityAfterCp,
        postalCode,
      };
    }
  }

  const valenciaMatch = normalized.match(/\b(valencia|valència)\b/i);
  const withoutValencia = normalized.replace(/\b(valencia|valència)\b/gi, "").replace(/[, ]+$/g, "").trim();

  const withCityMatch = withoutValencia.match(/^(.*?)\s+(\d+[a-zA-Z]?)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][\w\s.'-]{2,})$/);
  if (withCityMatch && !/^\d{5}$/.test(withCityMatch[3].trim())) {
    return {
      street: withCityMatch[1].trim(),
      number: withCityMatch[2],
      city: withCityMatch[3].trim(),
    };
  }

  const endNumber = withoutValencia.match(/^(.*?)\s+(\d+[a-zA-Z]?)$/);
  if (!endNumber) return null;

  return {
    street: endNumber[1].trim(),
    number: endNumber[2],
    city: valenciaMatch?.[0] || "",
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function normalizeGoogleResult(result: GeocodeResult) {
  const components = result.address_components || [];
  const get = (type: string, short = false) => {
    const comp = components.find((c) => c.types.includes(type));
    return short ? comp?.short_name || "" : comp?.long_name || "";
  };

  const route = get("route");
  const { via, direccion } = splitSpanishRoute(route);
  const numeroCalle = get("street_number");
  const codigoPostal = get("postal_code");
  const poblacion = get("locality") || get("postal_town") || get("administrative_area_level_3");
  const provincia = get("administrative_area_level_2") || get("administrative_area_level_1");
  const pais = get("country");
  const location = result.geometry?.location || {};

  return {
    via,
    direccion,
    numeroCalle,
    bloque: "",
    escalera: "",
    planta: "",
    puerta: "",
    codigoPostal,
    poblacion,
    provincia,
    pais,
    direccionCompleta: buildNormalizedAddress({ via, direccion, numeroCalle, codigoPostal, poblacion, provincia, pais }),
    googleFormattedAddress: result.formatted_address || "",
    placeId: result.place_id || "",
    latitud: location.lat !== undefined ? String(location.lat) : "",
    longitud: location.lng !== undefined ? String(location.lng) : "",
  };
}

function splitSpanishRoute(route: string) {
  const clean = route.trim();
  const lower = clean.toLowerCase();
  const prefixes = [
    ["carrer dels", "Carrer", "dels"],
    ["carrer del", "Carrer", "del"],
    ["carrer de", "Carrer", "de"],
    ["carrer d'", "Carrer", "d'"],
    ["carrer", "Carrer", ""],
    ["calle del", "Calle", "del"],
    ["calle de", "Calle", "de"],
    ["calle", "Calle", ""],
    ["avinguda del", "Avinguda", "del"],
    ["avinguda de", "Avinguda", "de"],
    ["avinguda", "Avinguda", ""],
    ["avenida del", "Avenida", "del"],
    ["avenida de", "Avenida", "de"],
    ["avenida", "Avenida", ""],
    ["av.", "Av.", ""],
    ["passeig del", "Passeig", "del"],
    ["passeig de", "Passeig", "de"],
    ["passeig", "Passeig", ""],
    ["paseo del", "Paseo", "del"],
    ["paseo de", "Paseo", "de"],
    ["paseo", "Paseo", ""],
    ["plaza de", "Plaza", "de"],
    ["plaza", "Plaza", ""],
    ["plaça de", "Plaça", "de"],
    ["plaça", "Plaça", ""],
    ["camino de", "Camino", "de"],
    ["camino", "Camino", ""],
    ["camí de", "Camí", "de"],
    ["camí", "Camí", ""],
    ["carretera de", "Carretera", "de"],
    ["carretera", "Carretera", ""],
    ["ronda de", "Ronda", "de"],
    ["ronda", "Ronda", ""],
    ["travesía de", "Travesía", "de"],
    ["travesía", "Travesía", ""],
    ["travessera de", "Travessera", "de"],
    ["travessera", "Travessera", ""],
  ];

  for (const [prefix, label, article] of prefixes) {
    if (lower === prefix) return { via: label, direccion: "" };
    if (lower.startsWith(`${prefix} `)) {
      const rest = clean.slice(prefix.length).trim();
      const direccion = article ? `${article} ${rest}`.trim() : rest;
      return { via: label, direccion };
    }
  }

  return { via: "", direccion: clean };
}

function buildNormalizedAddress(parts: {
  via: string;
  direccion: string;
  numeroCalle: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;
  pais: string;
}) {
  return [
    [parts.via, parts.direccion, parts.numeroCalle].filter(Boolean).join(" "),
    [parts.codigoPostal, parts.poblacion].filter(Boolean).join(" "),
    parts.provincia,
    parts.pais,
  ].filter(Boolean).join(" · ");
}

const CATASTRO_DNPLOC_BASE =
  "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPLOC";
const CATASTRO_DNPRC_BASE =
  "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPRC";
const CATASTRO_RCCOOR_BASE =
  "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCoordenadas.svc/json/Consulta_RCCOOR";

function catastroPlugin(): Plugin {
  return {
    name: "local-catastro-api",
    configureServer(server) {
      server.middlewares.use("/api/catastro/dnploc", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const params = new URLSearchParams();
          for (const key of ["Provincia", "Municipio", "Sigla", "Calle", "Numero", "Bloque", "Escalera", "Planta", "Puerta"]) {
            const value = url.searchParams.get(key)?.trim();
            if (value) params.set(key, value);
          }

          if (!params.get("Provincia") || !params.get("Municipio") || !params.get("Sigla") || !params.get("Calle") || !params.get("Numero")) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Faltan parámetros obligatorios del catastro" }));
            return;
          }

          const catastroRes = await fetch(`${CATASTRO_DNPLOC_BASE}?${params.toString()}`);
          const data = await catastroRes.json().catch(() => null);

          if (!catastroRes.ok || !data) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No se pudo consultar el servicio del catastro" }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error consultando catastro" }));
        }
      });

      server.middlewares.use("/api/catastro/dnprc", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const refCat = url.searchParams.get("RefCat")?.trim().toUpperCase().replace(/[\s.-]/g, "");

          if (!refCat || !esReferenciaCatastralValida(refCat)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Referencia catastral no válida" }));
            return;
          }

          const catastroRes = await fetch(`${CATASTRO_DNPRC_BASE}?RefCat=${encodeURIComponent(refCat)}`);
          const data = await catastroRes.json().catch(() => null);

          if (!catastroRes.ok || !data) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No se pudo consultar el servicio del catastro" }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error consultando catastro" }));
        }
      });

      server.middlewares.use("/api/catastro/rccoor", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const lat = url.searchParams.get("lat")?.trim();
          const lng = url.searchParams.get("lng")?.trim();

          if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Faltan coordenadas para localizar la parcela" }));
            return;
          }

          const catastroRes = await fetch(
            `${CATASTRO_RCCOOR_BASE}?SRS=EPSG:4326&CoorX=${encodeURIComponent(lng)}&CoorY=${encodeURIComponent(lat)}`
          );
          const data = await catastroRes.json().catch(() => null);

          if (!catastroRes.ok || !data) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No se pudo localizar la parcela en el catastro" }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error consultando catastro" }));
        }
      });

      server.middlewares.use("/api/catastro/consulta-pdf", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const ref = url.searchParams.get("ref")?.trim().toUpperCase().replace(/[\s.-]/g, "") ?? "";
          const del = url.searchParams.get("del")?.trim() ?? "";
          const mun = url.searchParams.get("mun")?.trim() ?? "";

          if (!esReferenciaCatastralValida(ref) || ref.length !== 20 || !/^\d{1,2}$/.test(del) || !/^\d{1,3}$/.test(mun)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Faltan la referencia o el municipio para el PDF del catastro" }));
            return;
          }

          const pdfUrl =
            "https://www1.sedecatastro.gob.es/CYCBienInmueble/SECImprimirCroquisYDatos.aspx?" +
            new URLSearchParams({ del, mun, refcat: ref }).toString();
          const pdfRes = await fetch(pdfUrl);
          const tipo = pdfRes.headers.get("content-type") || "";

          if (!pdfRes.ok || !tipo.includes("pdf")) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "El catastro no devolvió el PDF de la consulta descriptiva y gráfica" }));
            return;
          }

          const body = Buffer.from(await pdfRes.arrayBuffer());
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${ref}.pdf"`);
          res.end(body);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error descargando el PDF del catastro" }));
        }
      });

      server.middlewares.use("/api/catastro/lista-excel", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const ref = url.searchParams.get("rc")?.trim().toUpperCase().replace(/[\s.-]/g, "") ?? "";

          if (!esReferenciaCatastralValida(ref) || ref.length !== 14) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "La referencia de parcela debe tener 14 caracteres" }));
            return;
          }

          const listaUrl =
            "https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx?" +
            new URLSearchParams({
              RC1: ref.slice(0, 7),
              RC2: ref.slice(7, 14),
              RCCompleta: ` ${ref}`,
              from: "OVCBusqueda",
              pest: "rc",
            }).toString();
          const pagina = await fetch(listaUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
          const html = await pagina.text();
          const campo = (nombre: string) => {
            const match = html.match(new RegExp(`name="${nombre}"[^>]*value="([^"]*)"`));
            return (match?.[1] ?? "")
              .replace(/&amp;/g, "&")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");
          };
          const viewState = campo("__VIEWSTATE");
          if (!pagina.ok || !viewState) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No se pudo abrir el listado de la parcela en el catastro" }));
            return;
          }

          const cookies = (
            typeof pagina.headers.getSetCookie === "function" ? pagina.headers.getSetCookie() : []
          )
            .map((item) => item.split(";")[0])
            .filter(Boolean)
            .join("; ");
          const cuerpo = new URLSearchParams({
            __EVENTTARGET: "ctl00$Contenido$btnExcel",
            __EVENTARGUMENT: "",
            __VIEWSTATE: viewState,
            __VIEWSTATEGENERATOR: campo("__VIEWSTATEGENERATOR"),
            __EVENTVALIDATION: campo("__EVENTVALIDATION"),
          });
          const excelRes = await fetch(listaUrl, {
            method: "POST",
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Content-Type": "application/x-www-form-urlencoded",
              Referer: listaUrl,
              ...(cookies ? { Cookie: cookies } : {}),
            },
            body: cuerpo,
          });
          const tipoExcel = excelRes.headers.get("content-type") || "";
          if (!excelRes.ok || !tipoExcel.includes("spreadsheet")) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "El catastro no devolvió el Excel de referencias de la parcela" }));
            return;
          }

          const body = Buffer.from(await excelRes.arrayBuffer());
          res.statusCode = 200;
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader("Content-Disposition", `attachment; filename="Listado_inmuebles_${ref}.xlsx"`);
          res.end(body);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error descargando el Excel del catastro" }));
        }
      });

      server.middlewares.use("/api/catastro/guardar-en-doc", async (req, res) => {
        try {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Hay que enviar el documento del catastro" }));
            return;
          }

          const numeros = JSON.parse(
            decodeURIComponent(String(req.headers["x-siniestro-numeros"] ?? ""))
          ) as unknown;
          const nombre = decodeURIComponent(String(req.headers["x-nombre-archivo"] ?? ""));
          if (!Array.isArray(numeros) || numeros.some((numero) => typeof numero !== "string")) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Falta el número del siniestro en curso" }));
            return;
          }

          const trozos: Buffer[] = [];
          let total = 0;
          for await (const trozo of req) {
            const buffer = Buffer.isBuffer(trozo) ? trozo : Buffer.from(trozo);
            total += buffer.length;
            if (total > 25_000_000) throw new Error("El documento del catastro es demasiado grande");
            trozos.push(buffer);
          }

          const ruta = guardarDocumentoEnDocSiniestro(numeros, nombre, Buffer.concat(trozos));
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ruta }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "No se pudo guardar en la carpeta DOC" }));
        }
      });

      server.middlewares.use("/api/catastro/vista-satelite", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const refCompleta = url.searchParams.get("rc")?.trim().toUpperCase().replace(/[\s.-]/g, "") ?? "";
          const ref = refCompleta.slice(0, 14);

          if (!esReferenciaCatastralValida(refCompleta)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "La referencia catastral no es válida para la vista satélite" }));
            return;
          }

          const coordenadas = async (srs: string) => {
            const consulta =
              "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC?" +
              new URLSearchParams({ Provincia: "", Municipio: "", SRS: srs, RC: ref }).toString();
            const respuesta = await fetch(consulta, { signal: AbortSignal.timeout(20000) });
            const xml = await respuesta.text();
            const x = xml.match(/<xcen>([^<]+)<\/xcen>/)?.[1];
            const y = xml.match(/<ycen>([^<]+)<\/ycen>/)?.[1];
            if (!respuesta.ok || !x || !y) {
              const error = xml.match(/<des>([^<]+)<\/des>/)?.[1];
              throw new Error(error || "El catastro no devolvió coordenadas de la parcela");
            }
            return { x: Number(x), y: Number(y) };
          };

          const geograficas = await coordenadas("EPSG:4326");
          const huso = Math.floor((geograficas.x + 180) / 6) + 1;
          const srs = `EPSG:${25800 + huso}`;
          const centro = await coordenadas(srs);
          const ancho = 960;
          const alto = 720;
          const metrosAncho = 160;
          const metrosAlto = (metrosAncho * alto) / ancho;
          const bbox = [
            centro.x - metrosAncho / 2,
            centro.y - metrosAlto / 2,
            centro.x + metrosAncho / 2,
            centro.y + metrosAlto / 2,
          ].join(",");
          const pnoaUrl =
            "https://www.ign.es/wms-inspire/pnoa-ma?" +
            new URLSearchParams({
              SERVICE: "WMS",
              VERSION: "1.1.1",
              REQUEST: "GetMap",
              LAYERS: "OI.OrthoimageCoverage",
              STYLES: "",
              SRS: srs,
              BBOX: bbox,
              WIDTH: String(ancho),
              HEIGHT: String(alto),
              FORMAT: "image/jpeg",
            }).toString();
          const catastroUrl =
            "https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?" +
            new URLSearchParams({
              SERVICE: "WMS",
              VERSION: "1.1.1",
              REQUEST: "GetMap",
              LAYERS: "Catastro",
              STYLES: "",
              TRANSPARENT: "TRUE",
              SRS: srs,
              BBOX: bbox,
              WIDTH: String(ancho),
              HEIGHT: String(alto),
              FORMAT: "image/png",
            }).toString();
          const [fondoRes, catastroRes] = await Promise.all([
            fetch(pnoaUrl, { signal: AbortSignal.timeout(30000) }),
            fetch(catastroUrl, { signal: AbortSignal.timeout(30000) }),
          ]);
          const fondoTipo = fondoRes.headers.get("content-type") || "";
          const catastroTipo = catastroRes.headers.get("content-type") || "";
          if (!fondoRes.ok || !fondoTipo.includes("jpeg") || !catastroRes.ok || !catastroTipo.includes("png")) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No se pudo obtener la ortofoto o el parcelario del catastro" }));
            return;
          }

          const chincheta = Buffer.from(
            `<svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="32" cy="74" rx="9" ry="3.5" fill="rgba(0,0,0,0.4)"/>
              <path d="M32 70 C18 52 8 40 8 26 C8 12 19 4 32 4 C45 4 56 12 56 26 C56 40 46 52 32 70 Z" fill="#dc2626" stroke="#ffffff" stroke-width="3"/>
              <circle cx="32" cy="26" r="8" fill="#ffffff"/>
            </svg>`
          );
          const { default: sharp } = await import("sharp");
          const jpeg = await sharp(Buffer.from(await fondoRes.arrayBuffer()))
            .composite([
              { input: Buffer.from(await catastroRes.arrayBuffer()), top: 0, left: 0 },
              { input: chincheta, top: Math.round(alto / 2 - 70), left: Math.round(ancho / 2 - 32) },
            ])
            .jpeg({ quality: 82 })
            .toBuffer();
          const body = jpegAPdf(jpeg, ancho, alto);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="Cartografia_${refCompleta}.pdf"`);
          res.end(body);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error generando la vista satélite" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const fileMakerProxyTarget = env.VITE_DEV_FM_PROXY_TARGET || "https://localhost";
  // HTTPS por defecto: evita el bloqueo "no seguro" de Chrome al forzar https.
  const usarHttps = (env.VITE_DEV_HTTPS ?? "true") !== "false";
  const certificadoDev = usarHttps ? leerCertificadoDev() : null;

  return {
    server: {
      // 0.0.0.0 permite acceso por IP de red (p. ej. 192.168.1.14:5174).
      host: env.VITE_DEV_SERVER_HOST || "0.0.0.0",
      port: Number(env.VITE_DEV_PORT || 5174),
      strictPort: false,
      // Certificado propio con las IPs en el SAN; si no, lo aporta basicSsl().
      https: certificadoDev ?? undefined,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/fmi": {
          target: fileMakerProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      usarHttps && !certificadoDev && basicSsl(),
      geocodePlugin(env.GOOGLE_MAPS_API_KEY),
      cartociudadPlugin(),
      catastroPlugin(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
