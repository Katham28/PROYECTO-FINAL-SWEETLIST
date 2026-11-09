export const colores = {
  rosa: "#ff4f8b",
  rosaClaro: "#ff7eb3",
  rosaPastel: "#ffadd0",
  borde: "#ffd1e1",
  fondoInput: "#fff8fb",
  fondoArriba: "#ffe4ec",
  fondoAbajo: "#fff0f5",
  texto: "#444444",
  textoSuave: "#888888",
  blanco: "#ffffff",
  error: "#cc0000",
} as const;

export const degradadoRosa = [colores.rosaClaro, colores.rosa] as const;

export const sombraRosa = "0px 8px 20px rgba(255, 105, 180, 0.2)";
