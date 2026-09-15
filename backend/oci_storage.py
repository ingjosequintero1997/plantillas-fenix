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


def _get_config():
    return {
        "tenancy": os.environ["OCI_TENANCY"],
        "user": os.environ["OCI_USER"],
        "fingerprint": os.environ["OCI_FINGERPRINT"],
        "key_file": None,
        "region": os.environ["OCI_REGION"],
        "namespace": os.environ["OCI_NAMESPACE"],
        "bucket": os.environ["OCI_BUCKET"],
        "private_key_pem": os.environ["OCI_PRIVATE_KEY"],
    }


def _get_client():
    if not OCI_ENABLED:
        raise RuntimeError("OCI no esta habilitado. Faltan variables de entorno.")
    try:
        import oci
        cfg = {
            "tenancy": os.environ["OCI_TENANCY"],
            "user": os.environ["OCI_USER"],
            "fingerprint": os.environ["OCI_FINGERPRINT"],
            "region": os.environ["OCI_REGION"],
            "key_content": os.environ["OCI_PRIVATE_KEY"],
        }
        signer = oci.signer.Signer(
            tenancy=os.environ["OCI_TENANCY"],
            user=os.environ["OCI_USER"],
            fingerprint=os.environ["OCI_FINGERPRINT"],
            private_key_data=os.environ["OCI_PRIVATE_KEY"].encode(),
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
        # upload_stream requiere un stream con longitud conocida
        import io
        stream = io.BytesIO(content)
        resp = client.put_object(
            namespace_name=namespace,
            bucket_name=bucket,
            object_name=object_name,
            content_length=len(content),
            put_object_body=stream,
            content_type=content_type,
        )
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
        resp = client.get_object(
            namespace_name=namespace,
            bucket_name=bucket,
            object_name=object_name,
        )
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
        client.delete_object(
            namespace_name=namespace,
            bucket_name=bucket,
            object_name=object_name,
        )
        log.info(f"PDF eliminado de OCI: {object_name}")
    except Exception as e:
        log.error(f"Error eliminando de OCI: {e}")
        raise
