import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";

import { api, tiempoBonito, type DuracionesPomodoro, type Tarea } from "@/api";
import { Aviso, Banner, Opcion, Pantalla, Tarjeta } from "@/components/ui";
import { colores } from "@/tema";

type Modo = "enfoque" | "descanso" | "largo";

const NOMBRE_MODO: Record<Modo, string> = { enfoque: "Enfoque", descanso: "Descanso corto", largo: "Descanso largo" };
const COLOR_MODO: Record<Modo, string> = { enfoque: colores.rosa, descanso: "#20c997", largo: "#6f42c1" };
const CAMPO_MODO: Record<Modo, keyof DuracionesPomodoro> = {
  enfoque: "pomodoro_enfoque_min",
  descanso: "pomodoro_descanso_min",
  largo: "pomodoro_descanso_largo_min",
};
const LIMITE: Record<Modo, number> = { enfoque: 180, descanso: 60, largo: 120 };
const POR_DEFECTO: DuracionesPomodoro = {
  pomodoro_enfoque_min: 25,
  pomodoro_descanso_min: 5,
  pomodoro_descanso_largo_min: 15,
};

function reloj(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PantallaPomodoro() {
  const { usuarioId = "", tareaId } = useLocalSearchParams<{ usuarioId?: string; tareaId?: string }>();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [seleccion, setSeleccion] = useState<string[]>(tareaId ? [tareaId] : []);
  const [duraciones, setDuraciones] = useState<DuracionesPomodoro>(POR_DEFECTO);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Temporizador: no cuenta segundos uno a uno; guarda CUÁNDO empezó y calcula con el reloj.
  // Así sigue exacto aunque la app se minimice.
  const [modo, setModo] = useState<Modo>("enfoque");
  const [corriendo, setCorriendo] = useState(false);
  const [acumuladoMs, setAcumuladoMs] = useState(0); // tiempo corrido antes de la última pausa
  const [desde, setDesde] = useState(0); // Date.now() del último "Start"
  const [inicioIso, setInicioIso] = useState<string | null>(null); // cuándo empezó este pomodoro
  const [ahora, setAhora] = useState(() => Date.now());
  const [completados, setCompletados] = useState(0);

  const planMs = duraciones[CAMPO_MODO[modo]] * 60_000;
  const transcurridoMs = acumuladoMs + (corriendo ? Math.max(0, ahora - desde) : 0);
  const restanteMs = Math.max(0, planMs - transcurridoMs);

  // Carga tareas y las duraciones guardadas del usuario.
  useEffect(() => {
    if (!usuarioId) return;
    let vigente = true;
    Promise.all([api.usuario(usuarioId), api.tareas(usuarioId)])
      .then(([u, ts]) => {
        if (!vigente) return;
        setDuraciones({
          pomodoro_enfoque_min: u.pomodoro_enfoque_min ?? 25,
          pomodoro_descanso_min: u.pomodoro_descanso_min ?? 5,
          pomodoro_descanso_largo_min: u.pomodoro_descanso_largo_min ?? 15,
        });
        setTareas(ts);
      })
      .catch((e) => vigente && setError(e instanceof Error ? e.message : "Error"));
    return () => {
      vigente = false;
    };
  }, [usuarioId]);

  const reiniciar = (siguiente: Modo, arrancar: boolean) => {
    const t = Date.now();
    setModo(siguiente);
    setAcumuladoMs(0);
    setInicioIso(null);
    setDesde(t);
    setAhora(t);
    setCorriendo(arrancar);
  };

  const iniciar = () => {
    if (modo === "enfoque" && seleccion.length === 0) {
      setError("Selecciona al menos una tarea para este pomodoro.");
      return;
    }
    const t = Date.now();
    setError(null);
    setDesde(t);
    setAhora(t);
    if (!inicioIso) setInicioIso(new Date(t).toISOString());
    setCorriendo(true);
  };

  const pausar = () => {
    setAcumuladoMs(acumuladoMs + (Date.now() - desde));
    setCorriendo(false);
  };

  /** completo = se acabó el tiempo; si no, el usuario lo terminó antes (cuenta igual). */
  const terminar = async (completo: boolean) => {
    Vibration.vibrate(400);

    if (modo !== "enfoque") {
      setAviso("Terminó el descanso. Puedes iniciar el siguiente pomodoro.");
      reiniciar("enfoque", false);
      return;
    }

    const trabajadoMs = completo ? planMs : acumuladoMs + (corriendo ? Date.now() - desde : 0);
    const segundos = Math.round(trabajadoMs / 1000);
    const ids = seleccion;
    const inicio = inicioIso ?? new Date(Date.now() - trabajadoMs).toISOString();
    const n = completados + 1;
    setCompletados(n);
    reiniciar(n % 4 === 0 ? "largo" : "descanso", true);

    if (segundos < 1 || ids.length === 0) return;
    try {
      await api.registrarPomodoro(usuarioId, {
        tarea_ids: ids,
        inicio,
        duracion_seg: segundos,
        duracion_plan_seg: Math.round(planMs / 1000),
      });
      // Cada tarea ligada suma +1 pomodoro y el tiempo completo trabajado.
      setTareas((ts) =>
        ts.map((t) =>
          ids.includes(t.id)
            ? { ...t, pomodoros: (t.pomodoros ?? 0) + 1, segundos_invertidos: (t.segundos_invertidos ?? 0) + segundos }
            : t,
        ),
      );
      setAviso(`Se añadió un pomodoro (${tiempoBonito(segundos)}) a ${ids.length} tarea${ids.length > 1 ? "s" : ""}. Es momento de descansar.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  // Mientras corre: refresca la pantalla y termina solo cuando se acaba el tiempo.
  useEffect(() => {
    if (!corriendo) return;
    const tic = setInterval(() => setAhora(Date.now()), 250);
    const fin = setTimeout(() => terminar(true), Math.max(0, planMs - acumuladoMs - (Date.now() - desde)));
    return () => {
      clearInterval(tic);
      clearTimeout(fin);
    };
  });

  const cambiarDuracion = (m: Modo, delta: number) => {
    const campo = CAMPO_MODO[m];
    const valor = Math.min(LIMITE[m], Math.max(1, duraciones[campo] + delta));
    if (valor === duraciones[campo]) return;
    setDuraciones({ ...duraciones, [campo]: valor });
    api.editarUsuario(usuarioId, { [campo]: valor }).catch((e) => setError(e instanceof Error ? e.message : "Error"));
  };

  const alternar = (id: string) =>
    setSeleccion(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]);

  const color = COLOR_MODO[modo];
  const progreso = planMs ? Math.min(1, transcurridoMs / planMs) : 0;
  const pendientes = tareas.filter((t) => !t.hecha || seleccion.includes(t.id));

  return (
    <Pantalla>
      <Banner titulo="Pomodoro" />

      {error && (
        <Aviso error onCerrar={() => setError(null)}>
          {error}
        </Aviso>
      )}
      {aviso && <Aviso onCerrar={() => setAviso(null)}>{aviso}</Aviso>}

      <Tarjeta>
        <View style={estilos.modos}>
          {(["enfoque", "descanso", "largo"] as const).map((m) => (
            <Pressable
              key={m}
              disabled={corriendo}
              onPress={() => reiniciar(m, false)}
              style={[estilos.modo, modo === m && { backgroundColor: COLOR_MODO[m], borderColor: COLOR_MODO[m] }]}
            >
              <Text style={[estilos.modoTexto, modo === m && { color: colores.blanco }]}>{NOMBRE_MODO[m]}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[estilos.circulo, { borderColor: `${color}33` }]}>
          <Text style={[estilos.reloj, { color }]}>{reloj(restanteMs)}</Text>
          <Text style={estilos.subReloj}>
            {corriendo ? NOMBRE_MODO[modo] : transcurridoMs > 0 ? "En pausa" : "Listo"}
          </Text>
          <Text style={estilos.contador}>Pomodoros: {completados}</Text>
        </View>

        <View style={estilos.barra}>
          <View style={[estilos.barraRelleno, { width: `${progreso * 100}%`, backgroundColor: color }]} />
        </View>

        <View style={estilos.botones}>
          <Boton
            texto={corriendo ? "Pausar" : transcurridoMs > 0 ? "Reanudar" : "Iniciar"}
            color={color}
            onPress={corriendo ? pausar : iniciar}
          />
          {modo === "enfoque" ? (
            <>
              <Boton
                texto="Terminar"
                color={color}
                contorno
                desactivado={transcurridoMs < 1000}
                onPress={() => terminar(false)}
              />
              <Boton
                texto="Reiniciar"
                color="#6c757d"
                contorno
                desactivado={transcurridoMs === 0}
                onPress={() => reiniciar("enfoque", false)}
              />
            </>
          ) : (
            <Boton texto="Omitir descanso" color={color} contorno onPress={() => reiniciar("enfoque", false)} />
          )}
        </View>
        <Text style={estilos.ayuda}>
          Al pulsar Terminar, el pomodoro cuenta aunque lo finalices antes y se guarda el tiempo trabajado.
        </Text>
      </Tarjeta>

      <Tarjeta titulo="Tareas de este pomodoro">
        {pendientes.length === 0 && <Text style={estilos.vacio}>No hay tareas pendientes.</Text>}
        {pendientes.map((t) => (
          <View key={t.id} style={estilos.tarea}>
            <View style={{ flex: 1 }}>
              <Opcion texto={t.titulo} activa={seleccion.includes(t.id)} onPress={() => alternar(t.id)} />
            </View>
            <Text style={estilos.tomates}>
              {t.pomodoros ?? 0} pomodoros · {tiempoBonito(t.segundos_invertidos ?? 0)}
            </Text>
          </View>
        ))}
      </Tarjeta>

      <Tarjeta titulo="Duraciones (minutos)">
        {(["enfoque", "descanso", "largo"] as const).map((m) => (
          <View key={m} style={estilos.fila}>
            <Text style={estilos.filaTexto}>{NOMBRE_MODO[m]}</Text>
            <View style={estilos.paso}>
              <Pasito texto="−" desactivado={corriendo} onPress={() => cambiarDuracion(m, -1)} />
              <Text style={estilos.pasoValor}>{duraciones[CAMPO_MODO[m]]}</Text>
              <Pasito texto="+" desactivado={corriendo} onPress={() => cambiarDuracion(m, 1)} />
            </View>
          </View>
        ))}
        <Text style={estilos.ayuda}>Cada cuatro pomodoros corresponde un descanso largo.</Text>
      </Tarjeta>
    </Pantalla>
  );
}

function Boton({
  texto,
  color,
  onPress,
  contorno = false,
  desactivado = false,
}: {
  texto: string;
  color: string;
  onPress: () => void;
  contorno?: boolean;
  desactivado?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desactivado}
      style={({ pressed }) => [
        estilos.boton,
        { borderColor: color, backgroundColor: contorno ? colores.blanco : color },
        desactivado && { opacity: 0.4 },
        pressed && { transform: [{ scale: 0.96 }] },
      ]}
    >
      <Text style={[estilos.botonTexto, { color: contorno ? color : colores.blanco }]}>{texto}</Text>
    </Pressable>
  );
}

function Pasito({ texto, onPress, desactivado }: { texto: string; onPress: () => void; desactivado: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={desactivado} style={[estilos.pasito, desactivado && { opacity: 0.4 }]}>
      <Text style={estilos.pasitoTexto}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  modos: { flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  modo: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colores.borde,
    backgroundColor: colores.fondoInput,
  },
  modoTexto: { color: colores.texto, fontSize: 14 },
  circulo: {
    alignSelf: "center",
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    backgroundColor: colores.blanco,
  },
  reloj: { fontSize: 54, fontWeight: "bold", fontVariant: ["tabular-nums"] },
  subReloj: { color: colores.textoSuave, fontSize: 15, marginTop: 2 },
  contador: { color: colores.texto, fontSize: 14, marginTop: 8 },
  barra: { height: 8, borderRadius: 4, backgroundColor: "#f1f1f1", overflow: "hidden", marginTop: 20 },
  barraRelleno: { height: "100%", borderRadius: 4 },
  botones: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 18, flexWrap: "wrap" },
  boton: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 22, borderWidth: 2 },
  botonTexto: { fontSize: 16, fontWeight: "bold" },
  ayuda: { color: "#6c757d", textAlign: "center", marginTop: 12, fontSize: 13 },
  vacio: { color: "#6c757d" },
  tarea: { flexDirection: "row", alignItems: "center", gap: 8 },
  tomates: { color: "#ff6b6b", fontSize: 12, fontWeight: "bold" },
  fila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  filaTexto: { color: colores.texto, fontSize: 16 },
  paso: { flexDirection: "row", alignItems: "center", gap: 12 },
  pasoValor: { fontSize: 18, fontWeight: "bold", color: colores.texto, minWidth: 34, textAlign: "center" },
  pasito: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colores.rosa,
    alignItems: "center",
    justifyContent: "center",
  },
  pasitoTexto: { color: colores.blanco, fontSize: 20, fontWeight: "bold", lineHeight: 22 },
});
