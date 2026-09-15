import os
import json
import logging
from datetime import datetime, timezone

REQUIRED_ENV = (
    "OCI_TENANCY",
    "OCI_USER",
    "OCI_FINGERPRINT",
    "OCI_PRIVATE_KEY",
    "OCI_REGION",
    "OCI_NAMESPACE",
    "OCI_BUCKET",
)

OCI_ENABLED = all(os.environ.get(k) for k in REQUIRED_ENV)
log = logging.getLogger("oci_storage")


def oci_enabled():
    return OCI_ENABLED


def _fix_pem(raw):
    """Arregla una key PEM que vino pegada en una sola linea."""
    raw = raw.strip()
    if "\\n" in raw:
        raw = raw.replace("\\n", "\n")
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
    body = body.replace(" ", "").replace("\n", "").replace("\r", "").replace("\t", "")
    lines = [body[i:i+64] for i in range(0, len(body), 64)]
    return header + "\n".join(lines) + footer


def _get_client():
    if not OCI_ENABLED:
        raise RuntimeError("OCI no esta habilitado. Faltan variables de entorno.")
    try:
        import oci
        import tempfile
        key_content = _fix_pem(os.environ["OCI_PRIVATE_KEY"])
        key_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem", mode="w")
        key_file.write(key_content)
        key_file.close()
        cfg = {
            "tenancy": os.environ["OCI_TENANCY"],
            "user": os.environ["OCI_USER"],
            "fingerprint": os.environ["OCI_FINGERPRINT"],
            "region": os.environ["OCI_REGION"],
            "key_file": key_file.name,
        }
        signer = oci.signer.Signer(
            tenancy=os.environ["OCI_TENANCY"],
            user=os.environ["OCI_USER"],
            fingerprint=os.environ["OCI_FINGERPRINT"],
            private_key_file_location=key_file.name,
        )
        client = oci.object_storage.ObjectStorageClient(
            config=cfg,
            signer=signer,
        )
        return client
    except ImportError:
        raise RuntimeError("Modulo 'oci' no instalado. Ejecuta: pip install oci")
    except Exception as e:
        raise RuntimeError(f"Error al crear cliente OCI: {e}")


def upload_pdf(object_name, content, content_type="application/pdf"):
    """Sube un PDF a OCI Object Storage."""
    import oci
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
    """Descarga un PDF de OCI Object Storage."""
    import oci
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
    """Elimina un PDF de OCI Object Storage."""
    import oci
    client = _get_client()
    namespace = os.environ["OCI_NAMESPACE"]
    bucket = os.environ["OCI_BUCKET"]
    try:
        client.delete_object(namespace, bucket, object_name)
        log.info(f"PDF eliminado de OCI: {object_name}")
    except Exception as e:
        log.error(f"Error eliminando de OCI: {e}")
        raise
