// Descarga el respaldo (JSON o PDF) que genera el backend.
// - Web: el navegador descarga el archivo.
// - Celular: se guarda en la caché y se abre el menú de compartir (Archivos, Drive, WhatsApp...).
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { api, ErrorApi } from "@/api";
import { aTextoFecha } from "@/datos/ejemplo";

export async function exportarRespaldo(usuarioId: string, usuario: string, formato: "json" | "pdf") {
  const url = api.urlRespaldo(usuarioId, formato);
  const hoy = aTextoFecha(new Date());
  const nombre = `sweetlist-respaldo-${usuario}-${hoy}.${formato}`;

  if (Platform.OS === "web") {
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      throw new ErrorApi("Could not reach the server.", 0);
    }
    if (!res.ok) throw new ErrorApi(`Export failed (${res.status})`, res.status);
    const blob = await res.blob();
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 10_000);
    return;
  }

  const destino = new File(Paths.cache, nombre);
  let archivo: File;
  try {
    archivo = await File.downloadFileAsync(url, destino, { idempotent: true });
  } catch {
    throw new ErrorApi("Could not download the backup.", 0);
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new ErrorApi(`Saved to ${archivo.uri}`, 0);
  }
  await Sharing.shareAsync(archivo.uri, {
    mimeType: formato === "pdf" ? "application/pdf" : "application/json",
    UTI: formato === "pdf" ? "com.adobe.pdf" : "public.json",
    dialogTitle: "SweetList backup",
  });
}
