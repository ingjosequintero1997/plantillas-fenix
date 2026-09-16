import os
import json
import logging
import hashlib
import base64
from datetime import datetime, timezone
from urllib.parse import urlsplit

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
        try:
            decoded = base64.b64decode(raw).decode("utf-8")
            if "-----BEGIN PRIVATE KEY-----" in decoded:
                return _fix_pem(decoded)
        except Exception:
            pass
        return raw


def _get_private_key():
    from cryptography.hazmat.primitives import serialization
    key_content = _fix_pem(_get_raw_key())
    return serialization.load_pem_private_key(key_content.encode("utf-8"), password=None)


def _build_auth(method, path, extra_headers):
    """Construye el header Authorization OCI (formato http-signature)."""
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding
    tenancy = os.environ["OCI_TENANCY"]
    user = os.environ["OCI_USER"]
    fingerprint = os.environ["OCI_FINGERPRINT"]
    key_id = f"{tenancy}/{user}/{fingerprint}"

    ordered = ["(request-target)", "host", "date"]
    for k in ("content-type", "content-length", "x-content-sha256"):
        if k in extra_headers:
            ordered.append(k)

    lines = []
    for name in ordered:
        if name == "(request-target)":
            lines.append(f"(request-target): {method.lower()} {path}")
        else:
            lines.append(f"{name}: {extra_headers[name]}")

    signable = "\n".join(lines).encode("ascii")
    signature = _get_private_key().sign(signable, padding.PKCS1v15(), hashes.SHA256())
    sig_b64 = base64.b64encode(signature).decode("ascii")
    header_names = " ".join(ordered)
    return (
        f'Signature version="1",headers="{header_names}",'
        f'keyId="{key_id}",algorithm="rsa-sha256",signature="{sig_b64}"'
    )


def _base_url():
    region = os.environ["OCI_REGION"]
    namespace = os.environ["OCI_NAMESPACE"]
    bucket = os.environ["OCI_BUCKET"]
    return f"https://objectstorage.{region}.oraclecloud.com/n/{namespace}/b/{bucket}/o/", f"objectstorage.{region}.oraclecloud.com"


def upload_pdf(object_name, content, content_type="application/pdf"):
    import requests
    base_url, host = _base_url()
    url = base_url + object_name
    path = urlsplit(url).path
    date_str = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    body_sha256 = hashlib.sha256(content).hexdigest()
    headers = {
        "host": host,
        "date": date_str,
        "content-type": content_type,
        "content-length": str(len(content)),
        "x-content-sha256": body_sha256,
    }
    auth = _build_auth("PUT", path, headers)
    req_headers = dict(headers)
    req_headers["authorization"] = auth
    req_headers["opc-request-id"] = f"fenix-{hashlib.sha1(object_name.encode()).hexdigest()[:16]}"
    resp = requests.put(url, data=content, headers=req_headers)
    if resp.status_code >= 400:
        raise RuntimeError(f"OCI upload failed ({resp.status_code}): {resp.text[:500]}")
    log.info(f"PDF subido a OCI: {object_name}")
    return object_name


def download_pdf(object_name):
    import requests
    base_url, host = _base_url()
    url = base_url + object_name
    path = urlsplit(url).path
    date_str = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    headers = {"host": host, "date": date_str}
    auth = _build_auth("GET", path, headers)
    req_headers = dict(headers)
    req_headers["authorization"] = auth
    resp = requests.get(url, headers=req_headers)
    if resp.status_code >= 400:
        raise RuntimeError(f"OCI download failed ({resp.status_code}): {resp.text[:500]}")
    return resp.content


def delete_pdf(object_name):
    import requests
    base_url, host = _base_url()
    url = base_url + object_name
    path = urlsplit(url).path
    date_str = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
    headers = {"host": host, "date": date_str}
    auth = _build_auth("DELETE", path, headers)
    req_headers = dict(headers)
    req_headers["authorization"] = auth
    resp = requests.delete(url, headers=req_headers)
    if resp.status_code >= 400:
        raise RuntimeError(f"OCI delete failed ({resp.status_code}): {resp.text[:500]}")
    log.info(f"PDF eliminado de OCI: {object_name}")
    return True