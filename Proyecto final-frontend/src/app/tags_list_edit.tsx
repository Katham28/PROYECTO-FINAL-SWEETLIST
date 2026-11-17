import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api, type Lista, type Tag, type Tarea } from "@/api";
import { Aviso, Banner, BotonRosa, Campo, Pantalla, Tarjeta, Ventana } from "@/components/ui";
import { colores } from "@/tema";

type Tipo = "listas" | "tags";
type Elemento = { id?: string; nombre: string; color?: string };
type Borrado = { tipo: Tipo; elemento: Elemento } | { tipo: "tareas"; elemento: Tarea };
const PALETA = ["#ff4f8b", "#8b5cf6", "#3b82f6", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444"];

function FilaNombre({ elemento, tipo, existentes, ocupado, guardar, eliminar }: {
  elemento: Elemento; tipo: Tipo; existentes: Elemento[]; ocupado: boolean;
  guardar: (nombre: string) => Promise<boolean>; eliminar: () => void;
}) {
  const [nombre, setNombre] = useState(elemento.nombre);
  const nuevo = nombre.trim();
  const problema = !nuevo ? "El nombre es obligatorio." : existentes.some((e) => e.nombre !== elemento.nombre && e.nombre === nuevo) ? "Ya existe ese nombre." : null;
  return <View style={s.fila}>
    <View style={s.filaNombre}>
      {tipo === "tags" && <View style={[s.color, { backgroundColor: elemento.color ?? "#cccccc" }]} />}
      <View style={s.campo}><Campo etiqueta={tipo === "listas" ? "Lista:" : "Etiqueta:"} accessibilityLabel={`${tipo === "listas" ? "Lista" : "Etiqueta"} ${elemento.nombre}`} value={nombre} onChangeText={setNombre} maxLength={40} editable={!ocupado} />{problema && <Text style={s.error}>{problema}</Text>}</View>
    </View>
    <View style={s.acciones}>
      <Pressable accessibilityRole="button" disabled={ocupado || !!problema || nuevo === elemento.nombre} onPress={() => guardar(nuevo)} style={[s.guardar, (ocupado || !!problema || nuevo === elemento.nombre) && s.desactivado]}><Text style={s.guardarTexto}>Guardar</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Eliminar ${elemento.nombre}`} disabled={ocupado} onPress={eliminar} style={s.borrar}><Text style={s.borrarTexto}>Eliminar</Text></Pressable>
    </View>
  </View>;
}

function Nuevo({ tipo, ocupado, existentes, crear }: { tipo: Tipo; ocupado: boolean; existentes: Elemento[]; crear: (nombre: string, color: string) => Promise<boolean> }) {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(PALETA[0]);
  const repetido = existentes.some((e) => e.nombre === nombre.trim());
  return <View style={s.nuevo}>
    <Campo etiqueta={tipo === "listas" ? "Nueva lista:" : "Nueva etiqueta:"} value={nombre} onChangeText={setNombre} maxLength={40} editable={!ocupado} />
    {repetido && <Text style={s.error}>Ya existe ese nombre.</Text>}
    {tipo === "tags" && <View style={s.paleta}>{PALETA.map((c) => <Pressable key={c} accessibilityRole="radio" accessibilityLabel={`Color ${c}`} accessibilityState={{ checked: color === c }} disabled={ocupado} onPress={() => setColor(c)} style={[s.muestra, { backgroundColor: c }, color === c && s.seleccionada]}><Text style={s.guardarTexto}>{color === c ? "✓" : ""}</Text></Pressable>)}</View>}
    <BotonRosa texto={tipo === "listas" ? "Añadir lista" : "Añadir etiqueta"} disabled={ocupado || !nombre.trim() || repetido} onPress={async () => { if (await crear(nombre.trim(), color)) setNombre(""); }} />
  </View>;
}

export default function EditarListasTags() {
  const { usuarioId = "", usuario = "usuario" } = useLocalSearchParams<{ usuarioId?: string; usuario?: string }>();
  const [listas, setListas] = useState<Elemento[]>([]);
  const [tags, setTags] = useState<Elemento[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [borrado, setBorrado] = useState<Borrado | null>(null);
  const bloqueo = useRef(false);
  const cargar = useCallback(async (vigente: () => boolean) => {
    if (!usuarioId) return;
    try {
      const [ls, tg, ts] = await Promise.all([api.listas(usuarioId), api.tags(usuarioId), api.tareas(usuarioId)]);
      if (!vigente()) return;
      const lm = new Map<string, Elemento>(ls.map((l) => [l.nombre, l]));
      const tm = new Map<string, Elemento>(tg.map((t) => [t.nombre, t]));
      ts.forEach((t) => {
        if (t.lista && !lm.has(t.lista)) lm.set(t.lista, { nombre: t.lista });
        if (t.tag && !tm.has(t.tag)) tm.set(t.tag, { nombre: t.tag, color: "#cccccc" });
      });
      setListas([...lm.values()]); setTags([...tm.values()]); setTareas(ts); setError(null);
    } catch (e) {
      if (vigente()) setError(e instanceof Error ? e.message : "No se pudieron cargar los datos.");
    } finally { if (vigente()) setCargando(false); }
  }, [usuarioId]);
  useFocusEffect(useCallback(() => {
    let vigente = true;
    void cargar(() => vigente);
    return () => { vigente = false; };
  }, [cargar]));

  const ejecutar = async (accion: () => Promise<void>, exito: string) => {
    if (bloqueo.current) return false;
    bloqueo.current = true; setOcupado(true); setError(null); setMensaje(null);
    try { await accion(); setMensaje(exito); return true; }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar."); return false; }
    finally { bloqueo.current = false; setOcupado(false); }
  };
  const identificar = async (tipo: Tipo, e: Elemento) => {
    if (e.id) return e.id;
    const actuales = tipo === "listas" ? await api.listas(usuarioId) : await api.tags(usuarioId);
    const existente = actuales.find((x) => x.nombre === e.nombre);
    if (existente) return existente.id;
    return tipo === "listas" ? (await api.crearLista(usuarioId, e.nombre)).id : (await api.crearTag(usuarioId, e.nombre, e.color ?? "#cccccc")).id;
  };
  const renombrar = (tipo: Tipo, e: Elemento, nombre: string) => ejecutar(async () => {
    const id = await identificar(tipo, e);
    const actualizado = tipo === "listas" ? await api.editarLista(usuarioId, id, nombre) : await api.editarTag(usuarioId, id, { nombre });
    const actualizar = tipo === "listas" ? setListas : setTags;
    actualizar((xs) => xs.map((x) => x.nombre === e.nombre ? actualizado : x));
    const campo = tipo === "listas" ? "lista" : "tag";
    setTareas((ts) => ts.map((t) => t[campo] === e.nombre ? { ...t, [campo]: nombre } : t));
  }, "Nombre actualizado también en tus tareas.");
  const crear = (tipo: Tipo, nombre: string, color: string) => ejecutar(async () => {
    const nuevo: Lista | Tag = tipo === "listas" ? await api.crearLista(usuarioId, nombre) : await api.crearTag(usuarioId, nombre, color);
    const actualizar = tipo === "listas" ? setListas : setTags;
    actualizar((xs) => [...xs, nuevo]);
  }, tipo === "listas" ? "Lista añadida." : "Etiqueta añadida.");
  const eliminar = async () => {
    if (!borrado) return;
    const b = borrado;
    const ok = await ejecutar(async () => {
      if (b.tipo === "tareas") {
        await api.borrarTarea(usuarioId, b.elemento.id);
        setTareas((ts) => ts.filter((t) => t.id !== b.elemento.id));
      } else {
        const id = await identificar(b.tipo, b.elemento);
        if (b.tipo === "listas") await api.borrarLista(usuarioId, id); else await api.borrarTag(usuarioId, id);
        const actualizar = b.tipo === "listas" ? setListas : setTags;
        actualizar((xs) => xs.filter((x) => x.nombre !== b.elemento.nombre));
        const campo = b.tipo === "listas" ? "lista" : "tag";
        setTareas((ts) => ts.map((t) => t[campo] === b.elemento.nombre ? { ...t, [campo]: "" } : t));
      }
    }, "Eliminado correctamente.");
    setBorrado(null);
    if (!ok) setMensaje(null);
  };
  const volver = () => { if (router.canGoBack()) router.back(); else router.replace({ pathname: "/menu", params: { usuarioId, usuario } }); };
  if (!usuarioId) return <Pantalla><Aviso error>Inicia sesión para administrar tus datos.</Aviso></Pantalla>;
  return <Pantalla>
    <Banner titulo="Tu espacio, a tu manera" />
    <Text style={s.ayuda}>Añade, renombra o elimina listas y etiquetas. También puedes administrar tus tareas aquí.</Text>
    {error && <Aviso error onCerrar={() => setError(null)}>{error}</Aviso>}
    {mensaje && <Aviso onCerrar={() => setMensaje(null)}>{mensaje}</Aviso>}
    {cargando ? <Tarjeta><Text>Cargando…</Text></Tarjeta> : <>
      {(["listas", "tags"] as const).map((tipo) => {
        const elementos = tipo === "listas" ? listas : tags;
        return <Tarjeta key={tipo} titulo={tipo === "listas" ? "Listas" : "Etiquetas"}>
          {!elementos.length && <Text style={s.ayuda}>Todavía no tienes {tipo === "listas" ? "listas" : "etiquetas"}.</Text>}
          {elementos.map((e) => <FilaNombre key={e.id ?? e.nombre} elemento={e} tipo={tipo} existentes={elementos} ocupado={ocupado} guardar={(n) => renombrar(tipo, e, n)} eliminar={() => setBorrado({ tipo, elemento: e })} />)}
          <Nuevo tipo={tipo} ocupado={ocupado} existentes={elementos} crear={(n, c) => crear(tipo, n, c)} />
        </Tarjeta>;
      })}
      <Tarjeta titulo="Tareas">
        {!tareas.length && <Text style={s.ayuda}>Todavía no tienes tareas.</Text>}
        {tareas.map((t) => <View key={t.id} style={s.fila}>
          <Text style={s.tituloTarea}>{t.titulo}</Text><View style={s.acciones}>
            <Pressable accessibilityRole="button" disabled={ocupado} onPress={() => router.push({ pathname: "/task_edit", params: { usuarioId, usuario, tareaId: t.id } })} style={s.guardar}><Text style={s.guardarTexto}>Editar</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={ocupado} onPress={() => setBorrado({ tipo: "tareas", elemento: t })} style={s.borrar}><Text style={s.borrarTexto}>Eliminar</Text></Pressable>
          </View>
        </View>)}
        <BotonRosa texto="Añadir tarea" disabled={ocupado} onPress={() => router.push({ pathname: "/quick_add_task", params: { usuarioId, usuario } })} />
      </Tarjeta>
    </>}
    {error && <BotonRosa texto="Recargar datos" disabled={ocupado} onPress={() => { setCargando(true); void cargar(() => true); }} />}
    <BotonRosa texto="Volver al menú" disabled={ocupado} onPress={volver} />
    <Ventana visible={!!borrado} titulo="¿Eliminar?" mensaje={ocupado ? "Eliminando…" : borrado?.tipo === "tareas" ? "Esta tarea se eliminará. Esta acción no se puede deshacer." : `Se eliminará ${borrado?.elemento.nombre ?? ""}. Sus tareas se conservan y quedan ${borrado?.tipo === "listas" ? "Sin lista" : "Sin etiqueta"}.`} onCerrar={() => { if (!bloqueo.current) setBorrado(null); }} botones={[{ texto: "Cancelar", onPress: () => { if (!bloqueo.current) setBorrado(null); } }, { texto: "Eliminar", peligro: true, onPress: eliminar }]} />
  </Pantalla>;
}
const s = StyleSheet.create({
  ayuda: { color: colores.textoSuave, fontSize: 14, lineHeight: 21 },
  fila: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colores.borde }, filaNombre: { flexDirection: "row", alignItems: "center", gap: 8 },
  campo: { flex: 1, minWidth: 0 }, color: { width: 14, height: 14, borderRadius: 7 },
  acciones: { flexDirection: "row", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" },
  guardar: { backgroundColor: colores.rosa, paddingHorizontal: 14, minHeight: 44, justifyContent: "center", borderRadius: 14 }, guardarTexto: { color: colores.blanco, fontWeight: "600", fontSize: 13 },
  borrar: { paddingHorizontal: 12, minHeight: 44, justifyContent: "center", borderRadius: 14, backgroundColor: "#fff1f2" }, borrarTexto: { color: "#b4233b", fontWeight: "600" },
  desactivado: { opacity: 0.45 }, error: { color: "#b4233b", fontSize: 12, marginBottom: 6 },
  nuevo: { marginTop: 16, padding: 12, borderRadius: 16, backgroundColor: colores.fondoInput },
  paleta: { flexDirection: "row", gap: 6, flexWrap: "wrap" }, muestra: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" }, seleccionada: { borderColor: colores.texto },
  tituloTarea: { fontSize: 15, color: colores.texto, fontWeight: "600", marginBottom: 6 },
});
