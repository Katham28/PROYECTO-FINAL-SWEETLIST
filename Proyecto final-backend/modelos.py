"""Forma del JSON que entra y sale de la API (validado con Pydantic)."""

import unicodedata

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Genero = Literal["MALE", "FEMALE", "OTHER"]
ColorHex = Field(pattern=r"^#[0-9A-Fa-f]{6}$")


# ---------- Usuarios ----------
def validar_nombre(valor: str, maximo: int = 100) -> str:
    valor = valor.strip()
    if not valor or len(valor) > maximo:
        raise ValueError(f"El nombre o apellido es obligatorio y admite hasta {maximo} caracteres")
    if not any(c.isalpha() for c in valor) or any(
        not (c.isalpha() or unicodedata.category(c).startswith("M") or c in " .’'-") for c in valor
    ):
        raise ValueError("Usa letras, espacios, acentos, guiones o apóstrofes en nombres y apellidos")
    return valor


def validar_cumpleanos(valor: date | None) -> date | None:
    if valor is not None and not date(1900, 1, 1) <= valor <= date.today():
        raise ValueError("El cumpleaños debe estar entre 1900 y hoy")
    return valor


def validar_contrasena(valor: str) -> str:
    if not 8 <= len(valor) <= 128 or not valor.strip():
        raise ValueError("La contraseña debe tener entre 8 y 128 caracteres y no ser solo espacios")
    return valor


class UsuarioBase(BaseModel):
    nombre: str = ""
    apellidos: str = ""
    cumpleanos: date | None = None
    color: str = Field("#ff4f8b", pattern=r"^#[0-9A-Fa-f]{6}$")
    genero: Genero = "MALE"
    otro_genero: str = ""
    frase: str = ""
    pomodoro_enfoque_min: int = Field(25, ge=1, le=180)
    pomodoro_descanso_min: int = Field(5, ge=1, le=60)
    pomodoro_descanso_largo_min: int = Field(15, ge=1, le=120)


class UsuarioCrear(UsuarioBase):
    nombre: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=120)
    usuario: str = Field(min_length=3, max_length=50, pattern=r"^[a-z0-9_.-]+$")
    contrasena: str = Field(min_length=8, max_length=128)
    confirmar_contrasena: str = Field(min_length=8, max_length=128, exclude=True)
    otro_genero: str = Field("", max_length=60)
    frase: str = Field("", max_length=280)
    lista_default: bool = True
    tags_default: bool = True

    @field_validator("usuario", mode="before")
    @classmethod
    def normalizar_usuario(cls, valor):
        return valor.strip().lower() if isinstance(valor, str) else valor

    @field_validator("nombre", "apellidos")
    @classmethod
    def nombres_validos(cls, valor, info):
        return validar_nombre(valor, 120 if info.field_name == "apellidos" else 100)

    @field_validator("cumpleanos")
    @classmethod
    def fecha_valida(cls, valor):
        return validar_cumpleanos(valor)

    @field_validator("contrasena")
    @classmethod
    def clave_valida(cls, valor):
        return validar_contrasena(valor)

    @model_validator(mode="after")
    def claves_iguales(self):
        if self.contrasena != self.confirmar_contrasena:
            raise ValueError("Las contraseñas no coinciden")
        return self


class UsuarioEditar(BaseModel):
    nombre: str | None = Field(None, max_length=100)
    apellidos: str | None = Field(None, max_length=120)
    cumpleanos: date | None = None
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    genero: Genero | None = None
    otro_genero: str | None = Field(None, max_length=60)
    frase: str | None = Field(None, max_length=280)
    contrasena: str | None = Field(None, min_length=8, max_length=128)
    pomodoro_enfoque_min: int | None = Field(None, ge=1, le=180)
    pomodoro_descanso_min: int | None = Field(None, ge=1, le=60)
    pomodoro_descanso_largo_min: int | None = Field(None, ge=1, le=120)

    @field_validator("nombre", "apellidos")
    @classmethod
    def nombres_validos(cls, valor, info):
        if valor is None:
            raise ValueError("El nombre y apellidos no pueden ser nulos")
        return validar_nombre(valor, 120 if info.field_name == "apellidos" else 100)

    @field_validator("cumpleanos")
    @classmethod
    def fecha_valida(cls, valor):
        return validar_cumpleanos(valor)

    @field_validator("contrasena")
    @classmethod
    def clave_valida(cls, valor):
        if valor is None:
            raise ValueError("La contraseña no puede ser nula")
        return validar_contrasena(valor)


class Usuario(UsuarioBase):
    id: str
    usuario: str

    @model_validator(mode="before")
    @classmethod
    def perfil_anterior(cls, datos):
        # Unifica perfiles viejos sin modificar sus documentos ni sus contraseñas.
        if not isinstance(datos, dict):
            return datos
        datos = dict(datos)
        if datos.get("segundo_nombre"):
            datos["nombre"] = " ".join(filter(None, [datos.get("nombre"), datos["segundo_nombre"]]))
        if "apellidos" not in datos:
            datos["apellidos"] = " ".join(filter(None, [datos.get("primer_apellido"), datos.get("segundo_apellido")]))
        return datos


class Login(BaseModel):
    usuario: str
    contrasena: str


# ---------- Tags ----------
class TagCrear(BaseModel):
    nombre: str = Field(min_length=1, max_length=40)
    color: str = Field("#007BFF", pattern=r"^#[0-9A-Fa-f]{6}$")


    @field_validator("nombre")
    @classmethod
    def texto_valido(cls, valor):
        if valor is None or not valor.strip():
            raise ValueError("El nombre no puede quedar vacío")
        return valor.strip()


class TagEditar(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=40)
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


    @field_validator("nombre")
    @classmethod
    def texto_valido(cls, valor):
        if valor is None or not valor.strip():
            raise ValueError("El nombre no puede quedar vacío")
        return valor.strip()


class Tag(TagCrear):
    id: str
    usuario_id: str


# ---------- Listas ----------
class ListaCrear(BaseModel):
    nombre: str = Field(min_length=1, max_length=40)


    @field_validator("nombre")
    @classmethod
    def texto_valido(cls, valor):
        if valor is None or not valor.strip():
            raise ValueError("El nombre no puede quedar vacío")
        return valor.strip()


class ListaEditar(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=40)


    @field_validator("nombre")
    @classmethod
    def texto_valido(cls, valor):
        if valor is None or not valor.strip():
            raise ValueError("El nombre no puede quedar vacío")
        return valor.strip()


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


    @field_validator("titulo")
    @classmethod
    def texto_valido(cls, valor):
        if valor is None or not valor.strip():
            raise ValueError("El titulo no puede quedar vacío")
        return valor.strip()


class TareaEditar(BaseModel):
    titulo: str | None = Field(None, min_length=1, max_length=120)
    descripcion: str | None = None
    fecha: date | None = None
    tag: str | None = None
    lista: str | None = None
    hecha: bool | None = None


    @field_validator("titulo")
    @classmethod
    def texto_valido(cls, valor):
        if valor is None or not valor.strip():
            raise ValueError("El titulo no puede quedar vacío")
        return valor.strip()


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
