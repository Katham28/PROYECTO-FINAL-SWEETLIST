// Descarga el respaldo (JSON o PDF) que genera el backend.
// - Celular: se guarda en la caché y se abre el menú de compartir (Archivos, Drive, WhatsApp...).
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { api, ErrorApi } from "@/api";
import { aTextoFecha } from "@/datos/ejemplo";

export async function exportarRespaldo(usuarioId: string, usuario: string, formato: "json" | "pdf") {
  const url = api.urlRespaldo(usuarioId, formato);
  const hoy = aTextoFecha(new Date());
  const nombre = `sweetlist-respaldo-${usuario}-${hoy}.${formato}`;

  const destino = new File(Paths.cache, nombre);
  let archivo: File;
  try {
    archivo = await File.downloadFileAsync(url, destino, { idempotent: true });
  } catch {
    throw new ErrorApi("No se pudo descargar el respaldo.", 0);
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new ErrorApi(`El respaldo se guardó en ${archivo.uri}, pero el menú de compartir no está disponible.`, 0);
  }
  try {
    await Sharing.shareAsync(archivo.uri, {
    mimeType: formato === "pdf" ? "application/pdf" : "application/json",
    UTI: formato === "pdf" ? "com.adobe.pdf" : "public.json",
    dialogTitle: "Respaldo de SweetList",
    });
  } catch {
    throw new ErrorApi("No se pudo abrir el menú para compartir el respaldo.", 0);
  }
}
