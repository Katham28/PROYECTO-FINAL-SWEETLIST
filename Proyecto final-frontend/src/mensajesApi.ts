type DetalleValidacion = { type?: string; msg?: string; loc?: (string | number)[]; ctx?: Record<string, unknown> };
const CAMPOS: Record<string, string> = {
  nombre: "nombre", apellidos: "apellidos", usuario: "usuario", contrasena: "contraseña", confirmar_contrasena: "confirmación de contraseña",
  cumpleanos: "cumpleaños", color: "color", genero: "género", otro_genero: "género", frase: "frase motivacional",
  titulo: "título", descripcion: "descripción", fecha: "fecha", lista: "lista", tag: "etiqueta",
  tarea_ids: "tareas", duracion_seg: "tiempo trabajado", duracion_plan_seg: "duración programada", inicio: "fecha de inicio",
};
export function mensajeValidacion(e: DetalleValidacion): string {
  const clave = String(e.loc?.[e.loc.length - 1] ?? "campo");
  const campo = CAMPOS[clave] ?? "campo";
  const tipo = e.type ?? "";
  if (tipo === "value_error") return (e.msg ?? "Revisa los datos introducidos.").replace(/^Value error, /, "");
  if (tipo === "missing") return `El campo ${campo} es obligatorio.`;
  if (tipo === "string_too_short") return `El campo ${campo} debe tener al menos ${e.ctx?.min_length ?? 1} caracteres.`;
  if (tipo === "string_too_long") return `El campo ${campo} admite como máximo ${e.ctx?.max_length} caracteres.`;
  if (tipo === "string_type") return `El campo ${campo} debe ser texto.`;
  if (tipo === "string_pattern_mismatch") return `El formato del campo ${campo} no es válido.`;
  if (tipo.startsWith("date")) return `Selecciona una fecha válida para ${campo}.`;
  if (tipo.startsWith("int") || tipo.startsWith("float")) return `El campo ${campo} debe ser un número válido.`;
  if (["greater_than", "greater_than_equal", "less_than", "less_than_equal"].includes(tipo)) return `El campo ${campo} está fuera del rango permitido.`;
  if (tipo === "literal_error" || tipo === "enum") return `Selecciona una opción válida para ${campo}.`;
  if (tipo === "too_short" || tipo === "too_long") return `Revisa la cantidad de elementos en ${campo}.`;
  return `Revisa el valor del campo ${campo}.`;
}
export function mensajeHttp(estado: number): string {
  if (estado === 401) return "No se pudo iniciar sesión. Revisa tus datos.";
  if (estado === 403) return "No tienes permiso para realizar esta acción.";
  if (estado === 404) return "No se encontró la información solicitada.";
  if (estado === 409) return "Ya existe un registro con esos datos.";
  if (estado === 422) return "Revisa los datos introducidos.";
  if (estado >= 500) return "Ocurrió un error en el servidor. Inténtalo de nuevo.";
  return `No se pudo completar la solicitud (código ${estado}).`;
}
