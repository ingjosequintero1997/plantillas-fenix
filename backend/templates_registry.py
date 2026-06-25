from __future__ import annotations

try:
    from .template_config import get_rcv_template
    from .gestante_config import get_gestante_template
    from .citologia_config import get_citologia_template
    from .mamografia_config import get_mamografia_template
    from .penta_config import get_penta_template
except ImportError:
    from template_config import get_rcv_template
    from gestante_config import get_gestante_template
    from citologia_config import get_citologia_template
    from mamografia_config import get_mamografia_template
    from penta_config import get_penta_template


TEMPLATE_REGISTRY = {
    "rcv": {
        "key": "rcv",
        "label": "Plantilla RCV",
        "description": "Riesgo cardiovascular y seguimiento crónico.",
        "template_factory": get_rcv_template,
    },
    "gestante": {
        "key": "gestante",
        "label": "Plantilla Gestante",
        "description": "Ruta materno perinatal y controles prenatales.",
        "template_factory": get_gestante_template,
    },
    "citologia": {
        "key": "citologia",
        "label": "Plantilla Citología",
        "description": "Tamizaje de cáncer cervicouterino y seguimiento.",
        "template_factory": get_citologia_template,
    },
    "mamografia": {
        "key": "mamografia",
        "label": "Plantilla Mamografía",
        "description": "Tamizaje de cáncer de mama y seguimiento.",
        "template_factory": get_mamografia_template,
    },
    "penta": {
        "key": "penta",
        "label": "Plantilla Penta",
        "description": "Vacunación pentavalente y seguimiento.",
        "template_factory": get_penta_template,
    },
}


def get_template_by_key(template_key: str):
    key = (template_key or "rcv").strip().lower()
    if key not in TEMPLATE_REGISTRY:
        return TEMPLATE_REGISTRY["rcv"]
    entry = TEMPLATE_REGISTRY[key]
    return {
        "key": entry["key"],
        "label": entry["label"],
        "description": entry["description"],
        "template": entry["template_factory"](),
    }


def list_templates_meta():
    return [
        {
            "key": item["key"],
            "label": item["label"],
            "description": item["description"],
            "fields": len(item["template_factory"]()),
        }
        for item in TEMPLATE_REGISTRY.values()
    ]
