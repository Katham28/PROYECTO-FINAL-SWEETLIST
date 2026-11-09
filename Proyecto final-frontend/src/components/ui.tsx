import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { colores, degradadoRosa, sombraRosa } from "@/tema";

/** Fondo rosa degradado con scroll, igual al body de p1.css. */
export function Pantalla({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={[colores.fondoArriba, colores.fondoAbajo]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </LinearGradient>
  );
}

/** Banner grande (#banner). */
export function Banner({
  titulo,
  colorFinal = colores.rosa,
  children,
}: {
  titulo: string;
  colorFinal?: string;
  children?: ReactNode;
}) {
  return (
    <LinearGradient
      colors={[colores.rosaClaro, colorFinal]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={estilos.banner}
    >
      <Text style={estilos.bannerTitulo}>{titulo}</Text>
      {children}
    </LinearGradient>
  );
}

/** Banner pequeño (#mini_banner). */
export function MiniBanner({ titulo }: { titulo: string }) {
  return (
    <LinearGradient
      colors={[colores.rosaPastel, colores.rosaClaro]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={estilos.miniBanner}
    >
      <Text style={estilos.miniBannerTitulo}>{titulo}</Text>
    </LinearGradient>
  );
}

/** Aviso rosa (.girly-alert). */
export function Aviso({
  children,
  error = false,
  onCerrar,
}: {
  children: ReactNode;
  error?: boolean;
  onCerrar?: () => void;
}) {
  return (
    <LinearGradient
      colors={error ? ["#ff4f4f", colores.error] : degradadoRosa}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={estilos.aviso}
    >
      <Text style={estilos.avisoTexto}>{children}</Text>
      {onCerrar && (
        <Pressable onPress={onCerrar} hitSlop={10} style={estilos.avisoCerrar}>
          <Text style={estilos.avisoTexto}>✕</Text>
        </Pressable>
      )}
    </LinearGradient>
  );
}

/** Tarjeta blanca (#mini_page, #s_create, .girly-fields). */
export function Tarjeta({ children, titulo }: { children: ReactNode; titulo?: string }) {
  return (
    <View style={estilos.tarjeta}>
      {titulo && <Text style={estilos.tarjetaTitulo}>{titulo}</Text>}
      {children}
    </View>
  );
}

/** Botón píldora con degradado (.button). */
export function BotonRosa({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [estilos.botonContenedor, pressed && { transform: [{ scale: 1.05 }] }]}
    >
      <LinearGradient
        colors={degradadoRosa}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.boton}
      >
        <Text style={estilos.botonTexto}>{texto}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Etiqueta + campo de texto con el estilo de los inputs. */
export function Campo({ etiqueta, style, ...props }: TextInputProps & { etiqueta: string }) {
  return (
    <View>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        placeholderTextColor={colores.textoSuave}
        style={[estilos.input, props.multiline && { minHeight: 96, textAlignVertical: "top" }, style]}
        {...props}
      />
    </View>
  );
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return <Text style={estilos.etiqueta}>{children}</Text>;
}

/** Radio o checkbox rosa. */
export function Opcion({
  texto,
  activa,
  onPress,
  tipo = "checkbox",
}: {
  texto: string;
  activa: boolean;
  onPress: () => void;
  tipo?: "checkbox" | "radio";
}) {
  return (
    <Pressable onPress={onPress} style={estilos.opcion} hitSlop={4}>
      <View
        style={[
          estilos.marca,
          tipo === "radio" && { borderRadius: 10 },
          activa && { backgroundColor: colores.rosa, borderColor: colores.rosa },
        ]}
      >
        {activa && <Text style={estilos.marcaCheck}>{tipo === "radio" ? "●" : "✓"}</Text>}
      </View>
      <Text style={estilos.opcionTexto}>{texto}</Text>
    </Pressable>
  );
}

/** Caja con borde rosa que agrupa opciones (.radio-group / .checkbox-group). */
export function Grupo({ children, horizontal = false }: { children: ReactNode; horizontal?: boolean }) {
  return (
    <View style={[estilos.grupo, horizontal && { flexDirection: "row", flexWrap: "wrap" }]}>
      {children}
    </View>
  );
}

/** Ventana emergente (modal de Bootstrap). */
export function Ventana({
  visible,
  titulo,
  mensaje,
  onCerrar,
  botones,
}: {
  visible: boolean;
  titulo: string;
  mensaje: string;
  onCerrar: () => void;
  botones: { texto: string; onPress: () => void; peligro?: boolean }[];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={estilos.velo} onPress={onCerrar}>
        <Pressable style={estilos.ventana}>
          <View style={estilos.ventanaCabecera}>
            <Text style={estilos.ventanaTitulo}>{titulo}</Text>
            <Pressable onPress={onCerrar} hitSlop={10}>
              <Text style={{ fontSize: 18, color: colores.textoSuave }}>✕</Text>
            </Pressable>
          </View>
          <Text style={estilos.ventanaMensaje}>{mensaje}</Text>
          <View style={estilos.ventanaPie}>
            {botones.map((b) => (
              <Pressable
                key={b.texto}
                onPress={b.onPress}
                style={[estilos.ventanaBoton, { backgroundColor: b.peligro ? "#dc3545" : "#6c757d" }]}
              >
                <Text style={{ color: colores.blanco, fontWeight: "600" }}>{b.texto}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, paddingBottom: 48, gap: 16 },
  banner: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
    boxShadow: "0px 8px 25px rgba(255, 105, 180, 0.4)",
  },
  bannerTitulo: {
    color: colores.blanco,
    fontSize: 40,
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
  },
  miniBanner: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    boxShadow: "0px 4px 12px rgba(255, 105, 180, 0.25)",
  },
  miniBannerTitulo: { color: colores.blanco, fontSize: 22, fontWeight: "bold", letterSpacing: 1 },
  aviso: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avisoTexto: { color: colores.blanco, textAlign: "center", fontSize: 15 },
  avisoCerrar: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 20,
    padding: 20,
    gap: 4,
    boxShadow: sombraRosa,
  },
  tarjetaTitulo: {
    fontSize: 24,
    fontWeight: "600",
    color: colores.texto,
    textAlign: "center",
    marginBottom: 8,
  },
  botonContenedor: { alignSelf: "center", marginTop: 8 },
  boton: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 25,
    boxShadow: "0px 4px 15px rgba(255, 105, 180, 0.4)",
  },
  botonTexto: { color: colores.blanco, fontSize: 20 },
  etiqueta: { color: colores.texto, fontSize: 15, marginTop: 4 },
  input: {
    padding: 10,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colores.borde,
    borderRadius: 15,
    fontSize: 14,
    backgroundColor: colores.fondoInput,
    color: colores.texto,
  },
  opcion: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  marca: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colores.borde,
    backgroundColor: colores.blanco,
    alignItems: "center",
    justifyContent: "center",
  },
  marcaCheck: { color: colores.blanco, fontSize: 12, fontWeight: "bold", lineHeight: 14 },
  opcionTexto: { color: colores.texto, fontSize: 15 },
  grupo: {
    gap: 8,
    columnGap: 16,
    backgroundColor: colores.fondoInput,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colores.borde,
    marginTop: 6,
    marginBottom: 10,
  },
  velo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  ventana: { backgroundColor: colores.blanco, borderRadius: 12, overflow: "hidden" },
  ventanaCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  ventanaTitulo: { fontSize: 19, fontWeight: "500", color: "#212529", flex: 1 },
  ventanaMensaje: { padding: 16, fontSize: 16, color: "#212529" },
  ventanaPie: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
  ventanaBoton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
});
