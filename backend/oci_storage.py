import os
import json
import logging
import tempfile
from datetime import datetime, timezone

OCI_ENV_KEYS = (
    "OCI_TENANCY",
    "OCI_USER",
    "OCI_FINGERPRINT",
    "OCI_REGION",
    "OCI_NAMESPACE",
    "OCI_BUCKET",
)

def _has_key():
    return bool(os.environ.get("OCI_PRIVATE_KEY") or (os.environ.get("OCI_PRIVATE_KEY_PART1") and os.environ.get("OCI_PRIVATE_KEY_PART2")))

OCI_ENABLED = all(os.environ.get(k) for k in OCI_ENV_KEYS) and _has_key()
log = logging.getLogger("oci_storage")


def oci_enabled():
    return OCI_ENABLED


def _get_raw_key():
    pk = os.environ.get("OCI_PRIVATE_KEY", "").strip()
    if pk:
        return pk
    p1 = os.environ.get("OCI_PRIVATE_KEY_PART1", "").strip()
    p2 = os.environ.get("OCI_PRIVATE_KEY_PART2", "").strip()
    if p1 and p2:
        import base64
        combined = p1 + p2
        return base64.b64decode(combined).decode("utf-8")
    return ""


def _fix_pem(raw):
    raw = raw.strip()
    if "-----BEGIN" in raw:
        if "\\n" in raw:
            raw = raw.replace("\\n", "\n")
        if "\\r" in raw:
            raw = raw.replace("\\r", "")
        raw = raw.replace("\r\n", "\n").replace("\r", "\n")
        has_begin = "-----BEGIN PRIVATE KEY-----" in raw
        has_end = "-----END PRIVATE KEY-----" in raw
        if has_begin and "\n" in raw.split("-----BEGIN PRIVATE KEY-----")[1][:5]:
            return raw
        header = "-----BEGIN PRIVATE KEY-----\n" if has_begin else ""
        footer = "\n-----END PRIVATE KEY-----\n" if has_end else ""
        body = raw
        if has_begin:
            body = raw.split("-----BEGIN PRIVATE KEY-----")[1]
        if has_end:
            body = body.split("-----END PRIVATE KEY-----")[0]
        body = body.replace(" ", "").replace("\r", "").replace("\n", "").replace("\t", "")
        lines = [body[i:i+64] for i in range(0, len(body), 64)]
        return header + "\n".join(lines) + footer
    else:
        import base64
        try:
            decoded = base64.b64decode(raw).decode("utf-8")
            if "-----BEGIN PRIVATE KEY-----" in decoded:
                return _fix_pem(decoded)
        except Exception:
            pass
        return raw


def _get_client():
    if not OCI_ENABLED:
        raise RuntimeError("OCI no esta habilitado. Faltan variables de entorno.")
    try:
        import oci
        key_content = _fix_pem(_get_raw_key())
        key_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem", mode="w", encoding="utf-8")
        key_file.write(key_content)
        key_file.flush()
        os.fsync(key_file.fileno())
        key_file.close()
        cfg = {
            "tenancy": os.environ["OCI_TENANCY"],
            "user": os.environ["OCI_USER"],
            "fingerprint": os.environ["OCI_FINGERPRINT"],
            "region": os.environ["OCI_REGION"],
            "key_file": key_file.name,
        }
        client = oci.object_storage.ObjectStorageClient(config=cfg)
        return client
    except ImportError:
        raise RuntimeError("Modulo 'oci' no instalado. Ejecuta: pip install oci")
    except Exception as e:
        raise RuntimeError(f"Error al crear cliente OCI: {e}")


def upload_pdf(object_name, content, content_type="application/pdf"):
    client = _get_client()
    namespace = os.environ["OCI_NAMESPACE"]
    bucket = os.environ["OCI_BUCKET"]
    try:
        import io
        stream = io.BytesIO(content)
        client.put_object(namespace, bucket, object_name, stream, content_type=content_type)
        log.info(f"PDF subido a OCI: {object_name}")
        return object_name
    except Exception as e:
        log.error(f"Error subiendo a OCI: {e}")
        raise


def download_pdf(object_name):
    client = _get_client()
    namespace = os.environ["OCI_NAMESPACE"]
    bucket = os.environ["OCI_BUCKET"]
    try:
        resp = client.get_object(namespace, bucket, object_name)
        return resp.data.content
    except Exception as e:
        log.error(f"Error descargando de OCI: {e}")
        raise


def delete_pdf(object_name):
    client = _get_client()
    namespace = os.environ["OCI_NAMESPACE"]
    bucket = os.environ["OCI_BUCKET"]
    try:
        client.delete_object(namespace, bucket, object_name)
        log.info(f"PDF eliminado de OCI: {object_name}")
    except Exception as e:
        log.error(f"Error eliminando de OCI: {e}")
        raise
