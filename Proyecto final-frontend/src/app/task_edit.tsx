import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { api, tiempoBonito, type Lista, type Tag, type Tarea } from "@/api";
import CampoFecha from "@/components/CampoFecha";
import SelectorPildoras from "@/components/SelectorPildoras";
import { Aviso, Banner, BotonRosa, Campo, Etiqueta, Opcion, Pantalla, Tarjeta } from "@/components/ui";
import { colores } from "@/tema";
import { errorFecha } from "@/validacionRegistro";

export default function EditarTarea() {
  const { usuarioId = "", tareaId = "", usuario = "usuario" } = useLocalSearchParams<{ usuarioId?: string; tareaId?: string; usuario?: string }>();
  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [listas, setListas] = useState<Lista[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [lista, setLista] = useState("General");
  const [tag, setTag] = useState("");
  const [hecha, setHecha] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const bloqueo = useRef(false);

  useEffect(() => {
    let vigente = true;
    if (!usuarioId || !tareaId) return;
    Promise.all([api.tarea(usuarioId, tareaId), api.listas(usuarioId), api.tags(usuarioId)])
      .then(([t, ls, tg]) => {
        if (!vigente) return;
        setTarea(t); setTitulo(t.titulo); setDescripcion(t.descripcion); setFecha(t.fecha);
        setLista(t.lista); setTag(t.tag); setHecha(t.hecha); setListas(ls); setTags(tg); setError(null);
      })
      .catch((e) => { if (vigente) setError(e instanceof Error ? e.message : "No se pudo cargar la tarea."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [usuarioId, tareaId, recarga]);

  const volver = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: "/menu", params: { usuarioId, usuario } });
  };
  const fechaValida = errorFecha(fecha) === null;
  const tituloValido = !!titulo.trim() && titulo.trim().length <= 120;
  const opcionesLista = [...new Set(["", ...listas.map((l) => l.nombre), tarea?.lista ?? ""])];
  const opcionesTag = [...new Set([...tags.map((t) => t.nombre), tarea?.tag ?? ""])].filter(Boolean);

  const guardar = async () => {
    if (!tarea || bloqueo.current) return;
    setIntento(true);
    if (!tituloValido || !fechaValida) { setError("Revisa el título, la fecha y la lista."); return; }
    bloqueo.current = true;
    setGuardando(true);
    setError(null);
    try {
      await api.editarTarea(usuarioId, tarea.id, { titulo: titulo.trim(), descripcion: descripcion.trim(), fecha, lista, tag, hecha });
      volver();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron guardar los cambios.");
    } finally { bloqueo.current = false; setGuardando(false); }
  };

  if (!usuarioId || !tareaId) return <Pantalla><Aviso error>Falta seleccionar la tarea que quieres editar.</Aviso></Pantalla>;
  return <Pantalla>
    <Banner titulo="Editar tarea" />
    {error && <Aviso error onCerrar={() => setError(null)}>{error}</Aviso>}
    {cargando ? <Tarjeta><Text>Cargando tarea…</Text></Tarjeta> : !tarea ? <Tarjeta>
      <Text>No se pudo abrir la tarea.</Text>
      <BotonRosa texto="Reintentar" onPress={() => { setCargando(true); setRecarga((n) => n + 1); }} />
    </Tarjeta> : <Tarjeta>
      <Campo etiqueta="Título:" accessibilityLabel="Título de la tarea" value={titulo} onChangeText={setTitulo} maxLength={120} editable={!guardando} />
      {intento && !tituloValido && <Text style={s.error}>Escribe un título de 1 a 120 caracteres.</Text>}
      <Campo etiqueta="Descripción:" value={descripcion} onChangeText={setDescripcion} multiline numberOfLines={3} editable={!guardando} />
      <CampoFecha valor={fecha} onChange={setFecha} disabled={guardando} />
      {(intento || fecha.length === 10) && !fechaValida && <Text style={s.error}>Usa una fecha real con formato YYYY-MM-DD.</Text>}
      <Etiqueta>Lista:</Etiqueta>
      <SelectorPildoras opciones={opcionesLista.map((l) => ({ valor: l, etiqueta: l || "Sin lista" }))} valor={lista} onChange={setLista} disabled={guardando} />
      <Etiqueta>Etiqueta:</Etiqueta>
      <SelectorPildoras opciones={[{ valor: "", etiqueta: "Sin etiqueta" }, ...opcionesTag.map((t) => ({ valor: t, etiqueta: t }))]} valor={tag} onChange={setTag} disabled={guardando} />
      <Opcion texto="Tarea completada" activa={hecha} onPress={() => !guardando && setHecha(!hecha)} />
      <Text style={s.contadores}>{tarea.pomodoros ?? 0} pomodoros · {tiempoBonito(tarea.segundos_invertidos ?? 0)}</Text>
      <Text style={s.ayuda}>Tus pomodoros y tu tiempo invertido se conservan al editar.</Text>
      <BotonRosa texto={guardando ? "Guardando…" : "Guardar cambios"} onPress={guardar} disabled={guardando} />
      <Pressable accessibilityRole="button" onPress={volver} disabled={guardando} style={s.cancelar}><Text style={s.enlace}>Cancelar</Text></Pressable>
    </Tarjeta>}
  </Pantalla>;
}

const s = StyleSheet.create({
  error: { color: "#b4233b", fontSize: 13 },
  ayuda: { color: colores.textoSuave, fontSize: 13, marginBottom: 8 },
  contadores: { color: colores.rosa, fontWeight: "600", marginTop: 12, marginBottom: 4 },
  cancelar: { alignSelf: "center", minHeight: 44, justifyContent: "center", paddingHorizontal: 20 },
  enlace: { color: colores.rosa, fontWeight: "600" },
});
