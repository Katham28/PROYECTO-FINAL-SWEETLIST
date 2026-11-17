import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CalendarioMes } from "@/components/CalendarioMes";
import {
  Aviso,
  Banner,
  BotonRosa,
  Campo,
  Etiqueta,
  MiniBanner,
  Opcion,
  Pantalla,
  Tarjeta,
  Ventana,
} from "@/components/ui";
import { api, tiempoBonito, type Tag, type Tarea } from "@/api";
import { exportarRespaldo } from "@/exportar";
import { colores } from "@/tema";

export default function MenuPrincipal() {
  const { usuarioId = "", usuario = "user" } = useLocalSearchParams<{ usuarioId?: string; usuario?: string }>();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [listas, setListas] = useState<string[]>([]);
  const [listasActivas, setListasActivas] = useState<string[]>([]);
  const [tagsActivos, setTagsActivos] = useState<string[]>([]);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Add Task
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [tagNuevo, setTagNuevo] = useState("");
  const [listaNueva, setListaNueva] = useState("");
  const [agregada, setAgregada] = useState(false);

  const mostrarError = (e: unknown) => setError(e instanceof Error ? e.message : "Error");

  // Carga tareas, tags y listas del usuario desde el backend.
  // useFocusEffect: se vuelve a cargar al regresar del Pomodoro (para ver los contadores nuevos).
  useFocusEffect(
    useCallback(() => {
      if (!usuarioId) {
        router.replace("/");
        return;
      }
      let vigente = true;
      Promise.all([api.tareas(usuarioId), api.tags(usuarioId), api.listas(usuarioId)])
        .then(([ts, tg, ls]) => {
          if (!vigente) return;
          // Incluye tags y listas que usan las tareas aunque no estén creados, para que no queden ocultas.
          const nombresTags = [...new Set([...tg.map((t) => t.nombre), ...ts.map((t) => t.tag)])];
          const nombresListas = [...new Set([...ls.map((l) => l.nombre), ...ts.map((t) => t.lista)])];
          setTareas(ts);
          setTags(tg);
          setListas(nombresListas);
          setTagsActivos(nombresTags);
          setListasActivas(nombresListas);
          setTagNuevo((v) => v || tg[0]?.nombre || "");
          setListaNueva((v) => v || nombresListas[0] || "General");
        })
        .catch((e) => vigente && setError(e instanceof Error ? e.message : "Error"))
        .finally(() => vigente && setCargando(false));
      return () => {
        vigente = false;
      };
    }, [usuarioId]),
  );

  const colorDeTag = (nombre: string) => tags.find((t) => t.nombre === nombre)?.color ?? "#cccccc";
  const nombresTags = [...new Set([...tags.map((t) => t.nombre), ...tareas.map((t) => t.tag)])];
  const opcionesLista = listas.length ? listas : ["General"];

  const alternar = (lista: string[], valor: string) =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

  const visibles = tareas.filter((t) => tagsActivos.includes(t.tag) && listasActivas.includes(t.lista));

  const agregarTarea = async () => {
    if (!titulo.trim()) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      setError("Due Date must be YYYY-MM-DD.");
      return;
    }
    try {
      const nueva = await api.crearTarea(usuarioId, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha,
        tag: tagNuevo,
        lista: listaNueva || "General",
        hecha: false,
      });
      setTareas((ts) => [...ts, nueva].sort((a, b) => a.fecha.localeCompare(b.fecha)));
      if (!listas.includes(nueva.lista)) {
        setListas((ls) => [...ls, nueva.lista]);
        setListasActivas((ls) => [...ls, nueva.lista]);
      }
      if (!tagsActivos.includes(nueva.tag)) setTagsActivos((ts) => [...ts, nueva.tag]);
      setTitulo("");
      setDescripcion("");
      setFecha("");
      setError(null);
      setAgregada(true);
    } catch (e) {
      mostrarError(e);
    }
  };

  const alternarHecha = async (t: Tarea) => {
    setTareas((ts) => ts.map((x) => (x.id === t.id ? { ...x, hecha: !t.hecha } : x)));
    try {
      await api.editarTarea(usuarioId, t.id, { hecha: !t.hecha });
    } catch (e) {
      setTareas((ts) => ts.map((x) => (x.id === t.id ? { ...x, hecha: t.hecha } : x)));
      mostrarError(e);
    }
  };

  const [exportando, setExportando] = useState<"json" | "pdf" | null>(null);
  const exportar = async (formato: "json" | "pdf") => {
    if (exportando) return;
    setExportando(formato);
    try {
      await exportarRespaldo(usuarioId, usuario, formato);
    } catch (e) {
      mostrarError(e);
    } finally {
      setExportando(null);
    }
  };

  const abrirPomodoro = (tareaId?: string) =>
    router.push({ pathname: "/pomodoro", params: tareaId ? { usuarioId, tareaId } : { usuarioId } });

  const borrarTarea = async (t: Tarea) => {
    try {
      await api.borrarTarea(usuarioId, t.id);
      setTareas((ts) => ts.filter((x) => x.id !== t.id));
    } catch (e) {
      mostrarError(e);
    }
  };

  const cerrarSesion = () => {
    setConfirmarSalida(false);
    router.replace("/");
  };

  return (
    <Pantalla>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => setConfirmarSalida(true)} hitSlop={8}>
              <Text style={estilos.salir}>Log out</Text>
            </Pressable>
          ),
        }}
      />

      <Banner titulo={`Welcome to SweetList, ${usuario}!`} />

      <MiniBanner titulo="General View" />

      <View style={estilos.acciones}>
        <Accion texto="🍅 Pomodoro" onPress={() => abrirPomodoro()} />
        <Accion texto={exportando === "json" ? "Exporting..." : "⬇ Backup JSON"} onPress={() => exportar("json")} />
        <Accion texto={exportando === "pdf" ? "Exporting..." : "⬇ Backup PDF"} onPress={() => exportar("pdf")} />
      </View>

      {error && (
        <Aviso error onCerrar={() => setError(null)}>
          {error}
        </Aviso>
      )}

      <Tarjeta>
        <Text style={estilos.subtitulo}>List selection</Text>
        {opcionesLista.map((l) => (
          <Opcion
            key={l}
            texto={l}
            activa={listasActivas.includes(l)}
            onPress={() => setListasActivas(alternar(listasActivas, l))}
          />
        ))}

        <View style={estilos.separador} />

        <Text style={estilos.subtitulo}>Filter by tag</Text>
        {nombresTags.length === 0 && <Text style={estilos.vacio}>No tags</Text>}
        {nombresTags.map((t) => (
          <Opcion
            key={t || "(none)"}
            texto={t || "(no tag)"}
            activa={tagsActivos.includes(t)}
            onPress={() => setTagsActivos(alternar(tagsActivos, t))}
          />
        ))}

        <View style={estilos.separador} />

        <Text style={estilos.subtitulo}>Quick Add Task</Text>
        {agregada && <Aviso onCerrar={() => setAgregada(false)}>Task added!</Aviso>}
        <Campo etiqueta="Title:" value={titulo} onChangeText={setTitulo} />
        <Campo etiqueta="Description:" value={descripcion} onChangeText={setDescripcion} />
        <Campo
          etiqueta="Due Date:"
          value={fecha}
          onChangeText={setFecha}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <Etiqueta>Tag:</Etiqueta>
        {tags.length === 0 ? (
          <Text style={estilos.vacio}>No tags</Text>
        ) : (
          <Chips opciones={tags.map((t) => t.nombre)} valor={tagNuevo} onChange={setTagNuevo} />
        )}
        <Etiqueta>List:</Etiqueta>
        <Chips opciones={opcionesLista} valor={listaNueva} onChange={setListaNueva} />
        <BotonRosa texto="ADD" onPress={agregarTarea} />
      </Tarjeta>

      <Tarjeta>
        <Text style={estilos.subtitulo}>Task View</Text>
        {cargando ? (
          <Text style={estilos.vacio}>Loading...</Text>
        ) : tareas.length === 0 ? (
          <Text style={estilos.vacio}>No hay tasks</Text>
        ) : visibles.length === 0 ? (
          <Text style={estilos.vacio}>No hay coincidencias</Text>
        ) : (
          visibles.map((t) => {
            const color = colorDeTag(t.tag);
            return (
              <View key={t.id} style={[estilos.tarea, { backgroundColor: `${color}33`, borderLeftColor: colores.rosa }]}>
                <Opcion texto="" activa={t.hecha} onPress={() => alternarHecha(t)} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={estilos.tareaCabecera}>
                    <Text style={[estilos.tareaTitulo, t.hecha && estilos.hecha]}>{t.titulo}</Text>
                    {!!t.fecha && <Text style={estilos.tareaFecha}>{t.fecha}</Text>}
                    {!t.hecha && (
                      <Pressable onPress={() => abrirPomodoro(t.id)} hitSlop={8}>
                        <Text style={estilos.play}>▶</Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => borrarTarea(t)} hitSlop={8}>
                      <Text style={estilos.borrar}>✕</Text>
                    </Pressable>
                  </View>
                  {!!t.descripcion && <Text style={estilos.tareaDescripcion}>{t.descripcion}</Text>}
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {!!t.tag && <Text style={[estilos.insignia, { backgroundColor: `${color}dd` }]}>{t.tag}</Text>}
                    <Text style={[estilos.insignia, { backgroundColor: "#e0e0e0", color: "#555" }]}>{t.lista}</Text>
                  </View>
                  {(t.pomodoros ?? 0) > 0 && (
                    <Text style={estilos.tomates}>
                      🍅 {t.pomodoros} pomodoro{t.pomodoros === 1 ? "" : "s"} · {tiempoBonito(t.segundos_invertidos)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </Tarjeta>

      <MiniBanner titulo="Calendar View" />

      <Tarjeta>
        <CalendarioMes
          eventos={tareas
            .filter((t) => t.fecha)
            .map((t) => ({ id: t.id, titulo: t.titulo, fecha: t.fecha, color: colorDeTag(t.tag) }))}
        />
      </Tarjeta>

      <Ventana
        visible={confirmarSalida}
        titulo="You are about to log out."
        mensaje="Are you sure?"
        onCerrar={() => setConfirmarSalida(false)}
        botones={[
          { texto: "Cancel", onPress: () => setConfirmarSalida(false) },
          { texto: "Yes", peligro: true, onPress: cerrarSesion },
        ]}
      />
    </Pantalla>
  );
}

function Accion({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [estilos.accion, pressed && { opacity: 0.7 }]}>
      <Text style={estilos.accionTexto}>{texto}</Text>
    </Pressable>
  );
}

/** Selector de una opción en forma de píldoras (reemplaza al <select>). */
function Chips({
  opciones,
  valor,
  onChange,
}: {
  opciones: string[];
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={estilos.chips}>
      {opciones.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} style={[estilos.chip, valor === o && estilos.chipActivo]}>
          <Text style={[estilos.chipTexto, valor === o && { color: colores.blanco }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  salir: { color: colores.blanco, fontWeight: "bold", fontSize: 17 },
  subtitulo: { fontSize: 20, fontWeight: "500", color: colores.texto, marginBottom: 4 },
  separador: { height: 1, backgroundColor: "#ddd", marginVertical: 12 },
  vacio: { color: "#6c757d" },
  tarea: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderLeftWidth: 4,
  },
  tareaCabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  tareaTitulo: { fontWeight: "bold", color: colores.texto, fontSize: 15, flexShrink: 1 },
  hecha: { textDecorationLine: "line-through", opacity: 0.6 },
  tareaFecha: { color: "#6c757d", fontSize: 12, marginLeft: "auto" },
  borrar: { color: "#dc3545", fontWeight: "bold", fontSize: 16 },
  play: { color: colores.rosa, fontWeight: "bold", fontSize: 15 },
  tomates: { color: "#ff6b6b", fontSize: 12, fontWeight: "bold" },
  acciones: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  accion: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colores.blanco,
    borderWidth: 2,
    borderColor: colores.rosa,
  },
  accionTexto: { color: colores.rosa, fontWeight: "bold", fontSize: 14 },
  tareaDescripcion: { color: "#6c757d", fontSize: 14 },
  insignia: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, marginBottom: 10 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colores.borde,
    backgroundColor: colores.fondoInput,
  },
  chipActivo: { backgroundColor: colores.rosa, borderColor: colores.rosa },
  chipTexto: { color: colores.texto, fontSize: 14 },
});
