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
    Returns (indicators_df, patients_df).
    """
    if template_key == "rcv":
        return _evaluate_rcv(df, today)
    return _evaluate_generic(df)


def build_evaluation_excel(indicators: pd.DataFrame, patients: pd.DataFrame) -> io.BytesIO:
    """Generate a styled Excel workbook with two sheets."""
    wb = Workbook()

    # ── Sheet 1: Indicators ──
    ws1 = wb.active
    ws1.title = "Indicadores"

    header_fill = PatternFill("solid", fgColor="1B5E20")
    header_font = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
    data_font = Font(size=10, name="Calibri")
    thin_border = Border(
        left=Side(style="thin", color="BDBDBD"),
        right=Side(style="thin", color="BDBDBD"),
        top=Side(style="thin", color="BDBDBD"),
        bottom=Side(style="thin", color="BDBDBD"),
    )

    ind_cols = list(indicators.columns)
    for ci, col_name in enumerate(ind_cols, start=1):
        cell = ws1.cell(row=1, column=ci, value=col_name)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border

    for ri, row in indicators.iterrows():
        for ci, col_name in enumerate(ind_cols, start=1):
            val = row[col_name]
            cell = ws1.cell(row=ri + 2, column=ci, value=val)
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(vertical="center", wrap_text=True)

    ws1.column_dimensions["A"].width = 38
    ws1.column_dimensions["B"].width = 55
    ws1.column_dimensions["C"].width = 14
    ws1.column_dimensions["D"].width = 14
    ws1.column_dimensions["E"].width = 42
    ws1.column_dimensions["F"].width = 16
    ws1.freeze_panes = "A2"

    # ── Sheet 2: Patients ──
    ws2 = wb.create_sheet(title="Pacientes")

    # Determine evaluation columns to suffix
    eval_cols = [c for c in patients.columns if c.startswith("_")]
    display_cols = [c for c in patients.columns if not c.startswith("_")] + eval_cols

    for ci, col_name in enumerate(display_cols, start=1):
        display_name = col_name.lstrip("_")
        cell = ws2.cell(row=1, column=ci, value=display_name)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border

    for ri, row in patients.iterrows():
        for ci, col_name in enumerate(display_cols, start=1):
            val = row[col_name] if col_name in patients.columns else ""
            cell = ws2.cell(row=ri + 2, column=ci, value=val)
            cell.font = data_font
            cell.border = thin_border

    # Auto-width
    for ci, col_name in enumerate(display_cols, start=1):
        max_len = len(col_name.lstrip("_"))
        for ri in range(min(100, len(patients))):
            val = patients.iloc[ri].get(col_name, "")
            max_len = max(max_len, len(str(val)))
        ws2.column_dimensions[get_column_letter(ci)].width = min(max_len + 3, 50)

    ws2.freeze_panes = "A2"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf
