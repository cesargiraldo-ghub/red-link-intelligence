const { analyzeMessage } = require("../api/_parser");

const message =
  "Fincaraiz: Hola, vi esta propiedad en FincaRaiz y me gustaria tener mas informacion. Apartamento en Arriendo en Veraguas, Bogota https://www.fincaraiz.com.co/apartamento-en-arriendo-en-veraguas-bogota/193846705";

console.log(JSON.stringify(analyzeMessage(message), null, 2));
