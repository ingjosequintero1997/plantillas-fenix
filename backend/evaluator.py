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


def build_evaluation_excel(indicators: pd.DataFrame, patients: pd.DataFrame) -> io.BytesIO:
    """Generate a professional styled Excel workbook with drill-down sheets."""
    wb = Workbook()

    # ── Shared styles ──
    header_fill_green = PatternFill("solid", fgColor="1B5E20")
    header_fill_amber = PatternFill("solid", fgColor="92400E")
    header_font = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
    title_font = Font(bold=True, size=14, name="Calibri", color="1B5E20")
    subtitle_font = Font(size=10, name="Calibri", color="64748B")
    data_font = Font(size=10, name="Calibri")
    si_font = Font(size=10, name="Calibri", bold=True, color="166534")
    no_font = Font(size=10, name="Calibri", color="94A3B8")
    thin_border = Border(
        left=Side(style="thin", color="D0D5DD"),
        right=Side(style="thin", color="D0D5DD"),
        top=Side(style="thin", color="D0D5DD"),
        bottom=Side(style="thin", color="D0D5DD"),
    )

    level_fills = {
        "bueno": PatternFill("solid", fgColor="DCFCE7"),
        "aceptable": PatternFill("solid", fgColor="FEF3C7"),
        "critico": PatternFill("solid", fgColor="FEE2E2"),
        "neutral": PatternFill("solid", fgColor="F8FAFC"),
    }
    level_fonts = {
        "bueno": Font(bold=True, size=10, name="Calibri", color="166534"),
        "aceptable": Font(bold=True, size=10, name="Calibri", color="92400E"),
        "critico": Font(bold=True, size=10, name="Calibri", color="991B1B"),
        "neutral": Font(size=10, name="Calibri", color="64748B"),
    }
    level_badges = {
        "bueno": "✓ META",
        "aceptable": "! ALERTA",
        "critico": "✗ CRÍTICO",
    }

    eval_cols = [c for c in patients.columns if c.startswith("_")]
    data_cols = [c for c in patients.columns if not c.startswith("_")]
    display_cols = data_cols + eval_cols

    indicator_sheets = {
        "DM Controlado": ("_DM_CONTROLADO", "Pacientes con DM y HbA1c < 7% en últimos 6 meses"),
        "PA <140-90": ("_PA_140_90", "Pacientes con PA < 140/90 mmHg en último semestre"),
        "PA <150-90": ("_PA_150_90", "Pacientes con PA < 150/90 mmHg en último semestre"),
        "Captación HTA": ("_HTA_CAPTADO", "Pacientes 18-69 subsidiado con Dx HTA"),
        "Captación DM": ("_DM_CAPTADO", "Pacientes 18-69 subsidiado con Dx DM"),
    }

    # ── Sheet 1: Dashboard ──
    ws = wb.active
    ws.title = "Dashboard"

    # Title
    ws.merge_cells("A1:F1")
    title_cell = ws.cell(row=1, column=1, value="Evaluación de Indicadores RCV")
    title_cell.font = title_font
    ws.cell(row=2, column=1, value=f"Total de pacientes evaluados: {len(patients)}").font = subtitle_font
    ws.row_dimensions[1].height = 28

    # Indicator cards (3x2 grid)
    card_row = 4
    for idx, (_, row) in enumerate(indicators.iterrows()):
        col_offset = (idx % 2) * 3 + 1
        r = card_row + (idx // 2) * 6

        level = _compliance_level(row["CUMPLIMIENTO"], row["META"])
        badge = level_badges.get(level, "")
        fill_card = level_fills.get(level, level_fills["neutral"])
        font_card = level_fonts.get(level, level_fonts["neutral"])

        # Card background (fill merged area)
        for dr in range(5):
            for dc in range(3):
                c = ws.cell(row=r + dr, column=col_offset + dc)
                c.fill = fill_card
                c.border = thin_border

        # Indicator name
        c = ws.cell(row=r, column=col_offset, value=row["INDICADOR"])
        c.font = Font(bold=True, size=9, name="Calibri", color="64748B")
        ws.merge_cells(start_row=r, start_column=col_offset, end_row=r, end_column=col_offset + 2)

        # Compliance %
        c = ws.cell(row=r + 1, column=col_offset, value=row["CUMPLIMIENTO"])
        c.font = Font(bold=True, size=22, name="Calibri", color=font_card.color)
        ws.merge_cells(start_row=r + 1, start_column=col_offset, end_row=r + 1, end_column=col_offset + 1)

        # Badge
        c = ws.cell(row=r + 1, column=col_offset + 2, value=badge)
        c.font = Font(bold=True, size=9, name="Calibri", color=font_card.color)
        c.alignment = Alignment(horizontal="right", vertical="center")

        # Ratio
        c = ws.cell(row=r + 2, column=col_offset, value=f"{row['NUMERADOR']} / {row['DENOMINADOR']} pacientes")
        c.font = Font(size=9, name="Calibri", color="64748B")
        ws.merge_cells(start_row=r + 2, start_column=col_offset, end_row=r + 2, end_column=col_offset + 2)

        # Meta text
        c = ws.cell(row=r + 3, column=col_offset, value=row["META"])
        c.font = Font(size=8, name="Calibri", color="94A3B8")
        ws.merge_cells(start_row=r + 3, start_column=col_offset, end_row=r + 3, end_column=col_offset + 2)

    ws.column_dimensions["A"].width = 16
    ws.column_dimensions["B"].width = 16
    ws.column_dimensions["C"].width = 16
    ws.column_dimensions["D"].width = 16
    ws.column_dimensions["E"].width = 16
    ws.column_dimensions["F"].width = 16

    # ── Sheet 2: Pacientes (with auto-filter) ──
    ws2 = wb.create_sheet(title="Pacientes")
    for ci, col_name in enumerate(display_cols, start=1):
        display_name = col_name.replace("_", " ").strip()
        cell = ws2.cell(row=1, column=ci, value=display_name)
        cell.font = header_fill_green
        cell.font = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
        cell.fill = header_fill_green
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border

    for ri, row in patients.iterrows():
        for ci, col_name in enumerate(display_cols, start=1):
            val = row.get(col_name, "")
            cell = ws2.cell(row=ri + 2, column=ci, value=val)
            cell.font = data_font
            cell.border = thin_border
            # Color SI/NO in eval columns
            if col_name in eval_cols:
                if val == "SI":
                    cell.font = si_font
                elif val == "NO":
                    cell.font = no_font

    # Auto-filter on all columns
    if len(patients) > 0:
        last_col = get_column_letter(len(display_cols))
        ws2.auto_filter.ref = f"A1:{last_col}{len(patients) + 1}"

    # Auto-width
    for ci, col_name in enumerate(display_cols, start=1):
        max_len = len(col_name.replace("_", " ").strip())
        for ri in range(min(100, len(patients))):
            val = patients.iloc[ri].get(col_name, "")
            max_len = max(max_len, len(str(val)))
        ws2.column_dimensions[get_column_letter(ci)].width = min(max_len + 3, 50)
    ws2.freeze_panes = "A2"

    # ── Per-indicator sheets (drill-down) ──
    for sheet_name, (flag_col, description) in indicator_sheets.items():
        ws_detail = wb.create_sheet(title=sheet_name)

        # Header row
        detail_cols = data_cols + [flag_col]
        for ci, col_name in enumerate(detail_cols, start=1):
            display_name = col_name.replace("_", " ").strip()
            cell = ws_detail.cell(row=1, column=ci, value=display_name)
            cell.font = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
            cell.fill = header_fill_amber
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = thin_border

        # Filter patients where flag = SI
        matching = patients[patients.get(flag_col, "") == "SI"]
        for ri, row in matching.iterrows():
            for ci, col_name in enumerate(detail_cols, start=1):
                val = row.get(col_name, "")
                cell = ws_detail.cell(row=ri + 2, column=ci, value=val)
                cell.font = data_font
                cell.border = thin_border

        # Auto-filter
        if len(matching) > 0:
            last_col = get_column_letter(len(detail_cols))
            ws_detail.auto_filter.ref = f"A1:{last_col}{len(matching) + 1}"

        # Auto-width
        for ci, col_name in enumerate(detail_cols, start=1):
            max_len = len(col_name.replace("_", " ").strip())
            for ri in range(min(100, len(matching))):
                val = matching.iloc[ri].get(col_name, "") if ri < len(matching) else ""
                max_len = max(max_len, len(str(val)))
            ws_detail.column_dimensions[get_column_letter(ci)].width = min(max_len + 3, 50)
        ws_detail.freeze_panes = "A2"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf
