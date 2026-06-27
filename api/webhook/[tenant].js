const { analyzeMessage } = require("../_parser");

function findTextWithUrl(value) {
  if (value == null) return "";
  if (typeof value === "string") return /(?:https?:\/\/|www\.)/i.test(value) ? value : "";
  if (typeof value !== "object") return "";

  for (const item of Object.values(value)) {
    const found = findTextWithUrl(item);
    if (found) return found;
  }

  return "";
}

function readMessage(body = {}) {
  const candidates = [
    body.message,
    body.body,
    body.text,
    body.mensaje_whatsapp,
    body.message_body,
    body.messageBody,
    body.MessageBody,
    body["Message Body"],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    const nestedText = findTextWithUrl(candidate);
    if (nestedText) return nestedText;
  }

  return findTextWithUrl(body) || "";
}

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { tenant } = req.query;

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "RED Link Intelligence",
      tenant,
      usage: "POST { message: '{{message.body}}' }",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, tenant, error: "Metodo no permitido" });
  }

  const message = readMessage(req.body);
  const analysis = analyzeMessage(message);

  return res.status(200).json({
    ok: !analysis.error,
    tenant,
    mensaje_recibido: message,
    ...analysis,
  });
};
