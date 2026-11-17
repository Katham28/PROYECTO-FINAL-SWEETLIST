import re

from fastapi import APIRouter, HTTPException, Query, Response
from pymongo.errors import DuplicateKeyError

import db
from modelos import Login, Usuario, UsuarioCrear, UsuarioEditar
from seguridad import hashear, verificar

router = APIRouter(prefix="/api", tags=["usuarios"])

# Valores por defecto (los mismos que src/datos/ejemplo.ts de la app).
TAGS_DEFAULT = [
    {"nombre": "Urgente", "color": "#FF0000"},
    {"nombre": "Trabajo", "color": "#007BFF"},
    {"nombre": "Personal", "color": "#28A745"},
    {"nombre": "Estudio", "color": "#FFC107"},
    {"nombre": "Opcional", "color": "#6F42C1"},
]
LISTAS_DEFAULT = ["General", "Trabajo", "Hogar", "Estudio", "Compras"]


async def buscar_usuario(usuario_id: str) -> dict:
    doc = await db.usuarios.find_one({"_id": db.oid(usuario_id)})
    if not doc:
        raise HTTPException(404, "Usuario no encontrado")
    return doc


def filtro_usuario(usuario: str) -> dict:
    # Se conserva el acceso a cuentas anteriores que tienen mayúsculas.
    return {"usuario": {"$regex": "^" + re.escape(usuario.strip()) + "$", "$options": "i"}}


@router.get("/usuarios/disponibilidad")
async def disponibilidad_usuario(usuario: str = Query(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")):
    existe = await db.usuarios.find_one(filtro_usuario(usuario), {"_id": 1})
    return {"disponible": existe is None}


@router.post("/usuarios", response_model=Usuario, status_code=201)
async def crear_usuario(datos: UsuarioCrear):
    if await db.usuarios.find_one(filtro_usuario(datos.usuario), {"_id": 1}):
        raise HTTPException(409, "Ese nombre de usuario ya existe")
    doc = datos.model_dump(mode="json", exclude={"contrasena", "confirmar_contrasena", "lista_default", "tags_default"})
    doc["usuario"] = doc["usuario"].strip()
    doc["contrasena_hash"] = hashear(datos.contrasena)
    try:
        res = await db.usuarios.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(409, "Ese nombre de usuario ya existe")

    uid = res.inserted_id
    # Se incluyen siempre para nuevas cuentas, aunque un cliente antiguo envíe false.
    await db.tags.insert_many([{**t, "usuario_id": uid} for t in TAGS_DEFAULT])
    await db.listas.insert_many([{"nombre": n, "usuario_id": uid} for n in LISTAS_DEFAULT])

    doc["_id"] = uid
    return db.a_json(doc)


@router.post("/login", response_model=Usuario)
async def login(datos: Login):
    doc = await db.usuarios.find_one(filtro_usuario(datos.usuario))
    if not doc or not verificar(datos.contrasena, doc["contrasena_hash"]):
        raise HTTPException(401, "Usuario o contraseña incorrectos")
    return db.a_json(doc)


@router.get("/usuarios", response_model=list[Usuario])
async def listar_usuarios():
    return [db.a_json(d) async for d in db.usuarios.find().sort("usuario")]


@router.get("/usuarios/{usuario_id}", response_model=Usuario)
async def ver_usuario(usuario_id: str):
    return db.a_json(await buscar_usuario(usuario_id))


@router.patch("/usuarios/{usuario_id}", response_model=Usuario)
async def editar_usuario(usuario_id: str, datos: UsuarioEditar):
    await buscar_usuario(usuario_id)
    cambios = datos.model_dump(mode="json", exclude_unset=True)
    if "contrasena" in cambios:
        cambios["contrasena_hash"] = hashear(cambios.pop("contrasena"))
    if "nombre" in cambios or "apellidos" in cambios:
        # Al guardar el perfil unificado, evita que vuelva a agregarse el segundo nombre viejo.
        anterior = await buscar_usuario(usuario_id)
        cambios.setdefault("nombre", Usuario.model_validate(db.a_json(anterior)).nombre)
        cambios.setdefault("apellidos", Usuario.model_validate(db.a_json(anterior)).apellidos)
        cambios.update(segundo_nombre="", primer_apellido="", segundo_apellido="")
    if cambios:
        await db.usuarios.update_one({"_id": db.oid(usuario_id)}, {"$set": cambios})
    return db.a_json(await buscar_usuario(usuario_id))


@router.delete("/usuarios/{usuario_id}", status_code=204)
async def borrar_usuario(usuario_id: str):
    uid = db.oid(usuario_id)
    res = await db.usuarios.delete_one({"_id": uid})
    if not res.deleted_count:
        raise HTTPException(404, "Usuario no encontrado")
    # Borra también todo lo que era de ese usuario.
    for col in (db.tareas, db.tags, db.listas, db.pomodoros):
        await col.delete_many({"usuario_id": uid})
    return Response(status_code=204)
