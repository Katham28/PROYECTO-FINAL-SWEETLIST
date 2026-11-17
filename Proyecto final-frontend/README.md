# SweetList — aplicación móvil

Aplicación para Android e iOS, desarrollada con Expo SDK 58 y React Native.

## Probar en un dispositivo

1. Ejecuta el backend desde la carpeta vecina `Proyecto final-backend`:
   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. Desde esta carpeta del frontend, inicia Expo:
   ```powershell
   npx expo start --go --clear
   ```
3. Conecta el celular y la PC al mismo Wi-Fi y escanea el QR con Expo Go compatible con SDK 58.

La API usa la IP de la PC de Expo y el puerto 8000. Para otra dirección,
crea `.env` en esta carpeta con `EXPO_PUBLIC_API_URL=http://IP-DE-LA-PC:8000`.
La URL privada de MongoDB va únicamente en el `.env` del backend.

Los calendarios usan el selector nativo del dispositivo. Los respaldos JSON y PDF
se descargan a la caché y se guardan o comparten con el menú del teléfono.

## Organización

- `src/app/`: pantallas y navegación de Expo Router.
- `src/components/`: componentes compartidos (calendario, fechas, controles).
- `src/api.ts`: peticiones al backend.
- `src/exportar.ts`: descarga y compartición de los respaldos.

## Verificación

```powershell
npx tsc --noEmit
npx expo lint
```
