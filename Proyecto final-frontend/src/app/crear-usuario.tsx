import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Aviso,
  Banner,
  BotonRosa,
  Campo,
  Etiqueta,
  Grupo,
  Opcion,
  Pantalla,
  Tarjeta,
  Ventana,
} from "@/components/ui";
import { colores } from "@/tema";

type Genero = "MALE" | "FEMALE" | "OTHER";
type Estilo = "Light" | "Dark" | "Colored";

const PALETA = ["#ff4f8b", "#ff7eb3", "#e83e8c", "#6f42c1", "#007bff", "#20c997", "#28a745", "#ffc107", "#fd7e14", "#000000"];

export default function CrearUsuario() {
  const [nombre, setNombre] = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [cumpleanos, setCumpleanos] = useState("");
  const [color, setColor] = useState(PALETA[0]);
  const [genero, setGenero] = useState<Genero>("MALE");
  const [otroGenero, setOtroGenero] = useState("");

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [estilo, setEstilo] = useState<Estilo>("Light");
  const [listaDefault, setListaDefault] = useState(false);
  const [tagsDefault, setTagsDefault] = useState(false);
  const [frase, setFrase] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState(false);

  // Sin backend todavía: solo validaciones locales.
  const enviar = () => {
    if (!usuario.trim() || !contrasena) {
      setError("Username and password are required.");
    } else if (contrasena !== confirmacion) {
      setError("Passwords do not match.");
    } else if (cumpleanos && !/^\d{4}-\d{2}-\d{2}$/.test(cumpleanos)) {
      setError("Birthday must be YYYY-MM-DD.");
    } else {
      setError(null);
      setCreado(true);
    }
  };

  return (
    <Pantalla>
      <Banner titulo="SweetList" />

      {creado && <Aviso>User created successfully!</Aviso>}
      {error && <Aviso error>{error}</Aviso>}

      <Tarjeta>
        <Text style={estilos.titulo}>Create User</Text>

        <Campo etiqueta="Name:" value={nombre} onChangeText={setNombre} />
        <Campo etiqueta="Second Name:" value={segundoNombre} onChangeText={setSegundoNombre} />
        <Campo etiqueta="First Last Name:" value={primerApellido} onChangeText={setPrimerApellido} />
        <Campo etiqueta="Second Last Name:" value={segundoApellido} onChangeText={setSegundoApellido} />
        <Campo
          etiqueta="Birthday:"
          value={cumpleanos}
          onChangeText={setCumpleanos}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />

        <Etiqueta>Color:</Etiqueta>
        <View style={estilos.paleta}>
          {PALETA.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[estilos.muestra, { backgroundColor: c }, color === c && estilos.muestraActiva]}
            />
          ))}
        </View>

        <Etiqueta>Gender:</Etiqueta>
        <Grupo horizontal>
          <Opcion tipo="radio" texto="Male" activa={genero === "MALE"} onPress={() => setGenero("MALE")} />
          <Opcion tipo="radio" texto="Female" activa={genero === "FEMALE"} onPress={() => setGenero("FEMALE")} />
          <Opcion tipo="radio" texto="Other" activa={genero === "OTHER"} onPress={() => setGenero("OTHER")} />
        </Grupo>
        {genero === "OTHER" && (
          <Campo etiqueta="" value={otroGenero} onChangeText={setOtroGenero} placeholder="Specify..." />
        )}

        <View style={estilos.separador} />

        <Campo
          etiqueta="Username:"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Campo etiqueta="Password:" value={contrasena} onChangeText={setContrasena} secureTextEntry />
        <Campo etiqueta="Confirm password:" value={confirmacion} onChangeText={setConfirmacion} secureTextEntry />

        <Etiqueta>Style:</Etiqueta>
        <View style={estilos.estilos}>
          {(["Light", "Dark", "Colored"] as const).map((e) => (
            <Pressable
              key={e}
              onPress={() => setEstilo(e)}
              style={[estilos.estiloOpcion, estilo === e && estilos.estiloActivo]}
            >
              <Text style={[estilos.estiloTexto, estilo === e && { color: colores.blanco }]}>{e}</Text>
            </Pressable>
          ))}
        </View>

        <Etiqueta>Default settings:</Etiqueta>
        <Grupo>
          <Opcion texto="Default list" activa={listaDefault} onPress={() => setListaDefault(!listaDefault)} />
          <Opcion texto="Default tags" activa={tagsDefault} onPress={() => setTagsDefault(!tagsDefault)} />
        </Grupo>

        <Campo etiqueta="Motivational phrase:" value={frase} onChangeText={setFrase} multiline numberOfLines={4} />

        <BotonRosa texto="SUBMIT" onPress={enviar} />
      </Tarjeta>

      <Ventana
        visible={creado}
        titulo="User CRUD"
        mensaje="User created!"
        onCerrar={() => setCreado(false)}
        botones={[{ texto: "Close", peligro: true, onPress: () => router.back() }]}
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 28, fontWeight: "500", color: colores.texto, marginBottom: 8 },
  separador: { height: 1, backgroundColor: colores.borde, marginVertical: 12 },
  paleta: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6, marginBottom: 10 },
  muestra: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colores.blanco },
  muestraActiva: { borderColor: colores.texto, transform: [{ scale: 1.15 }] },
  estilos: { flexDirection: "row", gap: 8, marginTop: 6, marginBottom: 10 },
  estiloOpcion: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colores.borde,
    backgroundColor: colores.fondoInput,
    alignItems: "center",
  },
  estiloActivo: { backgroundColor: colores.rosa, borderColor: colores.rosa },
  estiloTexto: { color: colores.texto, fontSize: 14 },
});
