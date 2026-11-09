# Proyecto final — Backend

API en Python con FastAPI que devuelve JSON a la app Expo.

## Instalar (una sola vez)

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Arrancar

```bash
.venv\Scripts\activate
fastapi dev app/main.py --host 0.0.0.0 --port 8000
```

- `--host 0.0.0.0` hace que el celular pueda llegar al servidor por la red local.
- Documentación interactiva: http://localhost:8000/docs
- Endpoint de prueba: http://localhost:8000/api/saludo
