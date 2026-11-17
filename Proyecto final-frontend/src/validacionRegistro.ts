// Mismas reglas que el backend. Las contraseñas no se recortan ni se transforman.
export const USUARIO_RE = /^[a-zA-Z0-9_.-]{3,50}$/;
export const NOMBRE_RE = /^[\p{L}\p{M} .’'-]+$/u;

export function errorNombre(valor: string, maximo = 100) {
  const texto = valor.trim();
  if (!texto) return "Este campo es obligatorio.";
  if (texto.length > maximo) return `Máximo ${maximo} caracteres.`;
  if (!NOMBRE_RE.test(texto) || !/\p{L}/u.test(texto)) return "Usa letras, espacios, acentos, guiones o apóstrofes.";
  return null;
}

export function fechaLocal(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

export function errorCumpleanos(valor: string) {
  if (!valor) return null; // opcional
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return "Selecciona una fecha válida.";
  const fecha = new Date(`${valor}T12:00:00`);
  if (Number.isNaN(fecha.getTime()) || fechaLocal(fecha) !== valor) return "Selecciona una fecha válida.";
  if (valor < "1900-01-01" || valor > fechaLocal(new Date())) return "El cumpleaños debe estar entre 1900 y hoy.";
  return null;
}

export function errorContrasena(valor: string) {
  if (valor.length < 8) return "Usa al menos 8 caracteres.";
  if (valor.length > 128) return "Máximo 128 caracteres.";
  if (!valor.trim()) return "La contraseña no puede contener solo espacios.";
  return null;
}


/** Fecha de tarea: admite pasado o futuro, pero debe existir en el calendario. */
export function errorFecha(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return "Selecciona una fecha de entrega.";
  const fecha = new Date(`${valor}T12:00:00`);
  if (Number.isNaN(fecha.getTime()) || fechaLocal(fecha) !== valor || valor < "1900-01-01") return "Selecciona una fecha válida.";
  return null;
}
