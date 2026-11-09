import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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
import { listasEjemplo, tagsEjemplo, tareasEjemplo, type Tarea } from "@/datos/ejemplo";
import { colores } from "@/tema";

export default function MenuPrincipal() {
  const { usuario = "user" } = useLocalSearchParams<{ usuario?: string }>();

  const [tareas, setTareas] = useState<Tarea[]>(tareasEjemplo);
  const [listasActivas, setListasActivas] = useState<string[]>(listasEjemplo);
  const [tagsActivos, setTagsActivos] = useState<string[]>(tagsEjemplo.map((t) => t.nombre));
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  // Quick Add Task
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [tagNuevo, setTagNuevo] = useState(tagsEjemplo[0].nombre);
  const [listaNueva, setListaNueva] = useState(listasEjemplo[0]);
  const [agregada, setAgregada] = useState(false);

  const colorDeTag = (nombre: string) =>
    tagsEjemplo.find((t) => t.nombre === nombre)?.color ?? "#cccccc";

  const alternar = (lista: string[], valor: string) =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

  const visibles = tareas.filter((t) => tagsActivos.includes(t.tag) && listasActivas.includes(t.lista));

  const agregarTarea = () => {
    if (!titulo.trim()) return;
    setTareas([
      ...tareas,
      {
        id: Date.now(),
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha,
        tag: tagNuevo,
        lista: listaNueva,
        hecha: false,
      },
    ]);
    setTitulo("");
    setDescripcion("");
    setFecha("");
    setAgregada(true);
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

      <Tarjeta>
        <Text style={estilos.subtitulo}>List selection</Text>
        {listasEjemplo.map((l) => (
          <Opcion
            key={l}
            texto={l}
            activa={listasActivas.includes(l)}
            onPress={() => setListasActivas(alternar(listasActivas, l))}
          />
        ))}

        <View style={estilos.separador} />

        <Text style={estilos.subtitulo}>Filter by tag</Text>
        {tagsEjemplo.map((t) => (
          <Opcion
            key={t.nombre}
            texto={t.nombre}
            activa={tagsActivos.includes(t.nombre)}
            onPress={() => setTagsActivos(alternar(tagsActivos, t.nombre))}
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
        <Chips opciones={tagsEjemplo.map((t) => t.nombre)} valor={tagNuevo} onChange={setTagNuevo} />
        <Etiqueta>List:</Etiqueta>
        <Chips opciones={listasEjemplo} valor={listaNueva} onChange={setListaNueva} />
        <BotonRosa texto="ADD" onPress={agregarTarea} />
      </Tarjeta>

      <Tarjeta>
        <Text style={estilos.subtitulo}>Task View</Text>
        {tareas.length === 0 ? (
          <Text style={estilos.vacio}>No hay tasks</Text>
        ) : visibles.length === 0 ? (
          <Text style={estilos.vacio}>No hay coincidencias</Text>
        ) : (
          visibles.map((t) => {
            const color = colorDeTag(t.tag);
            return (
              <View key={t.id} style={[estilos.tarea, { backgroundColor: `${color}33`, borderLeftColor: colores.rosa }]}>
                <Opcion
                  texto=""
                  activa={t.hecha}
                  onPress={() =>
                    setTareas(tareas.map((x) => (x.id === t.id ? { ...x, hecha: !x.hecha } : x)))
                  }
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={estilos.tareaCabecera}>
                    <Text style={[estilos.tareaTitulo, t.hecha && estilos.hecha]}>{t.titulo}</Text>
                    {!!t.fecha && <Text style={estilos.tareaFecha}>{t.fecha}</Text>}
                  </View>
                  {!!t.descripcion && <Text style={estilos.tareaDescripcion}>{t.descripcion}</Text>}
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <Text style={[estilos.insignia, { backgroundColor: `${color}dd` }]}>{t.tag}</Text>
                    <Text style={[estilos.insignia, { backgroundColor: "#e0e0e0", color: "#555" }]}>{t.lista}</Text>
                  </View>
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
  tareaFecha: { color: "#6c757d", fontSize: 12 },
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
