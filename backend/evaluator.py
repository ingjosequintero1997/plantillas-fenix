from __future__ import annotations
import io
import re
from datetime import datetime, timedelta
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, numbers
from openpyxl.utils import get_column_letter

# ── Helpers ──────────────────────────────────────────────────────────────────

def _to_num(val: str):
    try:
        return float(val.replace(",", "."))
    except (ValueError, AttributeError):
        return None


def _to_int(val: str):
    try:
        return int(float(val.replace(",", ".")))
    except (ValueError, AttributeError):
        return None


def _parse_date(val: str):
    if not val or val.strip().upper() in ("SIN DATO", "1900-01-01", ""):
        return None
    try:
        return pd.to_datetime(val.strip(), dayfirst=False, errors="coerce")
    except Exception:
        return None


def _is_yes(val: str) -> bool:
    v = val.strip().upper() if val else ""
    return v in ("SI", "SÍ", "YES", "1", "X", "DX CONFIRMADO")


def _six_months_ago(ref: datetime | None = None) -> datetime:
    ref = ref or datetime.now()
    return ref - timedelta(days=183)


def _age_in_range(val: str, lo: int = 18, hi: int = 69) -> bool:
    age = _to_int(val)
    return age is not None and lo <= age <= hi


def _find_col(df: pd.DataFrame, pattern: str) -> str | None:
    pat = re.sub(r"\s+", "", pattern.upper())
    for col in df.columns:
        if re.sub(r"\s+", "", col.upper()) == pat:
            return col
    for col in df.columns:
        if pat in re.sub(r"\s+", "", col.upper()):
            return col
    return None


def _col_val(row: pd.Series, col: str | None):
    if col is None:
        return ""
    v = row.get(col)
    return str(v).strip() if pd.notna(v) else ""


# ── RCV evaluation ───────────────────────────────────────────────────────────

def _evaluate_rcv(df: pd.DataFrame, today: datetime | None = None) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Returns (indicators_df, patients_df) for the RCV template.
    patients_df contains all patient data plus evaluation columns.
    """
    t = today or datetime.now()
    six_months = _six_months_ago(t)

    # Find relevant columns
    col_dm      = _find_col(df, "DX CONFIRMADO DM")
    col_hta     = _find_col(df, "DX CONFIRMADO HTA")
    col_hba1c   = _find_col(df, "REPORTE DE HEMOGLOBINA GLICOSILADA")
    col_hba1c_f = _find_col(df, "FECHA DE REPORTE DE HEMOGLOBINA GLICOSILADA")
    col_sys     = _find_col(df, "ULTIMA TENSION ARTERIAL SISTOLICA")
    col_dias    = _find_col(df, "ULTIMA TENSION ARTERIAL DIASTOLICA")
    col_pa_f    = _find_col(df, "FECHA DE LA ULTIMA TOMA DE PRESION ARTERIAL")
    col_edad    = _find_col(df, "EDAD")
    col_reg     = _find_col(df, "REGIMEN DE AFILIACION")

    # Evaluar cada paciente
    rows = []
    for _, row in df.iterrows():
        r = {}

        # Datos básicos
        for c in df.columns:
            r[c] = _col_val(row, c)

        # Indicador 1: DM controlado (HbA1c < 7%)
        dm_yes = _is_yes(_col_val(row, col_dm))
        hba1c_val = _to_num(_col_val(row, col_hba1c))
        hba1c_date = _parse_date(_col_val(row, col_hba1c_f))
        dm_controlled = (
            dm_yes
            and hba1c_val is not None
            and hba1c_val < 7.0
            and hba1c_date is not None
            and hba1c_date >= six_months
        )
        r["_DM_CONTROLADO"] = "SI" if dm_controlled else "NO"
        r["_TIENE_DM"] = "SI" if dm_yes else "NO"

        # Indicador 2: PA < 140/90
        sys = _to_int(_col_val(row, col_sys))
        dias = _to_int(_col_val(row, col_dias))
        pa_date = _parse_date(_col_val(row, col_pa_f))
        pa_140_90 = (
            sys is not None and dias is not None
            and sys < 140 and dias < 90
            and pa_date is not None and pa_date >= six_months
        )
        r["_PA_140_90"] = "SI" if pa_140_90 else "NO"

        # Indicador 3: PA < 150/90
        pa_150_90 = (
            sys is not None and dias is not None
            and sys < 150 and dias < 90
            and pa_date is not None and pa_date >= six_months
        )
        r["_PA_150_90"] = "SI" if pa_150_90 else "NO"

        # Indicador 4: Captación HTA 18-69 subsidiado
        edad    = _col_val(row, col_edad)
        reg     = _col_val(row, col_reg)
        hta_yes = _is_yes(_col_val(row, col_hta))
        in_range = _age_in_range(edad)
        subsidiado = reg.strip().upper() == "SUBSIDIADO"
        r["_HTA_CAPTADO"] = "SI" if (in_range and subsidiado and hta_yes) else "NO"
        r["_POBLACION_HTA"] = "SI" if (in_range and subsidiado) else "NO"

        # Indicador 5: Captación DM 18-69 subsidiado
        r["_DM_CAPTADO"] = "SI" if (in_range and subsidiado and dm_yes) else "NO"
        r["_POBLACION_DM"] = "SI" if (in_range and subsidiado) else "NO"

        rows.append(r)

    patients = pd.DataFrame(rows)

    # ── Cálculo de indicadores agregados ──
    total_pob = len(patients)

    def _count(flag_col: str) -> int:
        return int((patients[flag_col] == "SI").sum())

    def _pct(n: int, d: int) -> float:
        return round(n / d * 100, 2) if d else 0.0

    # Indicador 1
    n1 = _count("_DM_CONTROLADO")
    d1 = _count("_TIENE_DM")
    # Indicador 2
    n2 = _count("_PA_140_90")
    d2 = total_pob
    # Indicador 3
    n3 = _count("_PA_150_90")
    d3 = total_pob
    # Indicador 4
    n4 = _count("_HTA_CAPTADO")
    d4 = _count("_POBLACION_HTA")
    # Indicador 5
    n5 = _count("_DM_CAPTADO")
    d5 = _count("_POBLACION_DM")

    indicators = pd.DataFrame([
        {
            "INDICADOR": "Diabéticos controlados",
            "DEFINICIÓN": "Pacientes con DM con HbA1c < 7% en últimos 6 meses",
            "NUMERADOR": n1,
            "DENOMINADOR": d1,
            "META": "Bueno > 50% | Aceptable 30-50% | Crítico < 30%",
            "CUMPLIMIENTO": f"{_pct(n1, d1)}%",
        },
        {
            "INDICADOR": "Control PA < 140/90",
            "DEFINICIÓN": "Pacientes con PA < 140/90 mmHg en último semestre",
            "NUMERADOR": n2,
            "DENOMINADOR": d2,
            "META": "Bueno > 60% | Aceptable 40-60% | Crítico < 40%",
            "CUMPLIMIENTO": f"{_pct(n2, d2)}%",
        },
        {
            "INDICADOR": "Control PA < 150/90",
            "DEFINICIÓN": "Pacientes con PA < 150/90 mmHg en último semestre",
            "NUMERADOR": n3,
            "DENOMINADOR": d3,
            "META": "Bueno > 60% | Aceptable 40-60% | Crítico < 40%",
            "CUMPLIMIENTO": f"{_pct(n3, d3)}%",
        },
        {
            "INDICADOR": "Captación HTA 18-69 subsidiado",
            "DEFINICIÓN": "Pacientes 18-69 años régimen subsidiado con Dx HTA",
            "NUMERADOR": n4,
            "DENOMINADOR": d4,
            "META": "> 60%",
            "CUMPLIMIENTO": f"{_pct(n4, d4)}%",
        },
        {
            "INDICADOR": "Captación DM 18-69 subsidiado",
            "DEFINICIÓN": "Pacientes 18-69 años régimen subsidiado con Dx DM",
            "NUMERADOR": n5,
            "DENOMINADOR": d5,
            "META": "> 60%",
            "CUMPLIMIENTO": f"{_pct(n5, d5)}%",
        },
    ])

    return indicators, patients


# ── Generic fallback ─────────────────────────────────────────────────────────

def _evaluate_generic(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    indicators = pd.DataFrame([
        {"INDICADOR": "No hay indicadores definidos para esta plantilla",
         "DEFINICIÓN": "", "NUMERADOR": "", "DENOMINADOR": "",
         "META": "", "CUMPLIMIENTO": ""}
    ])
    return indicators, df


# ── Public API ───────────────────────────────────────────────────────────────

def evaluate(df: pd.DataFrame, template_key: str, today: datetime | None = None) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Evaluate indicators for the given corrected data.
    Only RCV template has defined indicators.
    """
    if template_key == "rcv":
        return _evaluate_rcv(df, today)
    available = {"rcv"}
    raise ValueError(
        f"La plantilla '{template_key}' no tiene indicadores definidos. "
        f"Plantillas con indicadores: {', '.join(sorted(available))}"
    )


def _compliance_level(value_str: str, meta: str) -> str:
    """Return 'bueno', 'aceptable', 'critico', or 'neutral'."""
    try:
        v = float(str(value_str).replace("%", "").replace(",", "."))
    except (ValueError, AttributeError):
        return "neutral"
    # Meta con tres niveles: Bueno > X | Aceptable X-Y | Crítico < Y
    if "50" in meta and "30" in meta:
        if v > 50: return "bueno"
        if v >= 30: return "aceptable"
        return "critico"
    if "60" in meta and "40" in meta:
        if v > 60: return "bueno"
        if v >= 40: return "aceptable"
        return "critico"
    # Meta simple: > X%
    if "60" in meta:
        return "bueno" if v > 60 else "critico"
    return "neutral"


# ── Excel helpers ────────────────────────────────────────────────────────────

_EXCEL_HEADER_FILL = PatternFill("solid", fgColor="1B5E20")
_EXCEL_HEADER_FONT = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
_EXCEL_DATA_FONT = Font(size=10, name="Calibri")
_EXCEL_TITLE_FONT = Font(bold=True, size=16, name="Calibri", color="1B5E20")
_EXCEL_SUBTITLE_FONT = Font(size=11, name="Calibri", color="475569")
_EXCEL_THIN_BORDER = Border(
    left=Side(style="thin", color="CBD5E1"),
    right=Side(style="thin", color="CBD5E1"),
    top=Side(style="thin", color="CBD5E1"),
    bottom=Side(style="thin", color="CBD5E1"),
)
_EXCEL_SI_FONT = Font(size=10, name="Calibri", bold=True, color="166534")
_EXCEL_NO_FONT = Font(size=10, name="Calibri", color="94A3B8")


def _excel_header_row(ws, row: int, values: list[str], fill=None):
    fill = fill or _EXCEL_HEADER_FILL
    for ci, v in enumerate(values, start=1):
        c = ws.cell(row=row, column=ci, value=v)
        c.font = _EXCEL_HEADER_FONT
        c.fill = fill
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = _EXCEL_THIN_BORDER


def _excel_data_row(ws, row: int, values: list, eval_cols_set: set = set()):
    for ci, v in enumerate(values, start=1):
        c = ws.cell(row=row, column=ci, value=v)
        c.font = _EXCEL_DATA_FONT
        c.border = _EXCEL_THIN_BORDER
        if ci in eval_cols_set:
            if str(v).strip() == "SI":
                c.font = _EXCEL_SI_FONT
            elif str(v).strip() == "NO":
                c.font = _EXCEL_NO_FONT


def _excel_auto_width(ws, ncols: int, data_rows: list[list]):
    for ci in range(1, ncols + 1):
        best = 8
        for row in data_rows:
            val = row[ci - 1] if ci <= len(row) else ""
            best = max(best, len(str(val)) + 2)
        ws.column_dimensions[get_column_letter(ci)].width = min(best, 55)


def _excel_setup_sheet(ws, title: str, headers: list[str], rows: list[list],
                       freeze: str = "A2", fill=None, eval_cols_set: set = set()):
    _excel_header_row(ws, 1, headers, fill=fill)
    for ri, vals in enumerate(rows, start=2):
        _excel_data_row(ws, ri, vals, eval_cols_set=eval_cols_set)
    if len(rows) > 0:
        last_col = get_column_letter(len(headers))
        ws.auto_filter.ref = f"A1:{last_col}{len(rows) + 1}"
    _excel_auto_width(ws, len(headers), rows)
    ws.freeze_panes = freeze


def _clean_display(name: str) -> str:
    """Convert internal column name to human-readable header."""
    n = name.replace("_", " ").strip()
    return n.title() if len(n) < 30 else n


def _compliance_level(value_str: str, meta: str) -> str:
    """Return 'bueno', 'aceptable', 'critico', or 'neutral'."""
    try:
        v = float(str(value_str).replace("%", "").replace(",", "."))
    except (ValueError, AttributeError):
        return "neutral"
    if "50" in meta and "30" in meta:
        if v > 50: return "bueno"
        if v >= 30: return "aceptable"
        return "critico"
    if "60" in meta and "40" in meta:
        if v > 60: return "bueno"
        if v >= 40: return "aceptable"
        return "critico"
    if "60" in meta:
        return "bueno" if v > 60 else "critico"
    return "neutral"


def build_evaluation_excel(indicators: pd.DataFrame, patients: pd.DataFrame) -> io.BytesIO:
    """Generate a professional styled Excel workbook with drill-down sheets."""
    wb = Workbook()

    eval_cols = [c for c in patients.columns if c.startswith("_")]
    data_cols = [c for c in patients.columns if not c.startswith("_")]
    display_cols = data_cols + eval_cols
    display_headers = [_clean_display(c) for c in display_cols]
    eval_cols_set = set(i + 1 for i, c in enumerate(display_cols) if c in eval_cols)

    # Build patient rows
    patient_rows = []
    for _, row in patients.iterrows():
        patient_rows.append([row.get(c, "") for c in display_cols])

    # ── Sheet 1: Dashboard ──
    ws = wb.active
    ws.title = "Dashboard"

    # Title section
    ws.merge_cells("A1:F1")
    c = ws.cell(row=1, column=1, value="Evaluación de Indicadores — Riesgo Cardiovascular")
    c.font = _EXCEL_TITLE_FONT

    ws.merge_cells("A2:F2")
    c = ws.cell(row=2, column=1, value=f"Total: {len(patients)} pacientes evaluados  |  {len(indicators)} indicadores  |  Generado: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    c.font = _EXCEL_SUBTITLE_FONT
    ws.row_dimensions[2].height = 20

    # Header row for indicators table
    ind_headers = ["Indicador", "Numerador", "Denominador", "Cumplimiento", "Estado", "Meta"]
    level_fills = {
        "bueno": PatternFill("solid", fgColor="DCFCE7"),
        "aceptable": PatternFill("solid", fgColor="FEF3C7"),
        "critico": PatternFill("solid", fgColor="FEE2E2"),
        "neutral": PatternFill("solid", fgColor="F8FAFC"),
    }
    level_colors = {
        "bueno": "166534",
        "aceptable": "92400E",
        "critico": "991B1B",
        "neutral": "475569",
    }
    level_labels = {
        "bueno": "✓ Cumple meta",
        "aceptable": "! En alerta",
        "critico": "✗ Crítico",
    }

    _excel_header_row(ws, 4, ind_headers, fill=_EXCEL_HEADER_FILL)
    for ri, (_, ind) in enumerate(indicators.iterrows(), start=5):
        level = _compliance_level(ind["CUMPLIMIENTO"], ind["META"])
        fill = level_fills.get(level, level_fills["neutral"])
        color = level_colors.get(level, "475569")
        vals = [
            ind["INDICADOR"],
            ind["NUMERADOR"],
            ind["DENOMINADOR"],
            ind["CUMPLIMIENTO"],
            level_labels.get(level, ""),
            ind["META"],
        ]
        for ci, v in enumerate(vals, start=1):
            c = ws.cell(row=ri, column=ci, value=v)
            sz = 14 if ci == 4 else 10
            c.font = Font(size=sz, name="Calibri", bold=(ci == 4), color=color)
            c.fill = fill
            c.border = _EXCEL_THIN_BORDER
            if ci == 4:
                c.alignment = Alignment(horizontal="center")

    ws.column_dimensions["A"].width = 42
    ws.column_dimensions["B"].width = 14
    ws.column_dimensions["C"].width = 14
    ws.column_dimensions["D"].width = 16
    ws.column_dimensions["E"].width = 18
    ws.column_dimensions["F"].width = 50
    ws.freeze_panes = "A5"

    # ── Sheet 2: Pacientes ──
    ws2 = wb.create_sheet(title="Pacientes")
    _excel_setup_sheet(ws2, "Pacientes", display_headers, patient_rows,
                       eval_cols_set=eval_cols_set)

    # ── Per-indicator sheets (drill-down) ──
    indicator_map = {
        "DM Controlado": ("_DM_CONTROLADO", "Pacientes con DM y HbA1c < 7%"),
        "PA <140-90": ("_PA_140_90", "Pacientes con PA < 140/90 mmHg"),
        "PA <150-90": ("_PA_150_90", "Pacientes con PA < 150/90 mmHg"),
        "Captación HTA": ("_HTA_CAPTADO", "Pacientes 18-69 subsid. con Dx HTA"),
        "Captación DM": ("_DM_CAPTADO", "Pacientes 18-69 subsid. con Dx DM"),
    }

    amber_fill = PatternFill("solid", fgColor="92400E")
    for sheet_name, (flag_col, description) in indicator_map.items():
        ws_detail = wb.create_sheet(title=sheet_name)

        matching = patients[patients.get(flag_col, "") == "SI"]
        detail_headers = [_clean_display(c) for c in data_cols] + [description]
        detail_cols = data_cols + [flag_col]
        detail_rows = []
        for _, row in matching.iterrows():
            detail_rows.append([row.get(c, "") for c in detail_cols])

        _excel_setup_sheet(ws_detail, sheet_name, detail_headers, detail_rows,
                           fill=amber_fill)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf
