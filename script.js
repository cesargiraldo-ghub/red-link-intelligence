const sampleMessage =
  "https://api.whatsapp.com/send?phone=573145590000&text=Hola%2C%20me%20interesa%20este%20anuncio%3A%20https%3A%2F%2Fwww.metrocuadrado.com%2Finmueble%2Farriendo-apartamento-jamundi-a.s.d.-2-habitaciones-2-banos-1-garajes%2F20033-M6772778";

const portalRules = [
  { key: "metrocuadrado", label: "Metrocuadrado", domains: ["metrocuadrado.com"] },
  { key: "fincaraiz", label: "FincaRaíz", domains: ["fincaraiz.com.co", "fincaraiz.com"] },
  { key: "properstar", label: "Properstar", domains: ["properstar.co", "properstar.com"] },
  { key: "mercadolibre", label: "Mercado Libre Inmuebles", domains: ["inmuebles.mercadolibre.com", "mercadolibre.com"] },
  { key: "ciencuadras", label: "Ciencuadras", domains: ["ciencuadras.com"] },
  { key: "elpais", label: "Clasificados El País", domains: ["fincaraiz.elpais.com.co", "elpais.com.co"] },
  { key: "espaciourbano", label: "Espacio Urbano", domains: ["espaciourbano.com"] },
  { key: "red", label: "Portal propio RED", domains: ["redinmobiliaria.co", "redhub.co"] },
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
  bogota: "Bogotá",
  medellin: "Medellín",
  jamundi: "Jamundí",
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
  canaverales: "Cañaverales",
  caney: "Caney",
  "ciudad real": "Ciudad Real",
  "el caney": "El Caney",
  "primitivo crespo": "Primitivo Crespo",
};

const knownLocations = [
  { tokens: ["primitivo", "crespo"], ciudad: "Cali", barrio: "Primitivo Crespo" },
  { tokens: ["caney"], ciudad: "Cali", barrio: "Caney" },
  { tokens: ["canaverales"], ciudad: "Cali", barrio: "Cañaverales" },
  { tokens: ["ciudad", "real"], ciudad: "Cali", barrio: "Ciudad Real" },
  { tokens: ["el", "caney"], ciudad: "Cali", barrio: "El Caney" },
  { tokens: ["valle", "del", "lili"], ciudad: "Cali", barrio: "Valle del Lili" },
  { tokens: ["ciudad", "jardin"], ciudad: "Cali", barrio: "Ciudad Jardín" },
  { tokens: ["pance"], ciudad: "Cali", barrio: "Pance" },
  { tokens: ["bochalema"], ciudad: "Cali", barrio: "Bochalema" },
  { tokens: ["alfaguara"], ciudad: "Jamundí", barrio: "Alfaguara" },
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
  "baños",
  "baño",
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

const elements = {
  input: document.querySelector("#messageInput"),
  analyzeBtn: document.querySelector("#analyzeBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  sampleBtn: document.querySelector("#sampleBtn"),
  copyJsonBtn: document.querySelector("#copyJsonBtn"),
  jsonOutput: document.querySelector("#jsonOutput"),
  replyOutput: document.querySelector("#replyOutput"),
  confidenceBadge: document.querySelector("#confidenceBadge"),
  portalLabel: document.querySelector("#portalLabel"),
  intentLabel: document.querySelector("#intentLabel"),
  businessValue: document.querySelector("#businessValue"),
  propertyTypeValue: document.querySelector("#propertyTypeValue"),
  cityValue: document.querySelector("#cityValue"),
  neighborhoodValue: document.querySelector("#neighborhoodValue"),
  roomsValue: document.querySelector("#roomsValue"),
  bathsValue: document.querySelector("#bathsValue"),
  parkingValue: document.querySelector("#parkingValue"),
  codeValue: document.querySelector("#codeValue"),
  altCodeValue: document.querySelector("#altCodeValue"),
  domainValue: document.querySelector("#domainValue"),
  toast: document.querySelector("#toast"),
  companyForm: document.querySelector("#companyForm"),
  companyNameInput: document.querySelector("#companyNameInput"),
  crmEmailInput: document.querySelector("#crmEmailInput"),
  crmApiKeyInput: document.querySelector("#crmApiKeyInput"),
  crmApiSecretInput: document.querySelector("#crmApiSecretInput"),
  webhookBaseInput: document.querySelector("#webhookBaseInput"),
  webhookOutput: document.querySelector("#webhookOutput"),
  companyList: document.querySelector("#companyList"),
};

let currentResult = {};
let companies = loadCompanies();

function safeDecode(value) {
  let decoded = value;
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

function normalizeToken(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractUrls(rawMessage) {
  const decodedMessage = safeDecode(rawMessage);
  const candidates = new Set();

  [rawMessage, decodedMessage].forEach((text) => {
    const matches = text.match(/(?:https?:\/\/|www\.)[^\s"'<>)[\]]+/gi) || [];
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
      key: "custom",
      label: "URL personalizada",
      domains: [cleanHost],
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
    // Continue with regex extraction when the URL constructor cannot parse the value.
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
    /(?:codigo|c[oó]digo|id)\s*:?\s*([0-9]{3,}-[0-9]{3,})/i,
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
  const classifiedMatch = urlFreeMessage.match(/aviso\s+(.+?),\s*(alquiler|arriendo|venta|renta),\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+?)\s+con\s+id\s+web/i);

  if (classifiedMatch) {
    const neighborhoodKey = normalizeToken(classifiedMatch[3].trim());
    return {
      ciudad: "Cali",
      barrio: neighborhoodCorrections[neighborhoodKey] || titleCase(classifiedMatch[3].trim()),
    };
  }

  const locationMatch = urlFreeMessage.match(/,\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+?)\s*,\s*(Bogot[aá]|Medell[ií]n|Jamund[ií]|Cali|Barranquilla|Cartagena|Pereira|Armenia|Manizales|Bucaramanga)\b/i);

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
  if (knownLocation) {
    return {
      ciudad: knownLocation.ciudad,
      barrio: knownLocation.barrio,
    };
  }

  const enIndex = tokens.lastIndexOf("en");
  if (enIndex >= 0) {
    const locationTokens = [];
    for (const token of tokens.slice(enIndex + 1)) {
      if (["conjunto", "residencial", "edificio", "sector", "barrio"].includes(token) || /^\d+$/.test(token) || /[a-z]*\d{4,}/i.test(token)) break;
      if (!["de", "del", "la", "el", "las", "los"].includes(token) && stopwords.has(token)) continue;
      locationTokens.push(token);
      if (locationTokens.length === 4) break;
    }

    if (locationTokens.length) {
      return splitCityAndNeighborhood(locationTokens);
    }
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

function titleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
    banos: findNumberBefore(tokens, ["banos", "bano", "baños", "baño"]),
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

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function buildReply(result) {
  if (result.error) return result.error;

  const portal = result.portal ? ` por el portal ${result.portal}` : "";
  const code = result.codigo_portal ? `, por el código del anuncio ${result.codigo_portal}` : "";
  const property = result.tipo_inmueble ? result.tipo_inmueble.toLowerCase() : "inmueble";
  const article = ["casa", "oficina", "bodega", "finca"].includes(property) ? "una" : "un";
  const business = result.negocio ? ` en ${result.negocio.toLowerCase()}` : "";
  const city = result.ciudad ? `, en la ciudad de ${result.ciudad}` : "";
  const neighborhood = result.barrio_zona ? `, en el barrio/zona ${result.barrio_zona}` : "";
  const rooms = result.habitaciones ? `, con ${result.habitaciones} habitaciones` : "";
  const baths = result.banos ? ` y ${result.banos} baños` : "";

  return `Gracias por contactarnos${portal}${code}. Vemos que estás interesado en ${article} ${property}${business}${city}${neighborhood}${rooms}${baths}. ¿Deseas más información de esta propiedad o prefieres agendar una cita para verla?`;
}

function render(result) {
  currentResult = result;
  const confidence = result.confianza || 0;
  elements.jsonOutput.textContent = JSON.stringify(result, null, 2);
  elements.replyOutput.textContent = result.respuesta_whatsapp || buildReply(result);
  elements.confidenceBadge.textContent = result.error ? "Revisar mensaje" : `${confidence}% confianza`;
  elements.confidenceBadge.classList.toggle("ready", !result.error);
  elements.portalLabel.textContent = valueOrDash(result.portal);
  elements.intentLabel.textContent = result.error ? "Sin datos" : "Lead inmobiliario";
  elements.businessValue.textContent = valueOrDash(result.negocio);
  elements.propertyTypeValue.textContent = valueOrDash(result.tipo_inmueble);
  elements.cityValue.textContent = valueOrDash(result.ciudad);
  elements.neighborhoodValue.textContent = valueOrDash(result.barrio_zona);
  elements.roomsValue.textContent = valueOrDash(result.habitaciones);
  elements.bathsValue.textContent = valueOrDash(result.banos);
  elements.parkingValue.textContent = valueOrDash(result.garajes);
  elements.codeValue.textContent = valueOrDash(result.codigo_portal);
  elements.altCodeValue.textContent = valueOrDash(result.codigo_adicional);
  elements.domainValue.textContent = valueOrDash(result.dominio);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.setTimeout(() => elements.toast.classList.remove("show"), 1800);
}

function loadCompanies() {
  try {
    return JSON.parse(localStorage.getItem("red_link_companies") || "[]");
  } catch {
    return [];
  }
}

function saveCompanies() {
  localStorage.setItem("red_link_companies", JSON.stringify(companies));
}

function slugify(value) {
  return normalizeToken(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function createTenantToken(companyName, crmEmail) {
  const source = `${companyName}-${crmEmail}-${Date.now()}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }
  return `${slugify(companyName || crmEmail)}-${Math.abs(hash).toString(36)}`;
}

function maskSecret(value) {
  if (!value) return "";
  if (value.length <= 6) return "******";
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

function normalizeWebhookBase(value) {
  return (value || "https://red-link-intelligence.com/webhook").replace(/\/+$/g, "");
}

function buildWebhookConfig(company) {
  const webhookUrl = `${normalizeWebhookBase(company.webhookBase)}/${company.tenantToken}`;
  return {
    empresa: company.name,
    correo_crm_red: company.crmEmail,
    webhook_ghl: webhookUrl,
    metodo: "POST",
    headers_crm_red: {
      "X-Api-Key": maskSecret(company.apiKey),
      "X-Api-Secret": maskSecret(company.apiSecret),
    },
    payload_ghl: {
      message: "{{message.body}}",
      contact_name: "{{contact.name}}",
      contact_phone: "{{contact.phone}}",
      contact_email: "{{contact.email}}",
      ghl_contact_id: "{{contact.id}}",
    },
    respuesta_del_webhook: {
      portal: "FincaRaíz",
      codigo_portal: "193846705",
      tipo_inmueble: "Apartamento",
      negocio: "Arriendo",
      ciudad: "Bogotá",
      barrio_zona: "Veraguas",
      habitaciones: null,
      banos: null,
      garajes: null,
      respuesta_whatsapp:
        "Gracias por contactarnos por el portal FincaRaíz, por el código del anuncio 193846705. Vemos que estás interesado en un apartamento en arriendo, en la ciudad de Bogotá, en el barrio/zona Veraguas. ¿Deseas más información de esta propiedad o prefieres agendar una cita para verla?",
    },
    campos_personalizados_ghl: {
      portal_inmobiliario: "{{webhook.portal}}",
      codigo_portal: "{{webhook.codigo_portal}}",
      tipo_inmueble: "{{webhook.tipo_inmueble}}",
      negocio: "{{webhook.negocio}}",
      ciudad: "{{webhook.ciudad}}",
      barrio_zona: "{{webhook.barrio_zona}}",
      respuesta_link_ia: "{{webhook.respuesta_whatsapp}}",
    },
    flujo: [
      "GoHighLevel envia el mensaje al webhook",
      "RED Link Intelligence extrae el link inmobiliario",
      "El servicio consulta CRM RED con las credenciales de la empresa",
      "El webhook devuelve campos estructurados y una respuesta_whatsapp",
      "GoHighLevel envia respuesta_whatsapp por WhatsApp o el backend la envia usando la API de GHL",
    ],
  };
}

function renderWebhookOutput(company) {
  if (!elements.webhookOutput) return;
  const config = company
    ? buildWebhookConfig(company)
    : {
        estado: "sin_empresa",
        nota: "Crea una empresa para generar su webhook de GoHighLevel.",
      };
  elements.webhookOutput.textContent = JSON.stringify(config, null, 2);
}

function renderCompanies() {
  if (!elements.companyList) return;
  elements.companyList.innerHTML = "";

  companies.forEach((company) => {
    const card = document.createElement("article");
    card.className = "company-card";
    const webhookUrl = buildWebhookConfig(company).webhook_ghl;
    card.innerHTML = `
      <strong>${company.name}</strong>
      <span>${company.crmEmail}</span>
      <code>${webhookUrl}</code>
      <button class="secondary-button" type="button" data-company-id="${company.id}">Ver configuración</button>
    `;
    elements.companyList.appendChild(card);
  });

  elements.companyList.querySelectorAll("button[data-company-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const company = companies.find((item) => item.id === button.dataset.companyId);
      renderWebhookOutput(company);
    });
  });
}

function handleCompanySubmit(event) {
  event.preventDefault();
  const name = elements.companyNameInput.value.trim();
  const crmEmail = elements.crmEmailInput.value.trim();
  const apiKey = elements.crmApiKeyInput.value.trim();
  const apiSecret = elements.crmApiSecretInput.value.trim();
  const webhookBase = normalizeWebhookBase(elements.webhookBaseInput.value.trim());

  if (!name || !crmEmail || !apiKey || !apiSecret) {
    showToast("Completa empresa, correo y credenciales");
    return;
  }

  const company = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    tenantToken: createTenantToken(name, crmEmail),
    name,
    crmEmail,
    apiKey,
    apiSecret,
    webhookBase,
    createdAt: new Date().toISOString(),
  };

  companies = [company, ...companies];
  saveCompanies();
  renderCompanies();
  renderWebhookOutput(company);
  elements.companyForm.reset();
  elements.webhookBaseInput.value = webhookBase;
  showToast("Webhook creado");
}

elements.analyzeBtn.addEventListener("click", () => render(analyzeMessage(elements.input.value)));
elements.sampleBtn.addEventListener("click", () => {
  elements.input.value = sampleMessage;
  render(analyzeMessage(sampleMessage));
});
elements.clearBtn.addEventListener("click", () => {
  elements.input.value = "";
  render({});
});
elements.copyJsonBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(JSON.stringify(currentResult, null, 2));
  showToast("JSON copiado");
});
elements.companyForm?.addEventListener("submit", handleCompanySubmit);

elements.input.value = sampleMessage;
render(analyzeMessage(sampleMessage));
renderCompanies();
renderWebhookOutput(companies[0]);
