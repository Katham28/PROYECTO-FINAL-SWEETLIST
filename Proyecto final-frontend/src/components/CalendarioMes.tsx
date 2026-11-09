import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { aTextoFecha } from "@/datos/ejemplo";
import { colores } from "@/tema";

export type EventoCalendario = { id: number; titulo: string; fecha: string; color: string };

const MESES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DIAS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_POR_DIA = 2;

/** Vista mensual sencilla (equivalente a FullCalendar dayGridMonth). */
export function CalendarioMes({ eventos }: { eventos: EventoCalendario[] }) {
  const [mes, setMes] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });
  const hoy = aTextoFecha(new Date());

  const cambiarMes = (delta: number) =>
    setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1));

  // Celdas: huecos antes del día 1 + días del mes, completando semanas.
  const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas: (Date | null)[] = Array(mes.getDay()).fill(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(mes.getFullYear(), mes.getMonth(), d));
  while (celdas.length % 7 !== 0) celdas.push(null);

  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));

  return (
    <View>
      <View style={estilos.cabecera}>
        <Pressable style={estilos.botonMes} onPress={() => cambiarMes(-1)} hitSlop={6}>
          <Text style={estilos.botonMesTexto}>‹</Text>
        </Pressable>
        <Text style={estilos.titulo}>
          {MESES[mes.getMonth()]} {mes.getFullYear()}
        </Text>
        <Pressable style={estilos.botonMes} onPress={() => cambiarMes(1)} hitSlop={6}>
          <Text style={estilos.botonMesTexto}>›</Text>
        </Pressable>
      </View>

      <View style={estilos.fila}>
        {DIAS.map((d) => (
          <Text key={d} style={estilos.diaSemana}>
            {d}
          </Text>
        ))}
      </View>

      {semanas.map((semana, i) => (
        <View key={i} style={estilos.fila}>
          {semana.map((dia, j) => {
            if (!dia) return <View key={j} style={[estilos.celda, estilos.celdaVacia]} />;
            const fecha = aTextoFecha(dia);
            const delDia = eventos.filter((e) => e.fecha === fecha);
            return (
              <View key={j} style={[estilos.celda, fecha === hoy && estilos.celdaHoy]}>
                <Text style={estilos.numero}>{dia.getDate()}</Text>
                {delDia.slice(0, MAX_POR_DIA).map((e) => (
                  <Text
                    key={e.id}
                    numberOfLines={1}
                    style={[estilos.evento, { backgroundColor: `${e.color}33`, borderColor: e.color }]}
                  >
                    {e.titulo}
                  </Text>
                ))}
                {delDia.length > MAX_POR_DIA && (
                  <Text style={estilos.mas}>+{delDia.length - MAX_POR_DIA}</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  titulo: { fontSize: 20, fontWeight: "bold", color: colores.texto },
  botonMes: {
    backgroundColor: "#2c3e50",
    borderRadius: 6,
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  botonMesTexto: { color: colores.blanco, fontSize: 22, lineHeight: 24 },
  fila: { flexDirection: "row" },
  diaSemana: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 12,
    color: colores.texto,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  celda: {
    flex: 1,
    minHeight: 64,
    padding: 2,
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  celdaVacia: { backgroundColor: "#fafafa" },
  celdaHoy: { backgroundColor: "#fffadf" },
  numero: { fontSize: 11, textAlign: "right", color: colores.texto },
  evento: {
    fontSize: 9,
    color: "#333",
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 2,
    overflow: "hidden",
  },
  mas: { fontSize: 9, color: colores.textoSuave },
});
