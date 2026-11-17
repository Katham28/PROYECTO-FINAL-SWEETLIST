import { Pressable, StyleSheet, Text, View } from "react-native";
import { colores } from "@/tema";

export default function SelectorPildoras({ opciones, valor, onChange, disabled = false }: {
  opciones: { valor: string; etiqueta: string }[];
  valor: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
}) {
  return <View style={s.fila}>{opciones.map((opcion) => (
    <Pressable key={opcion.valor} accessibilityRole="radio" accessibilityState={{ checked: valor === opcion.valor, disabled }} disabled={disabled} onPress={() => onChange(opcion.valor)} style={[s.chip, valor === opcion.valor && s.activo]}>
      <Text style={[s.texto, valor === opcion.valor && s.textoActivo]}>{opcion.etiqueta}</Text>
    </Pressable>
  ))}</View>;
}

const s = StyleSheet.create({
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  chip: { minHeight: 44, paddingHorizontal: 13, paddingVertical: 9, justifyContent: "center", borderRadius: 18, borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.fondoInput, maxWidth: "100%" },
  activo: { borderColor: colores.rosa, backgroundColor: colores.rosa },
  texto: { color: colores.texto, fontSize: 14 },
  textoActivo: { color: colores.blanco, fontWeight: "600" },
});
