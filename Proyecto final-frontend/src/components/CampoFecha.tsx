import SelectorFecha from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Etiqueta } from "@/components/ui";
import { colores } from "@/tema";
import { fechaLocal } from "@/validacionRegistro";

export type CampoFechaProps = {
  valor: string; onChange: (valor: string) => void; disabled?: boolean;
  etiqueta?: string; minimo?: string; maximo?: string; inicial?: string; permitirQuitar?: boolean;
};
const aFecha = (texto: string) => new Date(`${texto}T12:00:00`);

export default function CampoFecha({ valor, onChange, disabled, etiqueta = "Fecha de entrega:", minimo = "1900-01-01", maximo, inicial, permitirQuitar = false }: CampoFechaProps) {
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState(new Date(2000, 0, 1, 12));
  const abrir = () => {
    const candidato = valor || inicial || fechaLocal(new Date());
    const acotado = maximo && candidato > maximo ? maximo : candidato < minimo ? minimo : candidato;
    setBorrador(aFecha(acotado)); setAbierto(true);
  };
  const selector = <SelectorFecha value={borrador} mode="date" presentation="dialog" locale="es_ES"
    display={Platform.OS === "ios" ? "spinner" : "default"}
    minimumDate={aFecha(minimo)} maximumDate={maximo ? aFecha(maximo) : undefined}
    accentColor={colores.rosa} positiveButton={{ label: "Elegir" }} negativeButton={{ label: "Cancelar" }}
    onDismiss={() => setAbierto(false)} onValueChange={(_, fecha) => {
      setBorrador(fecha);
      if (Platform.OS === "android") { onChange(fechaLocal(fecha)); setAbierto(false); }
    }} />;
  return <View>
    <Etiqueta>{etiqueta}</Etiqueta>
    <Pressable accessibilityRole="button" accessibilityLabel={`Elegir ${etiqueta.replace(/:$/, "")}`} disabled={disabled} onPress={abrir} style={s.campo}>
      <Text style={{ color: valor ? colores.texto : colores.textoSuave }}>{valor ? valor.split("-").reverse().join("/") : "Elegir fecha"}</Text>
    </Pressable>
    {!!valor && permitirQuitar && <Pressable accessibilityRole="button" disabled={disabled} onPress={() => onChange("")}><Text style={s.enlace}>Quitar fecha</Text></Pressable>}
    {abierto && Platform.OS === "android" && selector}
    {Platform.OS === "ios" && <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
      <View style={s.velo}><View style={s.modal}>
        <Text style={s.titulo}>{etiqueta}</Text>{abierto && selector}
        <View style={s.botones}>
          <Pressable accessibilityRole="button" onPress={() => setAbierto(false)}><Text style={s.enlace}>Cancelar</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => { onChange(fechaLocal(borrador)); setAbierto(false); }}><Text style={s.enlace}>Elegir</Text></Pressable>
        </View>
      </View></View>
    </Modal>}
  </View>;
}
const s = StyleSheet.create({
  campo: { padding: 12, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: colores.borde, borderRadius: 12, backgroundColor: colores.fondoInput, minHeight: 48, justifyContent: "center" },
  enlace: { color: colores.rosa, paddingVertical: 10, fontWeight: "bold" },
  velo: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.35)" },
  modal: { backgroundColor: colores.blanco, borderRadius: 20, padding: 16 },
  titulo: { fontSize: 20, color: colores.texto, fontWeight: "bold" },
  botones: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
});
