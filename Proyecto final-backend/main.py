from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import db
from rutas.pomodoros import router as pomodoros_router
from rutas.recursos import listas_router, tags_router, tareas_router
from rutas.respaldo import router as respaldo_router
from rutas.usuarios import router as usuarios_router


@asynccontextmanager
async def ciclo_de_vida(app: FastAPI):
    await db.crear_indices()
    yield
    await db.cliente.close()


app = FastAPI(title="SweetList API", lifespan=ciclo_de_vida)

# Permite que la app (web o móvil) llame a esta API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],  # para que la app web lea el nombre del archivo
)

app.include_router(usuarios_router)
app.include_router(tareas_router)
app.include_router(tags_router)
app.include_router(listas_router)
app.include_router(pomodoros_router)
app.include_router(respaldo_router)


@app.get("/")
async def raiz():
    await db.cliente.admin.command("ping")
    return {"estado": "ok", "mongo": "conectado"}
