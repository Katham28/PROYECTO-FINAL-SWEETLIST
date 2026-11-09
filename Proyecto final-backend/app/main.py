from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Proyecto final API")

# Permite que la app (web o móvil) llame a la API durante el desarrollo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Mensaje(BaseModel):
    mensaje: str


@app.get("/api/saludo", response_model=Mensaje)
def saludo() -> Mensaje:
    return Mensaje(mensaje="Hola desde el backend en Python")
