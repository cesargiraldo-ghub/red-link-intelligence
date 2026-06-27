const portalRules = [
  { label: "Metrocuadrado", domains: ["metrocuadrado.com"] },
  { label: "FincaRaiz", domains: ["fincaraiz.com.co", "fincaraiz.com"] },
  { label: "Properstar", domains: ["properstar.co", "properstar.com"] },
  { label: "Mercado Libre Inmuebles", domains: ["mercadolibre.com"] },
  { label: "Ciencuadras", domains: ["ciencuadras.com"] },
  { label: "Clasificados El Pais", domains: ["fincaraiz.elpais.com.co", "elpais.com.co"] },
  { label: "Espacio Urbano", domains: ["espaciourbano.com"] },
  { label: "Portal propio RED", domains: ["redinmobiliaria.co", "redhub.co"] },
];

const businessTerms = {
  arriendo: "Arriendo",
  alquiler: "Arriendo",
  alquila: "Arriendo",
  arrienda: "Arriendo",
  arrendar: "Arriendo",
  renta: "Arriendo",
  venta: "Venta",
  comprar: "Venta",
  compra: "Venta",
};

const propertyTerms = {
  apartamento: "Apartamento",
  apto: "Apartamento",
  casa: "Casa",
  apartaestudio: "Apartaestudio",
  apartaestudios: "Apartaestudio",
  oficina: "Oficina",
  local: "Local comercial",
  bodega: "Bodega",
  lote: "Lote",
  finca: "Finca",
  consultorio: "Consultorio",
};

const cityCorrections = {
  bogota: "Bogota",
  medellin: "Medellin",
  jamundi: "Jamundi",
  cali: "Cali",
  barranquilla: "Barranquilla",
  cartagena: "Cartagena",
  pereira: "Pereira",
  armenia: "Armenia",
  manizales: "Manizales",
  bucaramanga: "Bucaramanga",
  anapoima: "Anapoima",
};

const neighborhoodCorrections = {
  canaverales: "Canaverales",
  caney: "Caney",
  "ciudad real": "Ciudad Real",
  "el caney": "El Caney",
  "primitivo crespo": "Primitivo Crespo",
};

const knownLocations = [
  { tokens: ["primitivo", "crespo"], ciudad: "Cali", barrio: "Primitivo Crespo" },
  { tokens: ["caney"], ciudad: "Cali", barrio: "Caney" },
  { tokens: ["canaverales"], ciudad: "Cali", barrio: "Canaverales" },
  { tokens: ["ciudad", "real"], ciudad: "Cali", barrio: "Ciudad Real" },
  { tokens: ["el", "caney"], ciudad: "Cali", barrio: "El Caney" },
  { tokens: ["valle", "del", "lili"], ciudad: "Cali", barrio: "Valle del Lili" },
  { tokens: ["ciudad", "jardin"], ciudad: "Cali", barrio: "Ciudad Jardin" },
  { tokens: ["pance"], ciudad: "Cali", barrio: "Pance" },
  { tokens: ["bochalema"], ciudad: "Cali", barrio: "Bochalema" },
  { tokens: ["alfaguara"], ciudad: "Jamundi", barrio: "Alfaguara" },
];

const stopwords = new Set([
  "se",
  "inmueble",
  "propiedad",
  "proyecto",
  "arriendo",
  "alquiler",
  "renta",
  "venta",
  "comprar",
  "compra",
  "amoblado",
  "amoblada",
  "apartamento",
  "apartaestudio",
  "apartaestudios",
  "apto",
  "casa",
  "oficina",
  "local",
  "comercial",
  "bodega",
  "lote",
  "finca",
  "habitaciones",
  "habitacion",
  "hab",
  "banos",
  "bano",
  "banos",
  "bano",
  "garajes",
  "garaje",
  "parqueaderos",
  "parqueadero",
  "codigo",
  "conjunto",
  "residencial",
  "asd",
  "na",
]);

function safeDecode(value = "") {
  let decoded = String(value);
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded.replace(/\+/g, " "));
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function normalizeToken(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function titleCase(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractUrls(rawMessage) {
  const decodedMessage = safeDecode(rawMessage);
  const candidates = new Set();

  [rawMessage, decodedMessage].forEach((text) => {
    const matches = String(text).match(/(?:https?:\/\/|www\.)[^\s"'<>)[\]]+/gi) || [];
    matches.forEach((match) => {
      const cleanUrl = match.replace(/[),.;]+$/g, "");
      candidates.add(cleanUrl.startsWith("www.") ? `https://${cleanUrl}` : cleanUrl);
    });
  });

  return [...candidates].map((url) => safeDecode(url));
}

function getInnerWhatsappText(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("whatsapp.com")) return "";
    return safeDecode(parsed.searchParams.get("text") || "");
  } catch {
    return "";
  }
}

function choosePropertyUrl(urls) {
  const expanded = [...urls];
  urls.forEach((url) => {
    const innerText = getInnerWhatsappText(url);
    if (innerText) extractUrls(innerText).forEach((innerUrl) => expanded.push(innerUrl));
  });

  return expanded.find((url) => !url.includes("whatsapp.com")) || expanded[0] || "";
}

function detectPortal(hostname) {
  const cleanHost = hostname.replace(/^www\./, "");
  return (
    portalRules.find((portal) => portal.domains.some((domain) => cleanHost.includes(domain))) || {
      label: "URL personalizada",
    }
  );
}

function slugTokens(pathname) {
  return pathname
    .split("/")
    .filter(Boolean)
    .join("-")
    .split(/[-_]+/)
    .filter((part) => !/\.(asp|aspx|php|html?)$/i.test(part))
    .map((part) => normalizeToken(part.replace(/\./g, "")))
    .filter(Boolean);
}

function findTerm(tokens, dictionary) {
  const tokenSet = new Set(tokens);
  return Object.entries(dictionary).find(([term]) => tokenSet.has(term))?.[1] || null;
}

function findNumberBefore(tokens, words) {
  for (let index = 0; index < tokens.length; index += 1) {
    if (words.includes(tokens[index])) {
      const previous = Number(tokens[index - 1]);
      if (Number.isFinite(previous)) return previous;
    }
  }
  return null;
}

function findCode(url, tokens) {
  try {
    const parsed = new URL(url);
    const parameterCode = ["xId", "id", "codigo", "code"].map((key) => parsed.searchParams.get(key)).find(Boolean);
    if (parameterCode) return parameterCode.toUpperCase();
  } catch {
  }

  const codePatterns = [
    /(?:id\s*web|id)\s*:?\s*([A-Z0-9-]{4,})/i,
    /(\d{2,}-[A-Z]\d{5,})/i,
    /(VP\d+)/i,
    /(MCO-\d+)/i,
    /([A-Z]\d{5,})/i,
    /(?:codigo|code|cod)[-/=:_]?([A-Z0-9-]{4,})/i,
    /(?:^|[-/])([A-Z]?\d{4,}-?[A-Z]?\d*)$/i,
  ];

  for (const pattern of codePatterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1].toUpperCase();
  }

  const token = [...tokens].reverse().find((item) => /[a-z]*\d{5,}/i.test(item));
  return token ? token.toUpperCase() : null;
}

function findExternalCode(rawMessage, mainCode) {
  const decodedMessage = safeDecode(rawMessage);
  const codePatterns = [
    /inmueble\s*:?\s*([0-9]{3,}-[0-9]{3,})/i,
    /(?:codigo|cod|id)\s*:?\s*([0-9]{3,}-[0-9]{3,})/i,
  ];

  for (const pattern of codePatterns) {
    const match = decodedMessage.match(pattern);
    if (match?.[1] && match[1].toUpperCase() !== String(mainCode || "").toUpperCase()) return match[1].toUpperCase();
  }

  return null;
}

function findKnownLocation(tokens) {
  return knownLocations.find((location) =>
    location.tokens.every((token, index) => tokens.indexOf(location.tokens[0]) + index >= 0 && tokens[tokens.indexOf(location.tokens[0]) + index] === token)
  );
}

function splitCityAndNeighborhood(locationTokens) {
  const cleanTokens = locationTokens.filter((token) => !["en", "de", "del", "la", "el", "las", "los"].includes(token));
  const lastToken = cleanTokens[cleanTokens.length - 1];

  if (cityCorrections[lastToken]) {
    const neighborhoodKey = cleanTokens.slice(0, -1).join(" ");
    return {
      ciudad: cityCorrections[lastToken],
      barrio: neighborhoodCorrections[neighborhoodKey] || titleCase(neighborhoodKey),
    };
  }

  return {
    ciudad: null,
    barrio: titleCase(cleanTokens.join(" ")),
  };
}

function inferLocationFromMessage(rawMessage) {
  const decodedMessage = safeDecode(rawMessage);
  const urlFreeMessage = decodedMessage.replace(/(?:https?:\/\/|www\.)[^\s"'<>)[\]]+/gi, " ");
  const classifiedMatch = urlFreeMessage.match(/aviso\s+(.+?),\s*(alquiler|arriendo|venta|renta),\s*([A-Za-z\s]+?)\s+con\s+id\s+web/i);

  if (classifiedMatch) {
    const neighborhoodKey = normalizeToken(classifiedMatch[3].trim());
    return {
      ciudad: "Cali",
      barrio: neighborhoodCorrections[neighborhoodKey] || titleCase(classifiedMatch[3].trim()),
    };
  }

  const locationMatch = urlFreeMessage.match(/,\s*([A-Za-z\s]+?)\s*,\s*(Bogota|Medellin|Jamundi|Cali|Barranquilla|Cartagena|Pereira|Armenia|Manizales|Bucaramanga)\b/i);
  if (!locationMatch) return null;

  const neighborhoodKey = normalizeToken(locationMatch[1].trim());
  const cityKey = normalizeToken(locationMatch[2].trim());
  return {
    ciudad: cityCorrections[cityKey] || titleCase(locationMatch[2].trim()),
    barrio: neighborhoodCorrections[neighborhoodKey] || titleCase(locationMatch[1].trim()),
  };
}

function inferLocation(tokens) {
  const knownLocation = findKnownLocation(tokens);
  if (knownLocation) return { ciudad: knownLocation.ciudad, barrio: knownLocation.barrio };

  const enIndex = tokens.lastIndexOf("en");
  if (enIndex >= 0) {
    const locationTokens = [];
    for (const token of tokens.slice(enIndex + 1)) {
      if (["conjunto", "residencial", "edificio", "sector", "barrio"].includes(token) || /^\d+$/.test(token) || /[a-z]*\d{4,}/i.test(token)) break;
      if (!["de", "del", "la", "el", "las", "los"].includes(token) && stopwords.has(token)) continue;
      locationTokens.push(token);
      if (locationTokens.length === 4) break;
    }

    if (locationTokens.length) return splitCityAndNeighborhood(locationTokens);
  }

  const propertyIndex = tokens.findIndex((token) => propertyTerms[token]);
  const usefulTokens = tokens
    .slice(propertyIndex >= 0 ? propertyIndex + 1 : 0)
    .filter((token) => propertyIndex >= 0 && !stopwords.has(token) && !/^\d+$/.test(token) && !/[a-z]*\d{4,}/i.test(token));

  const cityCandidates = [];
  for (const token of usefulTokens) {
    if (["a", "s", "d", "en", "de", "del", "la", "el"].includes(token)) break;
    cityCandidates.push(token);
    if (cityCandidates.length === 2) break;
  }

  const cityKey = cityCandidates.join(" ");
  return {
    ciudad: cityCandidates.length ? cityCorrections[cityKey] || titleCase(cityKey) : null,
    barrio: null,
  };
}

function buildReply(result) {
  if (result.error) return result.error;

  const portal = result.portal ? ` por el portal ${result.portal}` : "";
  const code = result.codigo_portal ? `, por el codigo del anuncio ${result.codigo_portal}` : "";
  const property = result.tipo_inmueble ? result.tipo_inmueble.toLowerCase() : "inmueble";
  const article = ["casa", "oficina", "bodega", "finca"].includes(property) ? "una" : "un";
  const business = result.negocio ? ` en ${result.negocio.toLowerCase()}` : "";
  const city = result.ciudad ? `, en la ciudad de ${result.ciudad}` : "";
  const neighborhood = result.barrio_zona ? `, en el barrio/zona ${result.barrio_zona}` : "";
  const rooms = result.habitaciones ? `, con ${result.habitaciones} habitaciones` : "";
  const baths = result.banos ? ` y ${result.banos} banos` : "";

  return `Gracias por contactarnos${portal}${code}. Vemos que estas interesado en ${article} ${property}${business}${city}${neighborhood}${rooms}${baths}. Deseas mas informacion de esta propiedad o prefieres agendar una cita para verla?`;
}

function scoreResult(result) {
  const fields = ["url", "portal", "negocio", "tipo_inmueble", "ciudad", "habitaciones", "banos", "garajes", "codigo_portal"];
  const hits = fields.filter((field) => result[field] !== null && result[field] !== "" && result[field] !== undefined).length;
  return Math.round((hits / fields.length) * 100);
}

function analyzeMessage(rawMessage) {
  const urls = extractUrls(rawMessage);
  const propertyUrl = choosePropertyUrl(urls);

  if (!propertyUrl) {
    return {
      intencion: "sin_link",
      portal: null,
      url: null,
      error: "No se encontro una URL en el mensaje.",
    };
  }

  let parsed;
  try {
    parsed = new URL(propertyUrl);
  } catch {
    return {
      intencion: "link_invalido",
      portal: null,
      url: propertyUrl,
      error: "La URL detectada no tiene un formato valido.",
    };
  }

  const tokens = slugTokens(parsed.pathname);
  const portal = detectPortal(parsed.hostname);
  const location = inferLocationFromMessage(rawMessage) || inferLocation(tokens);
  const code = findCode(propertyUrl, tokens);
  const result = {
    intencion: "buscar_inmueble",
    portal: portal.label,
    dominio: parsed.hostname.replace(/^www\./, ""),
    url: propertyUrl,
    negocio: findTerm(tokens, businessTerms),
    tipo_inmueble: findTerm(tokens, propertyTerms),
    ciudad: location.ciudad,
    barrio_zona: location.barrio,
    habitaciones: findNumberBefore(tokens, ["habitaciones", "habitacion", "hab"]),
    banos: findNumberBefore(tokens, ["banos", "bano"]),
    garajes: findNumberBefore(tokens, ["garajes", "garaje", "parqueaderos", "parqueadero"]),
    codigo_portal: code,
    codigo_adicional: findExternalCode(rawMessage, code),
    fuente: {
      mensaje_decodificado: safeDecode(rawMessage),
      urls_detectadas: urls,
      tokens_slug: tokens,
    },
  };

  result.confianza = scoreResult(result);
  result.respuesta_whatsapp = buildReply(result);
  return result;
}

module.exports = {
  analyzeMessage,
};
