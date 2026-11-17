# Backend SweetList (FastAPI + MongoDB)

API REST que recibe y responde **JSON**, guardando todo en MongoDB.

## Primera vez
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```
En `.env` pon la URL de tu MongoDB (local `mongodb://localhost:27017` o la de MongoDB Atlas `mongodb+srv://...`).

## Arrancar
```bash
.venv\Scripts\activate
fastapi dev main.py --host 0.0.0.0 --port 8000
```
- Documentación interactiva (probar todo desde el navegador): http://localhost:8000/docs
- `GET /` responde `{"estado":"ok","mongo":"conectado"}` si llega a Mongo.

`--host 0.0.0.0` permite que el celular (misma red Wi-Fi) llegue usando la IP de tu PC.

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/usuarios` | Crear usuario (201) |
| GET | `/api/usuarios/disponibilidad?usuario=katia` | Devuelve `{"disponible": true}` sin exponer datos personales |
| POST | `/api/login` | Login → devuelve el usuario (401 si falla) |
| GET | `/api/usuarios` | Listar usuarios |
| GET / PATCH / DELETE | `/api/usuarios/{id}` | Ver / editar / borrar usuario (borra también sus tareas, tags y listas) |
| GET / POST | `/api/usuarios/{id}/tareas` | Listar (filtros `?fecha=&lista=&tag=&hecha=`) / crear tarea |
| GET / PATCH / DELETE | `/api/usuarios/{id}/tareas/{tarea_id}` | Ver / editar / borrar tarea |
| GET / POST | `/api/usuarios/{id}/tags` | Listar / crear tag |
| GET / PATCH / DELETE | `/api/usuarios/{id}/tags/{tag_id}` | Ver / editar / borrar tag |
| GET / POST | `/api/usuarios/{id}/listas` | Listar / crear lista |
| GET / PATCH / DELETE | `/api/usuarios/{id}/listas/{lista_id}` | Ver / editar / borrar lista |
| POST | `/api/usuarios/{id}/pomodoros` | Registrar un pomodoro terminado: suma +1 pomodoro y el tiempo a **cada** tarea ligada |
| GET | `/api/usuarios/{id}/pomodoros` | Historial de pomodoros (`?tarea_id=` para una tarea) |
| GET | `/api/usuarios/{id}/respaldo` | Descargar respaldo completo en **JSON** |
| GET | `/api/usuarios/{id}/respaldo.pdf` | Descargar respaldo en **PDF** con el estilo de SweetList |

`PATCH` solo cambia los campos que mandes. Errores: `404` no existe, `409` duplicado, `422` JSON inválido.

### Ejemplos de JSON

Crear usuario:
```json
{
  "usuario": "katia", "contrasena": "mi clave 123", "confirmar_contrasena": "mi clave 123",
  "nombre": "Katia", "apellidos": "Carpio",
  "cumpleanos": "2004-05-10", "color": "#ff4f8b",
  "genero": "FEMALE", "frase": "¡Tú puedes!",
  "lista_default": true, "tags_default": true
}
```
Respuesta (la contraseña nunca se devuelve; se guarda con hash):
```json
{ "id": "6737...", "usuario": "katia", "nombre": "Katia", "...": "..." }
```

Login: `{"usuario": "katia", "contrasena": "1234"}`

Crear tarea:
```json
{ "titulo": "Comprar despensa", "descripcion": "Leche y huevos",
  "fecha": "2026-11-15", "tag": "Personal", "lista": "Compras", "hecha": false }
```

Marcar como hecha: `PATCH /api/usuarios/{id}/tareas/{tarea_id}` con `{"hecha": true}`

Registrar pomodoro (25 min programados, terminado a los 20):
```json
{ "tarea_ids": ["t1", "t2"], "inicio": "2026-11-15T10:00:00Z",
  "duracion_seg": 1200, "duracion_plan_seg": 1500 }
```
Cada tarea queda con `pomodoros +1` y `segundos_invertidos +1200`. Las duraciones del pomodoro
se guardan en el usuario (`pomodoro_enfoque_min`, `pomodoro_descanso_min`, `pomodoro_descanso_largo_min`).

## Archivos
- `main.py` – arranca la app, CORS y rutas
- `config.py` – lee `MONGO_URL` / `MONGO_DB`
- `db.py` – conexión a Mongo y colecciones
- `modelos.py` – forma del JSON (validación con Pydantic)
- `seguridad.py` – hash de contraseñas
- `pdf.py` – dibuja el PDF del respaldo (ReportLab)
- `rutas/usuarios.py`, `rutas/recursos.py`, `rutas/pomodoros.py`, `rutas/respaldo.py` – endpoints

## Conexión con la app
La app usa `src/api.ts`. Por defecto busca el backend en la misma PC donde corre `expo start`, puerto 8000
(en web usa `localhost:8000`; en el celular usa la IP de la PC). Para otra dirección crea `.env` en la raíz de la app:
```
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000
```
Si el celular no conecta, permite el puerto 8000 en el Firewall de Windows.


## Registro y validación
El formulario solicita nombre(s), apellido(s), cumpleaños opcional, color, género, usuario, contraseña,
confirmación, listas/etiquetas predeterminadas y frase opcional. Ya no solicita estilo.
Los nombres aceptan letras Unicode, acentos, espacios, apóstrofes y guiones.
Usuarios: de 3 a 50 caracteres (`a-z`, números, `.`, `_`, `-`), normalizados a minúsculas.
La disponibilidad se comprueba tras 450 ms sin escribir; el POST vuelve a comprobarla y el índice único evita duplicados concurrentes.
Contraseñas nuevas: de 8 a 128 caracteres, no solo espacios; deben coincidir. La confirmación nunca se guarda.
Cumpleaños: entre 1900 y hoy. El servidor repite las validaciones.
Los perfiles antiguos se presentan con nombres y apellidos unificados; sus contraseñas actuales siguen funcionando.
