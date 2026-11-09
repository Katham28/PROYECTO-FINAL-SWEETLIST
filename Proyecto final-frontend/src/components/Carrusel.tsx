import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { colores, sombraRosa } from "@/tema";

const diapositivas = [
  { id: "uno", imagen: require("../../assets/images/carrusel/uno.jpg"), frase: "Keep moving forward." },
  { id: "dos", imagen: require("../../assets/images/carrusel/dos.jpg"), frase: "Discipline beats motivation." },
  { id: "tres", imagen: require("../../assets/images/carrusel/tres.jpg"), frase: "One task at a time." },
  { id: "cuatro", imagen: require("../../assets/images/carrusel/cuatro.jpg"), frase: "Focus. Plan. Achieve." },
  { id: "cinco", imagen: require("../../assets/images/carrusel/cinco.jpg"), frase: "Small steps, big results" },
  { id: "seis", imagen: require("../../assets/images/carrusel/seis.jpg"), frase: "Work smart, not hard" },
];

const ALTO = 240;
const INTERVALO_MS = 5000;

export function Carrusel() {
  const lista = useRef<FlatList<(typeof diapositivas)[number]>>(null);
  const [ancho, setAncho] = useState(0);
  const [indice, setIndice] = useState(0);

  const irA = (i: number) => {
    const n = (i + diapositivas.length) % diapositivas.length;
    lista.current?.scrollToOffset({ offset: n * ancho, animated: true });
    setIndice(n);
  };

  // Avance automático, como data-bs-ride="carousel".
  useEffect(() => {
    if (!ancho) return;
    const t = setTimeout(() => {
      const n = (indice + 1) % diapositivas.length;
      lista.current?.scrollToOffset({ offset: n * ancho, animated: true });
      setIndice(n);
    }, INTERVALO_MS);
    return () => clearTimeout(t);
  }, [ancho, indice]);

  return (
    <View style={estilos.marco} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 && (
        <FlatList
          ref={lista}
          data={diapositivas}
          keyExtractor={(d) => d.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: ancho, offset: ancho * i, index: i })}
          onMomentumScrollEnd={(e) => setIndice(Math.round(e.nativeEvent.contentOffset.x / ancho))}
          renderItem={({ item }) => (
            <View style={{ width: ancho, height: ALTO }}>
              <Image source={item.imagen} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={estilos.leyenda}>
                <Text style={estilos.frase}>{item.frase}</Text>
              </View>
            </View>
          )}
        />
      )}

      <Pressable style={[estilos.flecha, { left: 0 }]} onPress={() => irA(indice - 1)} hitSlop={8}>
        <Text style={estilos.flechaTexto}>‹</Text>
      </Pressable>
      <Pressable style={[estilos.flecha, { right: 0 }]} onPress={() => irA(indice + 1)} hitSlop={8}>
        <Text style={estilos.flechaTexto}>›</Text>
      </Pressable>

      <View style={estilos.puntos}>
        {diapositivas.map((d, i) => (
          <Pressable
            key={d.id}
            onPress={() => irA(i)}
            hitSlop={6}
            style={[estilos.punto, i === indice && { opacity: 1 }]}
          />
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  marco: {
    height: ALTO,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colores.borde,
    boxShadow: sombraRosa,
  },
  leyenda: { position: "absolute", left: 40, right: 40, bottom: 34, alignItems: "center" },
  frase: {
    color: colores.blanco,
    fontSize: 22,
    fontWeight: "500",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  flecha: { position: "absolute", top: 0, bottom: 0, width: 40, justifyContent: "center", alignItems: "center" },
  flechaTexto: {
    color: colores.blanco,
    fontSize: 40,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  puntos: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  punto: { width: 26, height: 3, backgroundColor: colores.blanco, opacity: 0.5 },
});
