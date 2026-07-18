import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import basicSsl from "@vitejs/plugin-basic-ssl";

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
