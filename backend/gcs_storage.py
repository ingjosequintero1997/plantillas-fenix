import os
import json
import time
import urllib.request
import urllib.error
import urllib.parse

# Workload Identity Federation (sin claves): la app se autentica con el token
# OIDC de Vercel (header x-vercel-oidc-token) y lo intercambia por un token de
# acceso corto con el que llama a la API de Google Cloud Storage.
REQUIRED_ENV = (
    "GCP_PROJECT_ID",
    "GCP_PROJECT_NUMBER",
    "GCP_SERVICE_ACCOUNT_EMAIL",
    "GCP_WORKLOAD_IDENTITY_POOL_ID",
    "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID",
    "GCS_BUCKET_NAME",
)

GCS_ENABLED = all(os.environ.get(k) for k in REQUIRED_ENV)

STS_URL = "https://sts.googleapis.com/v1/token"
IAM_URL = "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/{sa}:generateAccessToken"
STORAGE_API = "https://storage.googleapis.com/storage/v1/b/{bucket}/o"
UPLOAD_API = "https://storage.googleapis.com/upload/storage/v1/b/{bucket}/o"

_cache = {"token": None, "expiry": 0.0}


def gcs_enabled():
    return GCS_ENABLED


def _audience():
    return (
        "//iam.googleapis.com/projects/{num}/locations/global/"
        "workloadIdentityPools/{pool}/providers/{prov}"
    ).format(
        num=os.environ["GCP_PROJECT_NUMBER"],
        pool=os.environ["GCP_WORKLOAD_IDENTITY_POOL_ID"],
        prov=os.environ["GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID"],
    )


def _http(method, url, body=None, headers=None, raw=False):
    data = body if raw else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            return content.decode("utf-8") if not raw else content
    except urllib.error.HTTPError as e:
        raise RuntimeError("{} {}".format(e.code, e.read()[:500]))


def _get_access_token(oidc_token):
    now = time.time()
    if _cache["token"] and _cache["expiry"] > now + 60:
        return _cache["token"]

    sts_body = {
        "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
        "audience": _audience(),
        "scope": "https://www.googleapis.com/auth/cloud-platform",
        "requested_token_type": "urn:ietf:params:oauth:token-type:access_token",
        "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
        "subject_token": oidc_token,
    }
    sts = json.loads(_http(
        "POST",
        STS_URL,
        sts_body,
        {"Content-Type": "application/json"},
    ))
    sts_token = sts["access_token"]

    iam = json.loads(_http(
        "POST",
        IAM_URL.format(sa=os.environ["GCP_SERVICE_ACCOUNT_EMAIL"]),
        {"scope": ["https://www.googleapis.com/auth/cloud-platform"]},
        {"Authorization": "Bearer " + sts_token, "Content-Type": "application/json"},
    ))
    _cache["token"] = iam["accessToken"]
    _cache["expiry"] = now + 3300  # ~55 min, margen sobre la hora de vida
    return _cache["token"]


def _auth_headers(oidc_token):
    return {"Authorization": "Bearer " + _get_access_token(oidc_token)}


def upload_pdf(oidc_token, blob_path, content, content_type):
    url = UPLOAD_API.format(bucket=os.environ["GCS_BUCKET_NAME"]) + "?uploadType=media&name=" + urllib.parse.quote(blob_path, safe="/")
    headers = _auth_headers(oidc_token)
    headers["Content-Type"] = content_type or "application/pdf"
    _http("POST", url, content, headers, raw=True)
    return blob_path


def download_pdf(oidc_token, blob_path):
    url = STORAGE_API.format(bucket=os.environ["GCS_BUCKET_NAME"]) + "/" + urllib.parse.quote(blob_path, safe="/") + "?alt=media"
    return _http("GET", url, headers=_auth_headers(oidc_token), raw=True)


def delete_pdf(oidc_token, blob_path):
    url = STORAGE_API.format(bucket=os.environ["GCS_BUCKET_NAME"]) + "/" + urllib.parse.quote(blob_path, safe="/")
    _http("DELETE", url, headers=_auth_headers(oidc_token))