// Store global en memoria para compartir la ultima data validada entre
// el modulo de validacion (App.jsx) y el modulo de indicadores, sin depender
// de localStorage ni de la BD (que pueden fallar con data grande o en Vercel).
let ultimaData = null

export function guardarUltimaData(payload) {
  ultimaData = payload
}

export function leerUltimaData() {
  return ultimaData
}

export function limpiarUltimaData() {
  ultimaData = null
}