import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api";
import { Carrusel } from "@/components/Carrusel";
import { Aviso, Banner, BotonRosa, Campo, Pantalla, Tarjeta } from "@/components/ui";
import { colores } from "@/tema";

export default function PantallaPrincipal() {
  const [verBienvenida, setVerBienvenida] = useState(true);
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async () => {
    if (cargando) return;
    if (!usuario.trim() || !contrasena) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    setCargando(true);
    try {
      const u = await api.login(usuario.trim(), contrasena);
      setError(null);
      setContrasena("");
      router.replace({ pathname: "/menu", params: { usuarioId: u.id, usuario: u.usuario } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Pantalla>
      <Banner titulo="SweetList">
        <View style={estilos.insignia}>
          <Text style={estilos.insigniaTexto}>Alondra Martinez & Katia Carpio & Isai Candelario</Text>
        </View>
      </Banner>

      {verBienvenida && (
        <Aviso onCerrar={() => setVerBienvenida(false)}>
          <Text style={{ fontWeight: "bold" }}>¡Hola!</Text> Te damos la bienvenida a SweetList.
        </Aviso>
      )}

      <Carrusel />

      <Tarjeta>
        <Text style={estilos.seccion}>Gestión de usuarios</Text>

        <Tarjeta titulo="Iniciar sesión">
          <Campo
            etiqueta="Usuario:"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Campo
            etiqueta="Contraseña:"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            onSubmitEditing={iniciarSesion}
          />
          <BotonRosa texto={cargando ? "Iniciando sesión…" : "Iniciar sesión"} onPress={iniciarSesion} />
          {error && <Text style={estilos.error}>{error}</Text>}
        </Tarjeta>

        <View style={{ height: 16 }} />

        <Tarjeta titulo="Registro">
          <BotonRosa texto="Crear cuenta" onPress={() => router.push("/crear-usuario")} />
          <Text style={estilos.ayuda}>Crea tu propia cuenta</Text>
        </Tarjeta>
      </Tarjeta>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  insignia: { backgroundColor: "#6c757d", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  insigniaTexto: { color: colores.blanco, fontSize: 12, fontWeight: "bold", textAlign: "center", lineHeight: 18 },
  seccion: { fontSize: 28, fontWeight: "500", color: colores.texto, marginBottom: 12 },
  error: { color: "#dc3545", textAlign: "center", marginTop: 8 },
  ayuda: { color: "#6c757d", textAlign: "center", marginTop: 12 },
});
