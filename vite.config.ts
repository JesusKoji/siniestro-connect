import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GeocodeResult = {
  formatted_address?: string;
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

          if (!geocodeResult.result) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: geocodeResult.error || "Google Maps no devolvió resultados" }));
            return;
          }

          const normalized = normalizeGoogleResult(geocodeResult.result);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ...normalized, consultaUsada: geocodeResult.query }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error normalizando dirección" }));
        }
      });
    },
  };
}

async function geocodeWithRetries(q: string, apiKey: string): Promise<{ result?: GeocodeResult; query?: string; error?: string }> {
  const variants = buildQueryVariants(q);
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

    if (googleRes.ok && googleData.status === "OK" && googleData.results?.[0]) {
      return { result: googleData.results[0], query };
    }

    lastError = googleData.error_message || `Google Maps no devolvió resultados: ${googleData.status || "sin estado"}`;
  }

  return { error: lastError };
}

function buildQueryVariants(q: string) {
  const clean = q.trim().replace(/\s+/g, " ");
  const lower = clean.toLowerCase();
  const hasKnownType = /^(carrer|calle|avenida|avinguda|av\.?|passeig|paseo|plaza|plaça|camino|camí|carretera|ronda|travesía|travessera)\b/.test(lower);
  const hasValencia = /\b(valencia|valència)\b/.test(lower);
  const suffix = hasValencia ? "" : ", Valencia";

  if (hasKnownType) {
    return unique([clean, `${clean}${suffix}`, `${clean}, España`]);
  }

  return unique([
    clean,
    `${clean}${suffix}`,
    `Avenida del Poeta ${clean}${suffix}`,
    `Avinguda del Poeta ${clean}${suffix}`,
    `Avenida ${clean}${suffix}`,
    `Avinguda ${clean}${suffix}`,
    `Calle ${clean}${suffix}`,
    `Carrer ${clean}${suffix}`,
    `${clean}, España`,
  ]);
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const fileMakerProxyTarget = env.VITE_DEV_FM_PROXY_TARGET || "https://localhost";

  return {
    server: {
      host: "::",
      port: 8080,
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
    plugins: [react(), geocodePlugin(env.GOOGLE_MAPS_API_KEY), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
