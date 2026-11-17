"""Pomodoros: cada vez que el usuario termina uno (completo o antes de tiempo)
la app lo manda aquí. Se guarda en el historial y a CADA tarea ligada se le suma
+1 pomodoro y el tiempo trabajado completo.
"""

from datetime import timedelta

from fastapi import APIRouter, HTTPException

import db
from modelos import Pomodoro, PomodoroCrear
from rutas.usuarios import buscar_usuario

router = APIRouter(prefix="/api/usuarios/{usuario_id}/pomodoros", tags=["pomodoros"])


@router.post("", response_model=Pomodoro, status_code=201)
async def registrar_pomodoro(usuario_id: str, datos: PomodoroCrear):
    await buscar_usuario(usuario_id)
    uid = db.oid(usuario_id)
    ids = list(dict.fromkeys(db.oid(t) for t in datos.tarea_ids))  # sin repetidos

    # Todas las tareas deben existir y ser de este usuario.
    encontradas = await db.tareas.count_documents({"_id": {"$in": ids}, "usuario_id": uid})
    if encontradas != len(ids):
        raise HTTPException(404, "Alguna tarea no existe")

    doc = {
        "usuario_id": uid,
        "tarea_ids": ids,
        "inicio": datos.inicio.isoformat(),
        "fin": (datos.inicio + timedelta(seconds=datos.duracion_seg)).isoformat(),
        "duracion_seg": datos.duracion_seg,
        "duracion_plan_seg": datos.duracion_plan_seg,
        "completo": datos.duracion_seg >= datos.duracion_plan_seg,
    }
    res = await db.pomodoros.insert_one(doc)

    # $inc suma dentro de Mongo: no se pierden cuentas aunque lleguen dos a la vez.
    await db.tareas.update_many(
        {"_id": {"$in": ids}},
        {"$inc": {"pomodoros": 1, "segundos_invertidos": datos.duracion_seg}},
    )
    doc["_id"] = res.inserted_id
    return db.a_json(doc)


@router.get("", response_model=list[Pomodoro])
async def historial(usuario_id: str, tarea_id: str | None = None):
    """Historial de pomodoros del usuario. ?tarea_id= para ver solo los de una tarea."""
    await buscar_usuario(usuario_id)
    filtro: dict = {"usuario_id": db.oid(usuario_id)}
    if tarea_id:
        filtro["tarea_ids"] = db.oid(tarea_id)
    return [db.a_json(d) async for d in db.pomodoros.find(filtro).sort("inicio")]
