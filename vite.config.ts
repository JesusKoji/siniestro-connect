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

          const googleUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
          googleUrl.searchParams.set("address", q);
          googleUrl.searchParams.set("region", "es");
          googleUrl.searchParams.set("language", "es");
          googleUrl.searchParams.set("key", apiKey);

          const googleRes = await fetch(googleUrl);
          const googleData = await googleRes.json();

          if (!googleRes.ok || googleData.status !== "OK" || !googleData.results?.[0]) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: googleData.error_message || `Google Maps no devolvió resultados: ${googleData.status || "sin estado"}` }));
            return;
          }

          const normalized = normalizeGoogleResult(googleData.results[0]);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(normalized));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error normalizando dirección" }));
        }
      });
    },
  };
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
    codigoPostal,
    poblacion,
    provincia,
    pais,
    direccionCompleta: result.formatted_address || "",
    latitud: location.lat !== undefined ? String(location.lat) : "",
    longitud: location.lng !== undefined ? String(location.lng) : "",
  };
}

function splitSpanishRoute(route: string) {
  const clean = route.trim();
  const lower = clean.toLowerCase();
  const prefixes = [
    ["calle", "Calle"],
    ["avinguda", "Avinguda"],
    ["avenida", "Avenida"],
    ["av.", "Av."],
    ["plaza", "Plaza"],
    ["plaça", "Plaça"],
    ["camino", "Camino"],
    ["camí", "Camí"],
    ["carretera", "Carretera"],
    ["paseo", "Paseo"],
    ["passeig", "Passeig"],
    ["ronda", "Ronda"],
    ["travesía", "Travesía"],
    ["travessera", "Travessera"],
  ];

  for (const [prefix, label] of prefixes) {
    if (lower === prefix) return { via: label, direccion: "" };
    if (lower.startsWith(`${prefix} `)) return { via: label, direccion: clean.slice(prefix.length).trim() };
  }

  return { via: "", direccion: clean };
}

// https://vitejs.dev/config/
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
