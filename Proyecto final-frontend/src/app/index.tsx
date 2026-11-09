import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Carrusel } from "@/components/Carrusel";
import { Aviso, Banner, BotonRosa, Campo, Pantalla, Tarjeta } from "@/components/ui";
import { colores } from "@/tema";

export default function PantallaPrincipal() {
  const [verBienvenida, setVerBienvenida] = useState(true);
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(false);

  // Sin backend todavía: solo se pide que los campos no estén vacíos.
  const iniciarSesion = () => {
    if (!usuario.trim() || !contrasena) {
      setError(true);
      return;
    }
    setError(false);
    router.replace({ pathname: "/menu", params: { usuario: usuario.trim() } });
  };

  return (
    <Pantalla>
      <Banner titulo="SweetList">
        <View style={estilos.insignia}>
          <Text style={estilos.insigniaTexto}>By Alondra Martinez & Katia Carpio</Text>
        </View>
      </Banner>

      {verBienvenida && (
        <Aviso onCerrar={() => setVerBienvenida(false)}>
          <Text style={{ fontWeight: "bold" }}>Hello!</Text> Welcome to SweetList.
        </Aviso>
      )}

      <Carrusel />

      <Tarjeta>
        <Text style={estilos.seccion}>User Management</Text>

        <Tarjeta titulo="Login">
          <Campo
            etiqueta="Username:"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Campo
            etiqueta="Password:"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            onSubmitEditing={iniciarSesion}
          />
          <BotonRosa texto="SUBMIT" onPress={iniciarSesion} />
          {error && <Text style={estilos.error}>Usuario o contraseña incorrectos.</Text>}
        </Tarjeta>

        <View style={{ height: 16 }} />

        <Tarjeta titulo="Administration">
          <BotonRosa texto="Create user" onPress={() => router.push("/crear-usuario")} />
          <Text style={estilos.ayuda}>Create your own account</Text>
        </Tarjeta>
      </Tarjeta>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  insignia: { backgroundColor: "#6c757d", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  insigniaTexto: { color: colores.blanco, fontSize: 12, fontWeight: "bold" },
  seccion: { fontSize: 28, fontWeight: "500", color: colores.texto, marginBottom: 12 },
  error: { color: "#dc3545", textAlign: "center", marginTop: 8 },
  ayuda: { color: "#6c757d", textAlign: "center", marginTop: 12 },
});
