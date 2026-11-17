"""Respaldo: exporta TODO lo del usuario en JSON o en un PDF bonito (solo exportar)."""

import json
from datetime import date, datetime, timezone

from fastapi import APIRouter, Response

import db
from modelos import Usuario
from pdf import generar_pdf
from rutas.usuarios import buscar_usuario

router = APIRouter(prefix="/api/usuarios/{usuario_id}", tags=["respaldo"])


def _limpio(doc: dict) -> dict:
    """Documento listo para el respaldo: sin ids internos de Mongo ni usuario_id."""
    d = db.a_json(doc)
    d.pop("usuario_id", None)
    return d


async def armar_respaldo(usuario_id: str) -> dict:
    usuario = await buscar_usuario(usuario_id)
    uid = usuario["_id"]

    async def todos(col, orden):
        return [_limpio(d) async for d in col.find({"usuario_id": uid}).sort(orden)]

    tareas = await todos(db.tareas, "fecha")
    for t in tareas:  # tareas viejas que aún no tienen contadores
        t.setdefault("pomodoros", 0)
        t.setdefault("segundos_invertidos", 0)

    return {
        "app": "SweetList",
        "version": 1,
        "fecha_respaldo": datetime.now(timezone.utc).isoformat(),
        "usuario": Usuario.model_validate(db.a_json(usuario)).model_dump(mode="json"),
        "tags": await todos(db.tags, "nombre"),
        "listas": await todos(db.listas, "nombre"),
        "tareas": tareas,
        "sesiones_pomodoro": await todos(db.pomodoros, "inicio"),
    }


def _nombre_archivo(respaldo: dict, extension: str) -> str:
    return f"sweetlist-respaldo-{respaldo['usuario']['usuario']}-{date.today()}.{extension}"


@router.get("/respaldo")
async def respaldo_json(usuario_id: str):
    """Descarga el respaldo como archivo .json."""
    respaldo = await armar_respaldo(usuario_id)
    return Response(
        content=json.dumps(respaldo, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{_nombre_archivo(respaldo, "json")}"'},
    )


@router.get("/respaldo.pdf")
async def respaldo_pdf(usuario_id: str):
    """Descarga el respaldo como PDF con el estilo de SweetList."""
    respaldo = await armar_respaldo(usuario_id)
    return Response(
        content=generar_pdf(respaldo),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{_nombre_archivo(respaldo, "pdf")}"'},
    )
