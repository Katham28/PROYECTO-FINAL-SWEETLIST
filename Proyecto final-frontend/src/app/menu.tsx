import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Calendario from "@/components/calendario";
import {
  Aviso,
  Banner,
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
  const { usuarioId = "", usuario = "usuario" } = useLocalSearchParams<{ usuarioId?: string; usuario?: string }>();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [listas, setListas] = useState<string[]>([]);
  const [listasActivas, setListasActivas] = useState<string[]>([]);
  const [tagsActivos, setTagsActivos] = useState<string[]>([]);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [frase, setFrase] = useState("");
  const insets = useSafeAreaInsets();

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
      Promise.all([api.tareas(usuarioId), api.tags(usuarioId), api.listas(usuarioId), api.usuario(usuarioId)])
        .then(([ts, tg, ls, perfil]) => {
          if (!vigente) return;
          // Incluye tags y listas que usan las tareas aunque no estén creados, para que no queden ocultas.
          const nombresTags = [...new Set([...tg.map((t) => t.nombre), ...ts.map((t) => t.tag)])];
          const nombresListas = [...new Set([...ls.map((l) => l.nombre), ...ts.map((t) => t.lista)])];
          setFrase(perfil.frase.trim());
          setError(null);
          setTareas(ts);
          setTags(tg);
          setListas(nombresListas);
          setTagsActivos(nombresTags);
          setListasActivas(nombresListas);
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
  const opcionesLista = listas;

  const alternar = (lista: string[], valor: string) =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

  const visibles = tareas.filter((t) => tagsActivos.includes(t.tag) && listasActivas.includes(t.lista));

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
    <Pantalla footer={
      <View style={[estilos.pieFijo, { paddingBottom: Math.max(insets.bottom, 12), paddingLeft: Math.max(insets.left, 16), paddingRight: Math.max(insets.right, 16) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Añadir tarea" onPress={() => router.push({ pathname: "/quick_add_task", params: { usuarioId, usuario } })}>
          <LinearGradient colors={[colores.rosaClaro, colores.rosa]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.addTask}>
            <Text style={estilos.addTaskTexto}>Añadir tarea</Text>
          </LinearGradient>
        </Pressable>
      </View>
    }>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => setConfirmarSalida(true)} hitSlop={8}>
              <Text style={estilos.salir}>Cerrar sesión</Text>
            </Pressable>
          ),
        }}
      />

      <Banner titulo={`Te damos la bienvenida, ${usuario}`} />
      <LinearGradient colors={["#fff8fc", "#ffe0ec"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.motivacion}>
        <Text style={estilos.motivacionEtiqueta}>UN RECORDATORIO PARA TI</Text>
        <Text style={estilos.motivacionFrase}>“{frase || "Un paso a la vez, también es avanzar."}”</Text>
        <Text style={estilos.motivacionFirma}>con cariño, SweetList</Text>
      </LinearGradient>

      <MiniBanner titulo="Vista general" />

      <View style={estilos.acciones}>
        <Accion texto="Pomodoro" onPress={() => abrirPomodoro()} />
        <Accion texto={exportando === "json" ? "Exportando…" : "Respaldo JSON"} onPress={() => exportar("json")} />
        <Accion texto={exportando === "pdf" ? "Exportando…" : "Respaldo PDF"} onPress={() => exportar("pdf")} />
      </View>

      {error && (
        <Aviso error onCerrar={() => setError(null)}>
          {error}
        </Aviso>
      )}

      <Tarjeta>
        <Text style={estilos.filtroTitulo}>Filtrar por lista</Text>
        <View style={estilos.filtros}>
          {opcionesLista.map((l) => <Filtro key={l} texto={l || "Sin lista"} activo={listasActivas.includes(l)} onPress={() => setListasActivas(alternar(listasActivas, l))} />)}
        </View>
        <Text style={estilos.filtroTitulo}>Filtrar por etiqueta</Text>
        <View style={estilos.filtros}>
          {!nombresTags.length && <Text style={estilos.vacio}>Sin etiquetas</Text>}
          {nombresTags.map((t) => <Filtro key={t || "(none)"} texto={t || "Sin etiqueta"} color={colorDeTag(t)} activo={tagsActivos.includes(t)} onPress={() => setTagsActivos(alternar(tagsActivos, t))} />)}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Editar nombres de listas y etiquetas" onPress={() => router.push({ pathname: "/tags_list_edit", params: { usuarioId, usuario } })} style={estilos.editarFiltros}>
          <Text style={estilos.lapiz}>Editar</Text><Text style={estilos.editarTexto}>Editar listas y etiquetas</Text>
        </Pressable>
      </Tarjeta>

      <Tarjeta>
        <Text style={estilos.subtitulo}>Tareas</Text>
        {cargando ? (
          <Text style={estilos.vacio}>Cargando…</Text>
        ) : tareas.length === 0 ? (
          <Text style={estilos.vacio}>Todavía no hay tareas</Text>
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
                  </View>
                  <View style={estilos.tareaHerramientas}>
                    {!!t.fecha && <Text style={estilos.tareaFecha}>{t.fecha}</Text>}
                    <View style={estilos.iconosTarea}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Editar tarea ${t.titulo}`} onPress={() => router.push({ pathname: "/task_edit", params: { usuarioId, usuario, tareaId: t.id } })} style={estilos.iconoTarea}>
                      <Text style={estilos.lapiz}>Editar</Text>
                    </Pressable>
                    {!t.hecha && (
                      <Pressable accessibilityRole="button" accessibilityLabel={`Iniciar pomodoro de ${t.titulo}`} onPress={() => abrirPomodoro(t.id)} style={estilos.iconoTarea}>
                        <Text style={estilos.play}>Iniciar</Text>
                      </Pressable>
                    )}
                    <Pressable accessibilityRole="button" accessibilityLabel={`Borrar tarea ${t.titulo}`} onPress={() => borrarTarea(t)} style={estilos.iconoTarea}>
                      <Text style={estilos.borrar}>✕</Text>
                    </Pressable>
                    </View>
                  </View>
                  {!!t.descripcion && <Text style={estilos.tareaDescripcion}>{t.descripcion}</Text>}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {!!t.tag && <Text style={[estilos.insignia, { backgroundColor: `${color}dd` }]}>{t.tag}</Text>}
                    <Text style={[estilos.insignia, { backgroundColor: "#e0e0e0", color: "#555" }]}>{t.lista || "Sin lista"}</Text>
                  </View>
                  {(t.pomodoros ?? 0) > 0 && (
                    <Text style={estilos.tomates}>
                      {t.pomodoros} pomodoro{t.pomodoros === 1 ? "" : "s"} · {tiempoBonito(t.segundos_invertidos)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </Tarjeta>

      <Calendario tareas={tareas} tags={tags} />

      <Ventana
        visible={confirmarSalida}
        titulo="Cerrar sesión"
        mensaje="¿Quieres cerrar la sesión?"
        onCerrar={() => setConfirmarSalida(false)}
        botones={[
          { texto: "Cancelar", onPress: () => setConfirmarSalida(false) },
          { texto: "Sí", peligro: true, onPress: cerrarSesion },
        ]}
      />
    </Pantalla>
  );
}

function Filtro({ texto, activo, onPress, color }: { texto: string; activo: boolean; onPress: () => void; color?: string }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: activo }} onPress={onPress} style={[estilos.filtro, activo && estilos.filtroActivo]}>
    {color && <View style={[estilos.puntoTag, { backgroundColor: color }]} />}
    <Text style={[estilos.filtroTexto, activo && estilos.filtroTextoActivo]}>{texto}</Text>
  </Pressable>;
}

function Accion({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [estilos.accion, pressed && { opacity: 0.7 }]}>
      <Text style={estilos.accionTexto}>{texto}</Text>
    </Pressable>
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
  tareaFecha: { color: "#6c757d", fontSize: 12 },
  tareaHerramientas: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 4 },
  iconosTarea: { flexDirection: "row", alignItems: "center", marginLeft: "auto" },
  iconoTarea: { minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" },
  filtroTitulo: { color: colores.texto, fontWeight: "600", fontSize: 14, marginTop: 4 },
  filtros: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  filtro: { minHeight: 44, maxWidth: "100%", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.fondoInput, flexDirection: "row", alignItems: "center", gap: 5 },
  filtroActivo: { backgroundColor: "#fff0f6", borderColor: colores.rosa },
  filtroTexto: { color: colores.textoSuave, fontSize: 12, flexShrink: 1 },
  filtroTextoActivo: { color: "#b52f61", fontWeight: "600" },
  puntoTag: { width: 8, height: 8, borderRadius: 4 },
  editarFiltros: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 5, minHeight: 44, paddingHorizontal: 8 },
  editarTexto: { color: colores.rosa, fontSize: 12, fontWeight: "600" },
  lapiz: { color: colores.rosa, fontSize: 13, fontWeight: "600" },
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
  pieFijo: { backgroundColor: "#fff8fc", paddingTop: 12, borderTopWidth: 1, borderTopColor: colores.borde },
  addTask: { minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 22, boxShadow: "0px 4px 14px rgba(255,79,139,0.22)" },
  addTaskTexto: { color: colores.blanco, fontSize: 19, fontWeight: "700", letterSpacing: 0.6 },
  motivacion: { borderRadius: 22, padding: 20, borderWidth: 1, borderColor: "#ffd1e1", gap: 10, boxShadow: "0px 4px 16px rgba(255,79,139,0.08)" },
  motivacionEtiqueta: { fontSize: 10, letterSpacing: 2, color: "#bd5b7d", fontWeight: "700" },
  motivacionFrase: { color: "#973e60", fontSize: 21, fontStyle: "italic", lineHeight: 30 },
  motivacionFirma: { color: "#bd7893", fontSize: 12, alignSelf: "flex-end" },
});
