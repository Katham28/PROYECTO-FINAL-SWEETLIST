from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from pymongo import ASCENDING, AsyncMongoClient

from config import config

cliente: AsyncMongoClient = AsyncMongoClient(config.mongo_url)
db = cliente[config.mongo_db]

usuarios = db["usuarios"]
tareas = db["tareas"]
tags = db["tags"]
listas = db["listas"]
pomodoros = db["pomodoros"]


async def crear_indices():
    await usuarios.create_index("usuario", unique=True)
    await tags.create_index([("usuario_id", ASCENDING), ("nombre", ASCENDING)], unique=True)
    await listas.create_index([("usuario_id", ASCENDING), ("nombre", ASCENDING)], unique=True)
    await tareas.create_index([("usuario_id", ASCENDING), ("fecha", ASCENDING)])
    await pomodoros.create_index([("usuario_id", ASCENDING), ("inicio", ASCENDING)])


def oid(texto: str) -> ObjectId:
    """Convierte el id del URL a ObjectId; si no es válido responde 404."""
    try:
        return ObjectId(texto)
    except (InvalidId, TypeError):
        raise HTTPException(404, "No encontrado")


def a_json(doc: dict) -> dict:
    """Cambia _id (ObjectId) por id (texto) para poder mandarlo como JSON."""
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("usuario_id"), ObjectId):
        doc["usuario_id"] = str(doc["usuario_id"])
    if "tarea_ids" in doc:
        doc["tarea_ids"] = [str(t) for t in doc["tarea_ids"]]
    doc.pop("contrasena_hash", None)
    return doc
