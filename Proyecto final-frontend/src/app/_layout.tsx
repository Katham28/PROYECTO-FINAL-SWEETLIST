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
        <Stack.Screen name="index" options={{ title: "SweetList-Main" }} />
        <Stack.Screen name="crear-usuario" options={{ title: "SweetList-Users" }} />
        <Stack.Screen
          name="menu"
          options={{ title: "SweetList", headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}
