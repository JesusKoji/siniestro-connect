export function normalizarDireccionParaMapa(address: string) {
  return address
    .replace(/·/g, ",")
    .replace(/\b(Bloque|Blq\.|Esc\.|Escalera|Planta|Plt\.|Puerta|Pta\.)\s*[^,·]*/gi, "")
    .replace(/\s+/g, " ")
    .replace(/,+/g, ",")
    .replace(/,\s*,/g, ",")
    .trim();
}

export function buildGoogleMapsEmbedUrl(searchAddress: string) {
  const query = searchAddress.trim();
  if (!query) return "";
  return `https://maps.google.com/maps?hl=es&q=${encodeURIComponent(query)}&z=18&ie=UTF8&iwloc=B&output=embed`;
}

export function buildGoogleMapsOpenUrl(searchAddress: string) {
  const query = searchAddress.trim();
  if (!query) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
