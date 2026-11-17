// Cliente de la API REST del backend (FastAPI + MongoDB, carpeta backend/).
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Dirección del backend:
 * 1. EXPO_PUBLIC_API_URL si está definida (por ejemplo en un archivo .env).
 * 2. Si no, la misma PC donde corre `expo start`, en el puerto 8000
 *    (así funciona en el celular por Wi-Fi sin configurar nada).
 */
function urlBase() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, "");
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`;
  }
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return `http://${host}:8000`;
}

export const API_URL = urlBase();

export type Genero = "MALE" | "FEMALE" | "OTHER";
export type Estilo = "Light" | "Dark" | "Colored";

export type Usuario = {
  id: string;
  usuario: string;
  nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  cumpleanos: string | null;
  color: string;
  genero: Genero;
  otro_genero: string;
  estilo: Estilo;
  frase: string;
  pomodoro_enfoque_min: number;
  pomodoro_descanso_min: number;
  pomodoro_descanso_largo_min: number;
};

export type DuracionesPomodoro = Pick<
  Usuario,
  "pomodoro_enfoque_min" | "pomodoro_descanso_min" | "pomodoro_descanso_largo_min"
>;

export type UsuarioNuevo = Omit<Usuario, "id" | "cumpleanos" | keyof DuracionesPomodoro> & {
  cumpleanos?: string | null;
  contrasena: string;
  lista_default: boolean;
  tags_default: boolean;
};

export type Tag = { id: string; nombre: string; color: string };
export type Lista = { id: string; nombre: string };
export type Tarea = {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string; // YYYY-MM-DD
  tag: string;
  lista: string;
  hecha: boolean;
  pomodoros: number; // pomodoros invertidos (los suma el backend)
  segundos_invertidos: number; // tiempo invertido
};
export type TareaNueva = Omit<Tarea, "id" | "pomodoros" | "segundos_invertidos">;

export type PomodoroNuevo = {
  tarea_ids: string[];
  inicio: string; // fecha ISO
  duracion_seg: number; // tiempo realmente trabajado
  duracion_plan_seg: number; // tiempo programado
};
export type Pomodoro = PomodoroNuevo & { id: string; fin: string; completo: boolean };

/** Error con el mensaje que mandó el backend (campo "detail"). */
export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    public estado: number,
  ) {
    super(mensaje);
  }
}

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + ruta, {
      method: metodo,
      headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(`Could not reach the server (${API_URL}).`, 0);
  }
  if (res.status === 204) return undefined as T;
  const datos = await res.json().catch(() => null);
  if (!res.ok) {
    const d = datos?.detail;
    const mensaje = typeof d === "string" ? d : Array.isArray(d) ? d.map((e) => e.msg).join(". ") : res.statusText;
    throw new ErrorApi(mensaje || `Error ${res.status}`, res.status);
  }
  return datos as T;
}

const u = (id: string) => `/api/usuarios/${encodeURIComponent(id)}`;

export const api = {
  login: (usuario: string, contrasena: string) => pedir<Usuario>("POST", "/api/login", { usuario, contrasena }),
  crearUsuario: (datos: UsuarioNuevo) => pedir<Usuario>("POST", "/api/usuarios", datos),
  usuario: (id: string) => pedir<Usuario>("GET", u(id)),
  editarUsuario: (id: string, cambios: Partial<DuracionesPomodoro>) => pedir<Usuario>("PATCH", u(id), cambios),

  tareas: (uid: string) => pedir<Tarea[]>("GET", `${u(uid)}/tareas`),
  crearTarea: (uid: string, t: TareaNueva) => pedir<Tarea>("POST", `${u(uid)}/tareas`, t),
  editarTarea: (uid: string, id: string, cambios: Partial<TareaNueva>) =>
    pedir<Tarea>("PATCH", `${u(uid)}/tareas/${id}`, cambios),
  borrarTarea: (uid: string, id: string) => pedir<void>("DELETE", `${u(uid)}/tareas/${id}`),

  tags: (uid: string) => pedir<Tag[]>("GET", `${u(uid)}/tags`),
  listas: (uid: string) => pedir<Lista[]>("GET", `${u(uid)}/listas`),

  registrarPomodoro: (uid: string, p: PomodoroNuevo) => pedir<Pomodoro>("POST", `${u(uid)}/pomodoros`, p),

  /** URL para descargar el respaldo (JSON o PDF). */
  urlRespaldo: (uid: string, formato: "json" | "pdf") =>
    `${API_URL}${u(uid)}/${formato === "pdf" ? "respaldo.pdf" : "respaldo"}`,
};

/** "1 h 15 min", "20 min", "45 s" */
export function tiempoBonito(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  if (m) return `${m} min`;
  return segundos > 0 ? `${Math.round(segundos)} s` : "0 min";
}
