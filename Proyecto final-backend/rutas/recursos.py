"""CRUD de tareas, tags y listas. Todo cuelga de un usuario:
/api/usuarios/{usuario_id}/tareas, /tags, /listas
"""

from fastapi import APIRouter, HTTPException, Response
from pymongo.errors import DuplicateKeyError

import db
from modelos import (
    Lista,
    ListaCrear,
    ListaEditar,
    Tag,
    TagCrear,
    TagEditar,
    Tarea,
    TareaCrear,
    TareaEditar,
)
from rutas.usuarios import buscar_usuario


def crear_router(nombre: str, coleccion, Crear, Editar, Salida, orden: str):
    router = APIRouter(prefix="/api/usuarios/{usuario_id}/" + nombre, tags=[nombre])

    async def buscar(usuario_id: str, item_id: str) -> dict:
        doc = await coleccion.find_one({"_id": db.oid(item_id), "usuario_id": db.oid(usuario_id)})
        if not doc:
            raise HTTPException(404, "No encontrado")
        return doc

    async def guardar(accion):
        try:
            return await accion
        except DuplicateKeyError:
            raise HTTPException(409, "Ya existe uno con ese nombre")

    @router.post("", response_model=Salida, status_code=201)
    async def crear(usuario_id: str, datos: Crear):
        await buscar_usuario(usuario_id)
        doc = {**datos.model_dump(mode="json"), "usuario_id": db.oid(usuario_id)}
        res = await guardar(coleccion.insert_one(doc))
        doc["_id"] = res.inserted_id
        return db.a_json(doc)

    @router.get("/{item_id}", response_model=Salida)
    async def ver(usuario_id: str, item_id: str):
        return db.a_json(await buscar(usuario_id, item_id))

    @router.patch("/{item_id}", response_model=Salida)
    async def editar(usuario_id: str, item_id: str, datos: Editar):
        doc = await buscar(usuario_id, item_id)
        cambios = datos.model_dump(mode="json", exclude_unset=True)
        if cambios:
            await guardar(coleccion.update_one({"_id": doc["_id"]}, {"$set": cambios}))
            if nombre in ("listas", "tags") and "nombre" in cambios and cambios["nombre"] != doc["nombre"]:
                campo = "lista" if nombre == "listas" else "tag"
                await db.tareas.update_many(
                    {"usuario_id": db.oid(usuario_id), campo: doc["nombre"]},
                    {"$set": {campo: cambios["nombre"]}},
                )
        return db.a_json(await buscar(usuario_id, item_id))

    @router.delete("/{item_id}", status_code=204)
    async def borrar(usuario_id: str, item_id: str):
        doc = await buscar(usuario_id, item_id)
        if nombre in ("listas", "tags"):
            # La eliminación de un catálogo nunca elimina sus tareas ni sus pomodoros.
            campo = "lista" if nombre == "listas" else "tag"
            await db.tareas.update_many(
                {"usuario_id": db.oid(usuario_id), campo: doc["nombre"]},
                {"$set": {campo: ""}},
            )
        await coleccion.delete_one({"_id": doc["_id"]})
        return Response(status_code=204)

    async def listar_base(usuario_id: str, filtro: dict):
        await buscar_usuario(usuario_id)
        filtro = {"usuario_id": db.oid(usuario_id), **{k: v for k, v in filtro.items() if v is not None}}
        return [db.a_json(d) async for d in coleccion.find(filtro).sort(orden)]

    return router, listar_base


tareas_router, _listar_tareas = crear_router("tareas", db.tareas, TareaCrear, TareaEditar, Tarea, "fecha")
tags_router, _listar_tags = crear_router("tags", db.tags, TagCrear, TagEditar, Tag, "nombre")
listas_router, _listar_listas = crear_router("listas", db.listas, ListaCrear, ListaEditar, Lista, "nombre")


@tareas_router.get("", response_model=list[Tarea])
async def listar_tareas(
    usuario_id: str,
    fecha: str | None = None,
    lista: str | None = None,
    tag: str | None = None,
    hecha: bool | None = None,
):
    """Filtros opcionales: ?fecha=2026-11-15&lista=Hogar&tag=Urgente&hecha=false"""
    return await _listar_tareas(usuario_id, {"fecha": fecha, "lista": lista, "tag": tag, "hecha": hecha})


@tags_router.get("", response_model=list[Tag])
async def listar_tags(usuario_id: str):
    return await _listar_tags(usuario_id, {})


@listas_router.get("", response_model=list[Lista])
async def listar_listas(usuario_id: str):
    return await _listar_listas(usuario_id, {})
