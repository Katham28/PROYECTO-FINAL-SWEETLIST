import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";

import { colores, degradadoRosa } from "@/tema";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerTintColor: colores.blanco,
          headerBackTitle: "Atrás",
          headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
          headerBackground: () => (
            <LinearGradient
              colors={degradadoRosa}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ),
        }}
      >
        <Stack.Screen name="index" options={{ title: "Inicio" }} />
        <Stack.Screen name="crear-usuario" options={{ title: "Crear cuenta" }} />
        <Stack.Screen name="pomodoro" options={{ title: "Pomodoro" }} />
        <Stack.Screen name="tags_list_edit" options={{ title: "Editar listas y etiquetas" }} />
        <Stack.Screen name="task_edit" options={{ title: "Editar tarea" }} />
        <Stack.Screen name="quick_add_task" options={{ title: "Añadir tarea" }} />
        <Stack.Screen
          name="menu"
          options={{ title: "SweetList", headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}
