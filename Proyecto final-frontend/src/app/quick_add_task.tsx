import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { api, type Lista, type Tag } from "@/api";
import CampoFecha from "@/components/CampoFecha";
import SelectorPildoras from "@/components/SelectorPildoras";
import { Aviso, Banner, BotonRosa, Campo, Etiqueta, Pantalla, Tarjeta } from "@/components/ui";
import { colores } from "@/tema";
import { errorFecha, fechaLocal } from "@/validacionRegistro";

export default function QuickAddTask() {
  const { usuarioId = "", usuario = "usuario" } = useLocalSearchParams<{ usuarioId?: string; usuario?: string }>();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(() => fechaLocal(new Date()));
  const [lista, setLista] = useState("");
  const [tag, setTag] = useState("");
  const [listas, setListas] = useState<Lista[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const bloqueo = useRef(false);
  useEffect(() => {
    if (!usuarioId) return;
    let vigente = true;
    Promise.all([api.listas(usuarioId), api.tags(usuarioId)])
      .then(([ls, ts]) => { if (vigente) { setListas(ls); setTags(ts); setLista(ls.find((l) => l.nombre === "General")?.nombre ?? ls[0]?.nombre ?? ""); setError(null); } })
      .catch((e) => { if (vigente) setError(e instanceof Error ? e.message : "No se pudieron cargar las opciones."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [usuarioId, recarga]);
  const volver = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: "/menu", params: { usuarioId, usuario } });
  };
  const guardar = async () => {
    if (bloqueo.current || cargando) return;
    setIntento(true);
    if (!titulo.trim() || errorFecha(fecha)) { setError("Escribe un título y selecciona una fecha válida."); return; }
    bloqueo.current = true; setGuardando(true); setError(null);
    try { await api.crearTarea(usuarioId, { titulo: titulo.trim(), descripcion: descripcion.trim(), fecha, lista, tag, hecha: false }); volver(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo crear la tarea."); }
    finally { bloqueo.current = false; setGuardando(false); }
  };
  if (!usuarioId) return <Pantalla><Aviso error>Inicia sesión para añadir una tarea.</Aviso></Pantalla>;
  return <Pantalla>
    <Banner titulo="Añadir tarea" />
    <Text style={s.ayuda}>Un pequeño paso hacia tus metas.</Text>
    {error && <Aviso error onCerrar={() => setError(null)}>{error}</Aviso>}
    <Tarjeta>
      <Campo etiqueta="Título:" value={titulo} onChangeText={setTitulo} maxLength={120} editable={!guardando} />
      {intento && !titulo.trim() && <Text style={s.error}>El título es obligatorio.</Text>}
      <Campo etiqueta="Descripción:" value={descripcion} onChangeText={setDescripcion} multiline numberOfLines={3} editable={!guardando} />
      <CampoFecha valor={fecha} onChange={setFecha} disabled={guardando} />
      {errorFecha(fecha) && <Text style={s.error}>{errorFecha(fecha)}</Text>}
      <Etiqueta>Lista:</Etiqueta>
      <SelectorPildoras opciones={[{ valor: "", etiqueta: "Sin lista" }, ...listas.map((l) => ({ valor: l.nombre, etiqueta: l.nombre }))]} valor={lista} onChange={setLista} disabled={guardando || cargando} />
      <Etiqueta>Etiqueta:</Etiqueta>
      <SelectorPildoras opciones={[{ valor: "", etiqueta: "Sin etiqueta" }, ...tags.map((t) => ({ valor: t.nombre, etiqueta: t.nombre }))]} valor={tag} onChange={setTag} disabled={guardando || cargando} />
      {cargando && <Text style={s.ayuda}>Cargando listas y etiquetas…</Text>}
      {!cargando && error && !listas.length && !tags.length && <BotonRosa texto="Recargar opciones" onPress={() => { setCargando(true); setRecarga((n) => n + 1); }} />}
      <BotonRosa texto={guardando ? "Guardando…" : "Añadir tarea"} onPress={guardar} disabled={guardando || cargando} />
      <Pressable accessibilityRole="button" onPress={volver} disabled={guardando} style={s.cancelar}><Text style={s.enlace}>Cancelar</Text></Pressable>
    </Tarjeta>
  </Pantalla>;
}
const s = StyleSheet.create({
  ayuda: { color: colores.textoSuave, lineHeight: 21 }, error: { color: "#b4233b", fontSize: 13 },
  cancelar: { alignSelf: "center", minHeight: 44, justifyContent: "center", paddingHorizontal: 20 }, enlace: { color: colores.rosa, fontWeight: "600" },
});
