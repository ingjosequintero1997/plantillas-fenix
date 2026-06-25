import unicodedata
import re
try:
    from rapidfuzz import process, fuzz
except Exception:  # fallback si la dependencia aún no está instalada
    import difflib

    class _FallbackFuzz:
        @staticmethod
        def token_sort_ratio(a, b):
            a_sorted = " ".join(sorted(str(a).split()))
            b_sorted = " ".join(sorted(str(b).split()))
            return int(difflib.SequenceMatcher(None, a_sorted, b_sorted).ratio() * 100)

    class _FallbackProcess:
        @staticmethod
        def extractOne(query, choices, scorer):
            scored = [(choice, scorer(query, choice), None) for choice in choices]
            return max(scored, key=lambda item: item[1]) if scored else None

    process = _FallbackProcess()
    fuzz = _FallbackFuzz()

HEADER_ALIASES = {
    "REGIMEN DE AFILIACION": {
        "REGIMEN AFILIACION", "TIPO DE REGIMEN", "REGIMEN", "AFILIACION", "REGIMEN DE AFILIACION"
    },
    "GRUPO POBLACIONAL": {
        "GRUPO POBLACIONAL", "GRUPO POBLACIONA", "POBLACIONAL", "GRUPO POBLACION"
    },
    "ETNIA": {
        "ETNIA", "PUEBLO", "GRUPO ETNICO", "ETNICO"
    },
    "MUNICIPIO DE RESIDENCIA": {
        "MUNICIPIO DE RESIDENCIA", "MUNICIPIO RESIDENCIA", "MUNICIPIO", "CODIGO MUNICIPIO", "MUNICIPIO DANE"
    },
    "FACTOR DE RIESGO POR PA": {
        "FACTOR DE RIESGO POR PA", "RIESGO POR PA", "FACTOR RIESGO PA", "CLASIFICACION DE RIESGO POR PA"
    },
    "REPORTE DE HEMOGLOBINA GLICOSILADA (SOLO PARA USUARIOS CON DX DE DM)": {
        "REPORTE DE HEMOGLOBINA GLICOSILADA",
        "HEMOGLOBINA GLICOSILADA",
        "HBA1C",
        "HB GLICOSILADA",
        "REPORTE HEMOGLOBINA GLICOSILADA"
    },
}

def normalize_text(value: str) -> str:
    if value is None:
        return ""
    text = str(value).strip().upper()
    text = ''.join(ch for ch in unicodedata.normalize('NFD', text) if unicodedata.category(ch) != 'Mn')
    # Unifica abreviaturas frecuentes en plantillas IPS.
    text = re.sub(r"\b(NO|NRO|N\s*°|NUM\.)\b", " NUMERO ", text)
    text = re.sub(r"\b1ER\b", " PRIMER ", text)
    text = re.sub(r"\b2DO\b", " SEGUNDO ", text)
    text = re.sub(r"\b3ER\b", " TERCER ", text)
    text = re.sub(r"\b4TO\b", " CUARTO ", text)
    for ch in ['_', '-', '/', '\\', '.', ',', ';', '(', ')', '?', ':', '*', '[', ']', '{', '}', '"', "'", '#', '|']:
        text = text.replace(ch, ' ')
    return ' '.join(text.split())

def _score_pair(source: str, target: str) -> float:
    # Puntaje combinado para soportar encabezados similares pero no exactos.
    token_sort = fuzz.token_sort_ratio(source, target)
    token_set = fuzz.token_set_ratio(source, target)
    partial = fuzz.partial_ratio(source, target)
    return max(token_sort, token_set, partial)


def _build_canonical_template_map(template_names: list[str]) -> dict[str, str]:
    canonical = {}
    normalized_aliases = {
        normalize_text(key): value
        for key, value in HEADER_ALIASES.items()
    }
    for name in template_names:
        normalized = normalize_text(name)
        canonical[normalized] = name
        for alias in normalized_aliases.get(normalized, set()):
            canonical[normalize_text(alias)] = name
    return canonical


def fuzzy_map(headers: list, template_names: list, score_cutoff: int = 62) -> dict:
    mapping = {header: None for header in headers}
    normalized_template = [normalize_text(name) for name in template_names]
    canonical_template = _build_canonical_template_map(template_names)

    used_templates = set()
    used_headers = set()

    # Primero aplica coincidencia exacta/canónica para evitar cruces en campos sensibles.
    for header in headers:
        norm_header = normalize_text(header)
        exact = canonical_template.get(norm_header)
        if exact is None:
            continue
        mapping[header] = exact
        used_headers.add(header)
        used_templates.add(exact)

    # Candidatos globales para asignación uno-a-uno por mejor score.
    candidates = []
    for header in headers:
        if header in used_headers:
            continue
        norm_header = normalize_text(header)
        for idx, norm_tpl in enumerate(normalized_template):
            if template_names[idx] in used_templates:
                continue
            score = _score_pair(norm_header, norm_tpl)
            if score >= score_cutoff:
                candidates.append((score, header, idx))

    candidates.sort(key=lambda item: item[0], reverse=True)

    for score, header, tpl_idx in candidates:
        if header in used_headers or template_names[tpl_idx] in used_templates:
            continue
        mapping[header] = template_names[tpl_idx]
        used_headers.add(header)
        used_templates.add(template_names[tpl_idx])

    return mapping
