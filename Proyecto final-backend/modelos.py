"""Forma del JSON que entra y sale de la API (validado con Pydantic)."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

Genero = Literal["MALE", "FEMALE", "OTHER"]
Estilo = Literal["Light", "Dark", "Colored"]
ColorHex = Field(pattern=r"^#[0-9A-Fa-f]{6}$")


# ---------- Usuarios ----------
class UsuarioBase(BaseModel):
    nombre: str = ""
    segundo_nombre: str = ""
    primer_apellido: str = ""
    segundo_apellido: str = ""
    cumpleanos: date | None = None
    color: str = Field("#ff4f8b", pattern=r"^#[0-9A-Fa-f]{6}$")
    genero: Genero = "MALE"
    otro_genero: str = ""
    estilo: Estilo = "Light"
    frase: str = ""
    # Duraciones del pomodoro elegidas por el usuario (minutos).
    pomodoro_enfoque_min: int = Field(25, ge=1, le=180)
    pomodoro_descanso_min: int = Field(5, ge=1, le=60)
    pomodoro_descanso_largo_min: int = Field(15, ge=1, le=120)


class UsuarioCrear(UsuarioBase):
    usuario: str = Field(min_length=1, max_length=50)
    contrasena: str = Field(min_length=1)
    lista_default: bool = False  # crea las listas de ejemplo
    tags_default: bool = False  # crea los tags de ejemplo


class UsuarioEditar(BaseModel):
    nombre: str | None = None
    segundo_nombre: str | None = None
    primer_apellido: str | None = None
    segundo_apellido: str | None = None
    cumpleanos: date | None = None
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    genero: Genero | None = None
    otro_genero: str | None = None
    estilo: Estilo | None = None
    frase: str | None = None
    contrasena: str | None = Field(None, min_length=1)
    pomodoro_enfoque_min: int | None = Field(None, ge=1, le=180)
    pomodoro_descanso_min: int | None = Field(None, ge=1, le=60)
    pomodoro_descanso_largo_min: int | None = Field(None, ge=1, le=120)


class Usuario(UsuarioBase):
    id: str
    usuario: str


class Login(BaseModel):
    usuario: str
    contrasena: str


# ---------- Tags ----------
class TagCrear(BaseModel):
    nombre: str = Field(min_length=1, max_length=40)
    color: str = Field("#007BFF", pattern=r"^#[0-9A-Fa-f]{6}$")


class TagEditar(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=40)
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class Tag(TagCrear):
    id: str
    usuario_id: str


# ---------- Listas ----------
class ListaCrear(BaseModel):
    nombre: str = Field(min_length=1, max_length=40)


class ListaEditar(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=40)


class Lista(ListaCrear):
    id: str
    usuario_id: str


# ---------- Tareas ----------
class TareaCrear(BaseModel):
    titulo: str = Field(min_length=1, max_length=120)
    descripcion: str = ""
    fecha: date
    tag: str = ""
    lista: str = "General"
    hecha: bool = False


class TareaEditar(BaseModel):
    titulo: str | None = Field(None, min_length=1, max_length=120)
    descripcion: str | None = None
    fecha: date | None = None
    tag: str | None = None
    lista: str | None = None
    hecha: bool | None = None


class Tarea(TareaCrear):
    id: str
    usuario_id: str
    # Los suma el backend cada vez que se termina un pomodoro ligado a la tarea.
    pomodoros: int = 0
    segundos_invertidos: int = 0


# ---------- Pomodoros ----------
class PomodoroCrear(BaseModel):
    """Un pomodoro terminado (completo o terminado antes de tiempo)."""

    tarea_ids: list[str] = Field(min_length=1)
    inicio: datetime
    duracion_seg: int = Field(gt=0, le=4 * 3600)  # tiempo realmente trabajado
    duracion_plan_seg: int = Field(gt=0, le=4 * 3600)  # lo que se había programado (ej. 25 min)


class Pomodoro(PomodoroCrear):
    id: str
    usuario_id: str
    fin: datetime
    completo: bool  # True si llegó al final del tiempo programado
