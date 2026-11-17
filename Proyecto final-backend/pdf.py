"""Genera el PDF "aesthetic" del respaldo con ReportLab (dibujado a mano sobre el canvas).

Colores tomados de src/tema.ts de la app para que se vea igual que SweetList.
"""

from collections import defaultdict
from datetime import datetime
from io import BytesIO

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen.canvas import Canvas

ROSA = HexColor("#ff4f8b")
ROSA_CLARO = HexColor("#ff7eb3")
ROSA_PASTEL = HexColor("#ffadd0")
BORDE = HexColor("#ffd1e1")
FONDO = HexColor("#fff0f5")
FONDO_TARJETA = HexColor("#fff8fb")
TEXTO = HexColor("#444444")
SUAVE = HexColor("#888888")
TOMATE = HexColor("#ff6b6b")
VERDE = HexColor("#28a745")

ANCHO, ALTO = A4
MARGEN = 40
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def tiempo_bonito(segundos: int) -> str:
    h, resto = divmod(int(segundos), 3600)
    m = resto // 60
    if h and m:
        return f"{h} h {m} min"
    if h:
        return f"{h} h"
    return f"{m} min"


def fecha_bonita(texto: str) -> str:
    try:
        d = datetime.strptime(texto[:10], "%Y-%m-%d")
        return f"{d.day} de {MESES[d.month - 1]} {d.year}"
    except ValueError:
        return texto


def color_seguro(hexa: str, defecto=ROSA_PASTEL):
    try:
        return HexColor(hexa)
    except (ValueError, TypeError):
        return defecto


def suavizar(color, cuanto: float = 0.6):
    """Mezcla el color con blanco (versión pastel para fondos de chips)."""
    return Color(
        color.red + (1 - color.red) * cuanto,
        color.green + (1 - color.green) * cuanto,
        color.blue + (1 - color.blue) * cuanto,
    )


class Documento:
    def __init__(self, nombre_usuario: str):
        self.buf = BytesIO()
        self.c = Canvas(self.buf, pagesize=A4)
        self.c.setTitle(f"SweetList - Respaldo de {nombre_usuario}")
        self.c.setAuthor("SweetList")
        self.pagina = 0
        self.y = 0.0

    # ---------- página ----------
    def nueva_pagina(self):
        if self.pagina:
            self.pie()
            self.c.showPage()
        self.pagina += 1
        self.c.setFillColor(FONDO)
        self.c.rect(0, 0, ANCHO, ALTO, stroke=0, fill=1)
        # Burbujas decorativas
        self.c.setFillColor(ROSA_PASTEL)
        self.c.setFillAlpha(0.25)
        self.c.circle(ANCHO - 30, 40, 70, stroke=0, fill=1)
        self.c.circle(20, ALTO * 0.45, 45, stroke=0, fill=1)
        self.c.setFillAlpha(1)
        self.y = ALTO - MARGEN

    def pie(self):
        self.c.setFont("Helvetica", 8)
        self.c.setFillColor(SUAVE)
        self.c.drawString(MARGEN, 22, "Generado con SweetList")
        self.c.drawRightString(ANCHO - MARGEN, 22, f"Página {self.pagina}")

    def espacio(self, alto: float):
        """Si no cabe `alto` en la página, empieza otra."""
        if self.y - alto < 50:
            self.nueva_pagina()

    # ---------- piezas ----------
    def encabezado(self, titulo: str, subtitulo: str, fecha: str):
        alto = 120
        top = ALTO - 25
        self.c.saveState()
        p = self.c.beginPath()
        p.roundRect(25, top - alto, ANCHO - 50, alto, 22)
        self.c.clipPath(p, stroke=0)
        self.c.linearGradient(25, top, ANCHO - 25, top - alto, (ROSA_CLARO, ROSA), extend=False)
        self.c.setFillColor(white)
        self.c.setFillAlpha(0.15)
        self.c.circle(ANCHO - 70, top - 20, 60, stroke=0, fill=1)
        self.c.circle(ANCHO - 150, top - alto + 5, 35, stroke=0, fill=1)
        self.c.restoreState()

        self.c.setFillColor(white)
        self.c.setFont("Helvetica-Bold", 30)
        self.c.drawString(MARGEN + 10, top - 50, titulo)
        self.c.setFont("Helvetica", 13)
        self.c.drawString(MARGEN + 10, top - 75, subtitulo)
        self.c.setFont("Helvetica-Oblique", 9)
        self.c.drawString(MARGEN + 10, top - 98, fecha)
        self.y = top - alto - 25

    def frase(self, texto: str):
        if not texto:
            return
        lineas = simpleSplit(f"“{texto}”", "Helvetica-Oblique", 11, ANCHO - 2 * MARGEN - 20)
        self.espacio(16 * len(lineas) + 10)
        self.c.setFont("Helvetica-Oblique", 11)
        self.c.setFillColor(ROSA)
        for linea in lineas:
            self.c.drawCentredString(ANCHO / 2, self.y, linea)
            self.y -= 16
        self.y -= 10

    def resumen(self, datos: list[tuple[str, str]]):
        n = len(datos)
        sep = 10
        ancho = (ANCHO - 2 * MARGEN - sep * (n - 1)) / n
        alto = 62
        self.espacio(alto + 20)
        for i, (valor, etiqueta) in enumerate(datos):
            x = MARGEN + i * (ancho + sep)
            self.c.setFillColor(white)
            self.c.setStrokeColor(BORDE)
            self.c.setLineWidth(1.5)
            self.c.roundRect(x, self.y - alto, ancho, alto, 14, stroke=1, fill=1)
            self.c.setFillColor(ROSA)
            self.c.setFont("Helvetica-Bold", 18)
            self.c.drawCentredString(x + ancho / 2, self.y - 30, valor)
            self.c.setFillColor(SUAVE)
            self.c.setFont("Helvetica", 8.5)
            self.c.drawCentredString(x + ancho / 2, self.y - 47, etiqueta)
        self.y -= alto + 24

    def titulo_seccion(self, texto: str, extra: str):
        self.espacio(70)  # que el título no quede solo al final de la página
        self.c.setFont("Helvetica-Bold", 12)
        ancho = self.c.stringWidth(texto, "Helvetica-Bold", 12) + 28
        self.c.setFillColor(ROSA)
        self.c.roundRect(MARGEN, self.y - 22, ancho, 24, 12, stroke=0, fill=1)
        self.c.setFillColor(white)
        self.c.drawString(MARGEN + 14, self.y - 14.5, texto)
        self.c.setFillColor(SUAVE)
        self.c.setFont("Helvetica", 9)
        self.c.drawString(MARGEN + ancho + 10, self.y - 14.5, extra)
        self.y -= 36

    def chip(self, x: float, y: float, texto: str, fondo, color=TEXTO) -> float:
        self.c.setFont("Helvetica-Bold", 8)
        ancho = self.c.stringWidth(texto, "Helvetica-Bold", 8) + 14
        self.c.setFillColor(fondo)
        self.c.roundRect(x, y - 4, ancho, 15, 7.5, stroke=0, fill=1)
        self.c.setFillColor(color)
        self.c.drawString(x + 7, y + 0.5, texto)
        return x + ancho + 6

    def tomate(self, x: float, y: float):
        self.c.setFillColor(TOMATE)
        self.c.circle(x, y, 4.2, stroke=0, fill=1)
        self.c.setFillColor(VERDE)
        self.c.ellipse(x - 2.5, y + 2.6, x + 2.5, y + 5, stroke=0, fill=1)

    def tarjeta_tarea(self, t: dict, color_tag):
        ancho_texto = ANCHO - 2 * MARGEN - 50
        desc = simpleSplit(t.get("descripcion") or "", "Helvetica", 9.5, ancho_texto)[:6]
        alto = 30 + 13 * len(desc) + 24
        self.espacio(alto + 10)
        x0, top = MARGEN, self.y

        self.c.setFillColor(white)
        self.c.setStrokeColor(BORDE)
        self.c.setLineWidth(1)
        self.c.roundRect(x0, top - alto, ANCHO - 2 * MARGEN, alto, 12, stroke=1, fill=1)
        # franja de color del tag
        self.c.saveState()
        p = self.c.beginPath()
        p.roundRect(x0, top - alto, ANCHO - 2 * MARGEN, alto, 12)
        self.c.clipPath(p, stroke=0)
        self.c.setFillColor(color_tag)
        self.c.rect(x0, top - alto, 6, alto, stroke=0, fill=1)
        self.c.restoreState()

        # casilla de hecha
        cx, cy = x0 + 22, top - 20
        self.c.setLineWidth(1.5)
        if t.get("hecha"):
            self.c.setFillColor(ROSA)
            self.c.setStrokeColor(ROSA)
            self.c.circle(cx, cy, 7, stroke=1, fill=1)
            self.c.setStrokeColor(white)
            self.c.setLineWidth(1.8)
            self.c.lines([(cx - 3.5, cy, cx - 1, cy - 2.8), (cx - 1, cy - 2.8, cx + 3.8, cy + 3)])
        else:
            self.c.setStrokeColor(ROSA_PASTEL)
            self.c.circle(cx, cy, 7, stroke=1, fill=0)

        # título y fecha
        tx = x0 + 38
        self.c.setFillColor(SUAVE if t.get("hecha") else TEXTO)
        self.c.setFont("Helvetica-Bold", 11.5)
        titulo = simpleSplit(t.get("titulo", ""), "Helvetica-Bold", 11.5, ancho_texto - 110)[0]
        self.c.drawString(tx, top - 24, titulo)
        if t.get("hecha"):
            w = self.c.stringWidth(titulo, "Helvetica-Bold", 11.5)
            self.c.setStrokeColor(SUAVE)
            self.c.setLineWidth(0.8)
            self.c.line(tx, top - 20, tx + w, top - 20)
        self.c.setFont("Helvetica", 8.5)
        self.c.setFillColor(SUAVE)
        self.c.drawRightString(ANCHO - MARGEN - 14, top - 23, fecha_bonita(t.get("fecha", "")))

        # descripción
        y = top - 40
        self.c.setFont("Helvetica", 9.5)
        self.c.setFillColor(SUAVE)
        for linea in desc:
            self.c.drawString(tx, y, linea)
            y -= 13

        # chips: tag, lista y pomodoros
        y -= 4
        x = tx
        if t.get("tag"):
            x = self.chip(x, y, t["tag"], suavizar(color_seguro(t.get("color_tag", ""))))
        x = self.chip(x, y, t.get("lista", ""), HexColor("#eeeeee"), HexColor("#555555"))
        pomos = t.get("pomodoros", 0)
        if pomos:
            self.tomate(x + 6, y + 3)
            texto = f"{pomos} pomodoro{'s' if pomos != 1 else ''} · {tiempo_bonito(t.get('segundos_invertidos', 0))}"
            self.c.setFont("Helvetica-Bold", 8.5)
            self.c.setFillColor(TOMATE)
            self.c.drawString(x + 15, y + 0.5, texto)

        self.y = top - alto - 10

    def terminar(self) -> bytes:
        self.pie()
        self.c.save()
        return self.buf.getvalue()


def sin_emojis(valor):
    """Helvetica solo trae letras latinas: se quitan emojis y símbolos que saldrían como ■."""
    if isinstance(valor, str):
        limpio = []
        for ch in valor:
            try:
                ch.encode("cp1252")
                limpio.append(ch)
            except UnicodeEncodeError:
                pass
        return " ".join("".join(limpio).split())
    if isinstance(valor, dict):
        return {k: sin_emojis(v) for k, v in valor.items()}
    if isinstance(valor, list):
        return [sin_emojis(v) for v in valor]
    return valor


def generar_pdf(respaldo: dict) -> bytes:
    respaldo = sin_emojis(respaldo)
    usuario = respaldo["usuario"]
    tareas = respaldo["tareas"]
    colores_tag = {t["nombre"]: t["color"] for t in respaldo["tags"]}
    nombre = usuario.get("nombre") or usuario["usuario"]

    doc = Documento(nombre)
    doc.nueva_pagina()
    ahora = datetime.now()
    doc.encabezado(
        "SweetList",
        f"Respaldo de tareas de {nombre}",
        f"Generado el {ahora.day} de {MESES[ahora.month - 1]} {ahora.year} a las {ahora:%H:%M}",
    )
    doc.frase(usuario.get("frase", ""))

    hechas = sum(1 for t in tareas if t.get("hecha"))
    pomodoros = len(respaldo["sesiones_pomodoro"])
    segundos = sum(p["duracion_seg"] for p in respaldo["sesiones_pomodoro"])
    doc.resumen([
        (str(len(tareas)), "TAREAS"),
        (str(hechas), "COMPLETADAS"),
        (str(pomodoros), "POMODOROS"),
        (tiempo_bonito(segundos), "TIEMPO ENFOCADO"),
    ])

    if not tareas:
        doc.c.setFont("Helvetica-Oblique", 12)
        doc.c.setFillColor(SUAVE)
        doc.c.drawCentredString(ANCHO / 2, doc.y - 20, "Todavía no hay tareas.")
        return doc.terminar()

    por_lista: dict[str, list[dict]] = defaultdict(list)
    for t in tareas:
        por_lista[t.get("lista") or "General"].append(t)

    for lista in sorted(por_lista):
        grupo = sorted(por_lista[lista], key=lambda t: (t.get("hecha", False), t.get("fecha", "")))
        n_hechas = sum(1 for t in grupo if t.get("hecha"))
        doc.titulo_seccion(lista, f"{n_hechas} de {len(grupo)} completadas")
        for t in grupo:
            color = color_seguro(colores_tag.get(t.get("tag", ""), ""))
            doc.tarjeta_tarea({**t, "color_tag": colores_tag.get(t.get("tag", ""), "")}, color)
        doc.y -= 6

    return doc.terminar()
