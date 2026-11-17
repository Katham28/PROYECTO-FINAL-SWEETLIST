import hashlib
import hmac
import secrets

ITERACIONES = 200_000


def hashear(contrasena: str) -> str:
    sal = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", contrasena.encode(), bytes.fromhex(sal), ITERACIONES)
    return f"{sal}${h.hex()}"


def verificar(contrasena: str, guardado: str) -> bool:
    try:
        sal, esperado = guardado.split("$", 1)
    except ValueError:
        return False
    h = hashlib.pbkdf2_hmac("sha256", contrasena.encode(), bytes.fromhex(sal), ITERACIONES)
    return hmac.compare_digest(h.hex(), esperado)
