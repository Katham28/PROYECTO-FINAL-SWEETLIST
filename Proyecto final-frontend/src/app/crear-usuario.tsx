import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api, ErrorApi, type Genero } from "@/api";
import CampoCumpleanos from "@/components/CampoCumpleanos";
import { Aviso, Banner, BotonRosa, Campo, Etiqueta, Grupo, Opcion, Pantalla, Tarjeta, Ventana } from "@/components/ui";
import { colores } from "@/tema";
import { errorContrasena, errorCumpleanos, errorNombre, USUARIO_RE } from "@/validacionRegistro";

const PALETA = ["#ff4f8b", "#ff7eb3", "#e83e8c", "#6f42c1", "#007bff", "#20c997", "#28a745", "#ffc107", "#fd7e14", "#000000"];
type Consulta = { usuario: string; estado: "libre" | "ocupado" | "error" };

function Mensaje({ texto, correcto = false }: { texto: string; correcto?: boolean }) {
  return <Text accessibilityLiveRegion="polite" style={[s.ayuda, { color: correcto ? "#227b50" : "#b4233b" }]}>{texto}</Text>;
}

export default function CrearUsuario() {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cumpleanos, setCumpleanos] = useState("");
  const [color, setColor] = useState(PALETA[0]);
  const [genero, setGenero] = useState<Genero>("MALE");
  const [otroGenero, setOtroGenero] = useState("");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [frase, setFrase] = useState("");
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [intento, setIntento] = useState(false);
  const [reintento, setReintento] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const enviando = useRef(false);

  const usuarioNormal = usuario.trim().toLowerCase();
  const usuarioValido = USUARIO_RE.test(usuarioNormal);
  const estadoUsuario = !usuarioValido ? "invalido" : consulta?.usuario === usuarioNormal ? consulta.estado : "consultando";
  const problemas = {
    nombre: errorNombre(nombre),
    apellidos: errorNombre(apellidos, 120),
    cumpleanos: errorCumpleanos(cumpleanos),
    usuario: usuarioValido ? null : "Usa de 3 a 50 letras sin acentos, números, puntos, guiones o guion bajo.",
    contrasena: errorContrasena(contrasena),
    confirmacion: !confirmacion ? "Confirma tu contraseña." : contrasena !== confirmacion ? "Las contraseñas no coinciden." : null,
  };
  const valido = Object.values(problemas).every((e) => e === null);

  // Espera 450 ms al dejar de escribir. Ignora respuestas de consultas anteriores.
  useEffect(() => {
    if (!USUARIO_RE.test(usuarioNormal)) return;
    let vigente = true;
    const controlador = new AbortController();
    const temporizador = setTimeout(() => {
      api.disponibilidadUsuario(usuarioNormal, controlador.signal)
        .then((r) => { if (vigente) setConsulta({ usuario: usuarioNormal, estado: r.disponible ? "libre" : "ocupado" }); })
        .catch(() => { if (vigente) setConsulta({ usuario: usuarioNormal, estado: "error" }); });
    }, 450);
    return () => { vigente = false; clearTimeout(temporizador); controlador.abort(); };
  }, [usuarioNormal, reintento]);

  const enviar = async () => {
    if (enviando.current || creado) return;
    setIntento(true);
    setError(null);
    if (!valido) { setError("Revisa los campos señalados antes de continuar."); return; }
    if (estadoUsuario === "ocupado") { setError("Ese nombre de usuario ya existe. Elige otro."); return; }
    enviando.current = true;
    setCargando(true);
    try {
      // La disponibilidad también se vuelve a verificar al guardar (la API garantiza la unicidad).
      await api.crearUsuario({
        nombre: nombre.trim(), apellidos: apellidos.trim(), cumpleanos: cumpleanos || null,
        color, genero, otro_genero: genero === "OTHER" ? otroGenero.trim() : "",
        usuario: usuarioNormal, contrasena, confirmar_contrasena: confirmacion,
        lista_default: true, tags_default: true, frase: frase.trim(),
      });
      setContrasena("");
      setConfirmacion("");
      setCreado(true);
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 409) setConsulta({ usuario: usuarioNormal, estado: "ocupado" });
      setError(e instanceof Error ? e.message : "No se pudo crear el usuario.");
    } finally {
      enviando.current = false;
      setCargando(false);
    }
  };

  return (
    <Pantalla>
      <Banner titulo="SweetList" />
      {error && <Aviso error onCerrar={() => setError(null)}>{error}</Aviso>}
      <Tarjeta>
        <Text style={s.titulo}>Crear cuenta</Text>
        <Text style={s.intro}>Tus datos, tus metas y un poquito de motivación.</Text>
        <Campo etiqueta="Nombre(s):" accessibilityLabel="Nombre(s)" value={nombre} onChangeText={setNombre} editable={!cargando} maxLength={100} autoCapitalize="words" autoComplete="given-name" style={(nombre || intento) && problemas.nombre ? s.invalido : undefined} />
        {(nombre || intento) && problemas.nombre && <Mensaje texto={problemas.nombre} />}
        <Campo etiqueta="Apellido(s):" accessibilityLabel="Apellido(s)" value={apellidos} onChangeText={setApellidos} editable={!cargando} maxLength={120} autoCapitalize="words" autoComplete="family-name" style={(apellidos || intento) && problemas.apellidos ? s.invalido : undefined} />
        {(apellidos || intento) && problemas.apellidos && <Mensaje texto={problemas.apellidos} />}
        <CampoCumpleanos valor={cumpleanos} onChange={setCumpleanos} disabled={cargando} />
        {problemas.cumpleanos && <Mensaje texto={problemas.cumpleanos} />}
        <Etiqueta>Color:</Etiqueta>
        <View style={s.paleta}>
          {PALETA.map((c) => <Pressable key={c} accessibilityRole="radio" accessibilityLabel={`Color ${c}`} accessibilityState={{ checked: color === c }} disabled={cargando} onPress={() => setColor(c)} style={[s.muestra, { backgroundColor: c }, color === c && s.muestraActiva]}><Text style={s.check}>{color === c ? "✓" : ""}</Text></Pressable>)}
        </View>
        <Etiqueta>Género:</Etiqueta>
        <Grupo horizontal>
          <Opcion tipo="radio" texto="Masculino" activa={genero === "MALE"} onPress={() => !cargando && setGenero("MALE")} />
          <Opcion tipo="radio" texto="Femenino" activa={genero === "FEMALE"} onPress={() => !cargando && setGenero("FEMALE")} />
          <Opcion tipo="radio" texto="Otro" activa={genero === "OTHER"} onPress={() => !cargando && setGenero("OTHER")} />
        </Grupo>
        {genero === "OTHER" && <Campo etiqueta="¿Cómo te identificas? (opcional):" value={otroGenero} onChangeText={setOtroGenero} editable={!cargando} maxLength={60} />}
        <View style={s.separador} />
        <Campo etiqueta="Usuario:" accessibilityLabel="Usuario" value={usuario} onChangeText={(v) => { setUsuario(v); if (v.trim().toLowerCase() !== usuarioNormal) setConsulta(null); }} editable={!cargando} maxLength={50} autoCapitalize="none" autoCorrect={false} autoComplete="username-new" style={(usuario || intento) && (problemas.usuario || estadoUsuario === "ocupado") ? s.invalido : undefined} />
        {(usuario || intento) && problemas.usuario && <Mensaje texto={problemas.usuario} />}
        {estadoUsuario === "consultando" && <Text accessibilityLiveRegion="polite" style={s.ayuda}>Comprobando disponibilidad…</Text>}
        {estadoUsuario === "libre" && <Mensaje correcto texto="Usuario disponible." />}
        {estadoUsuario === "ocupado" && <Mensaje texto="Ese usuario ya existe. Elige otro." />}
        {estadoUsuario === "error" && <View><Mensaje texto="No se pudo comprobar. Revisa tu conexión; también se verificará al guardar." /><Pressable accessibilityRole="button" onPress={() => { setConsulta(null); setReintento((n) => n + 1); }}><Text style={s.enlace}>Volver a comprobar</Text></Pressable></View>}
        <Campo etiqueta="Contraseña:" accessibilityLabel="Contraseña" value={contrasena} onChangeText={setContrasena} editable={!cargando} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" maxLength={128} style={(contrasena || intento) && problemas.contrasena ? s.invalido : undefined} />
        {(contrasena || intento) && problemas.contrasena ? <Mensaje texto={problemas.contrasena} /> : <Text style={s.ayuda}>De 8 a 128 caracteres. Puedes usar espacios entre palabras.</Text>}
        <Campo etiqueta="Confirmar contraseña:" accessibilityLabel="Confirmar contraseña" value={confirmacion} onChangeText={setConfirmacion} editable={!cargando} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" maxLength={128} style={(confirmacion || intento) && problemas.confirmacion ? s.invalido : undefined} />
        {(confirmacion || intento) && (problemas.confirmacion ? <Mensaje texto={problemas.confirmacion} /> : <Mensaje correcto texto="Las contraseñas coinciden." />)}
        <Etiqueta>Configuración predeterminada:</Etiqueta>
        <View style={s.incluido}>
          <Text style={s.incluidoTexto}>Listas predeterminadas incluidas</Text>
          <Text style={s.incluidoTexto}>Etiquetas predeterminadas incluidas</Text>
          <Text style={s.ayuda}>Se crean automáticamente. Podrás administrarlos después.</Text>
        </View>
        <Campo etiqueta="Frase motivacional (opcional):" value={frase} onChangeText={setFrase} editable={!cargando} maxLength={280} multiline numberOfLines={3} />
        <Text style={s.ayuda}>{frase.length}/280</Text>
        <BotonRosa texto={cargando ? "Creando…" : "Crear cuenta"} onPress={enviar} disabled={cargando || creado || estadoUsuario === "consultando" || estadoUsuario === "ocupado"} />
      </Tarjeta>
      <Ventana visible={creado} titulo="¡Bienvenida a SweetList!" mensaje="Tu cuenta está lista. Ya puedes iniciar sesión." onCerrar={() => router.replace("/")} botones={[{ texto: "Iniciar sesión", onPress: () => router.replace("/") }]} />
    </Pantalla>
  );
}

const s = StyleSheet.create({
  titulo: { fontSize: 28, fontWeight: "600", color: colores.texto },
  intro: { color: colores.textoSuave, marginBottom: 12 },
  incluido: { padding: 14, gap: 6, borderRadius: 15, backgroundColor: colores.fondoInput, borderWidth: 1, borderColor: colores.borde },
  incluidoTexto: { color: "#b52f61", fontWeight: "600" },
  ayuda: { fontSize: 13, color: colores.textoSuave, marginTop: 3, marginBottom: 5 },
  invalido: { borderColor: "#b4233b" },
  enlace: { color: colores.rosa, fontWeight: "bold", paddingVertical: 8 },
  separador: { height: 1, backgroundColor: colores.borde, marginVertical: 12 },
  paleta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, marginBottom: 10 },
  muestra: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colores.blanco, alignItems: "center", justifyContent: "center" },
  muestraActiva: { borderColor: colores.texto },
  check: { color: colores.blanco, fontWeight: "bold", fontSize: 20, textShadowColor: "#444", textShadowRadius: 2 },
});
