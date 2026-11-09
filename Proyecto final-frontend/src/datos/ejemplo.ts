// Datos de ejemplo mientras no hay backend.
// Tomados de los valores por defecto de proyecto.sql (tags, listas y tareas).

export type Tag = { nombre: string; color: string };
export type Tarea = {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string; // YYYY-MM-DD
  tag: string;
  lista: string;
  hecha: boolean;
};

export const tagsEjemplo: Tag[] = [
  { nombre: "Urgente", color: "#FF0000" },
  { nombre: "Trabajo", color: "#007BFF" },
  { nombre: "Personal", color: "#28A745" },
  { nombre: "Estudio", color: "#FFC107" },
  { nombre: "Opcional", color: "#6F42C1" },
];

export const listasEjemplo = ["General", "Trabajo", "Hogar", "Estudio", "Compras"];

/** Fecha de hoy + n días, en formato YYYY-MM-DD (para que se vean en el calendario). */
function enDias(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return aTextoFecha(d);
}

export function aTextoFecha(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const tareasEjemplo: Tarea[] = [
  { id: 1, titulo: "Reunión de equipo", descripcion: "Preparar presentación trimestral", fecha: enDias(5), tag: "Urgente", lista: "Trabajo", hecha: false },
  { id: 2, titulo: "Comprar despensa", descripcion: "Leche, huevos, fruta y verduras", fecha: enDias(0), tag: "Personal", lista: "Compras", hecha: false },
  { id: 3, titulo: "Leer capítulo 3", descripcion: "Libro de algoritmos", fecha: enDias(3), tag: "Estudio", lista: "Estudio", hecha: true },
  { id: 4, titulo: "Limpiar cocina", descripcion: "Incluir horno y refrigerador", fecha: enDias(1), tag: "Personal", lista: "Hogar", hecha: false },
  { id: 5, titulo: "Entregar reporte", descripcion: "Reporte mensual de ventas", fecha: enDias(2), tag: "Urgente", lista: "Trabajo", hecha: false },
  { id: 6, titulo: "Pagar servicios", descripcion: "Luz, agua e internet", fecha: enDias(4), tag: "Opcional", lista: "General", hecha: false },
  { id: 7, titulo: "Estudiar para examen", descripcion: "Matemáticas discretas unidad 2", fecha: enDias(7), tag: "Estudio", lista: "Estudio", hecha: false },
  { id: 8, titulo: "Llamar al plomero", descripcion: "Fuga en el baño principal", fecha: enDias(0), tag: "Urgente", lista: "Hogar", hecha: false },
];
