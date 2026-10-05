from __future__ import annotations

import io
import re
from datetime import datetime

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

try:
    from .validators import to_date_iso
except ImportError:
    from validators import to_date_iso

# Fechas centinela usadas para indicar "sin dato"
DATE_SENTINELS = {"", "1900-01-01", "1800-01-01", "1845-01-01", "SIN DATO", "00:00:00"}


def col_letter(n: int) -> str:
    result = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        result = chr(65 + r) + result
    return result


def _default_for_type(ttype: str) -> str:
    # Excel no soporta fechas reales antes de 1900; el campo 1845-01-01 se
    # entrega como texto para que quede visible exactamente como se requiere.
    if ttype == "DATE":
        return '"1845-01-01"'
    if ttype in ("INT", "DECIMAL"):
        return "0"
    return '"SIN DATO"'


# Formato de numero/celda por columna calculada (por nombre).
FORMULA_FORMATS = {
    "FPP": "yyyy-mm-dd",
    "Ultimo Control Prenatal": "yyyy-mm-dd",
    "Edad (años)": "0",
    "Dias para el parto": "0",
    "Indice de Masa Corporal (IMC)": "0.00",
    "IMC ACTUAL": "0.00",
    "Número Total de Controles Prenatales": "0",
    "edad gestacional actual": "0",
}


def build_formulas(template: list[dict]) -> dict[int, callable]:
    """Columnas calculadas del instructivo, resueltas POR NOMBRE (no por indice
    fijo), para que cada formula caiga en la columna correcta. Devuelve
    {columna_1based: fn(r) -> formula}. Solo las formulas requeridas."""
    idx = {t["name"]: i + 1 for i, t in enumerate(template)}
    typ = {t["name"]: t["type"] for t in template}

    def C(name: str) -> str:
        i = idx.get(name)
        if i is None:
            raise KeyError(f"build_formulas: columna de la plantilla no encontrada: {name!r}")
        return col_letter(i)

    def D(name: str) -> str:
        return _default_for_type(typ.get(name, "TEXT"))

    f: dict[int, callable] = {}

    def put(name: str, fn):
        f[idx[name]] = fn

    # 1. Edad
    def edad(r):
        a, dd = C("Fecha de Nacimiento"), D("Edad (años)")
        return f'=IFERROR(IF({a}{r}="",{dd},DATEDIF({a}{r},TODAY(),"Y")),{dd})'
    put("Edad (años)", edad)

    # 2. FPP = FUM + 280
    def fpp(r):
        fum, dd = C("FUM"), D("FPP")
        return f'=IFERROR(IF({fum}{r}="",{dd},{fum}{r}+280),{dd})'
    put("FPP", fpp)

    # 3. Dias para el parto = FPP - HOY
    def dias(r):
        fppc, dd = C("FPP"), D("Dias para el parto")
        return f'=IFERROR(IF({fppc}{r}="",{dd},{fppc}{r}-TODAY()),{dd})'
    put("Dias para el parto", dias)

    # 4. Alarma
    def alarma(r):
        dcol, dd = C("Dias para el parto"), D("Alarma")
        return (f'=IFERROR(IF({dcol}{r}="",{dd},IF({dcol}{r}<0,"Nacido",'
                f'IF({dcol}{r}<=7,"Semana de parto",IF({dcol}{r}<=28,"Menos 4 sem","Pendiente")))),{dd})')
    put("Alarma", alarma)

    # 5. IMC inicial = peso / talla^2
    def imc(r):
        p, t, dd = C("Peso Inicial (kg)"), C("Talla (metros)"), D("Indice de Masa Corporal (IMC)")
        return f'=IFERROR(IF(OR({p}{r}="",{t}{r}=""),{dd},{p}{r}/{t}{r}^2),{dd})'
    put("Indice de Masa Corporal (IMC)", imc)

    def clasif_imc(base_name: str, target_name: str):
        def fn(r):
            b, dd = C(base_name), D(target_name)
            return (f'=IFERROR(IF({b}{r}="",{dd},IF({b}{r}<18.5,"Bajo peso",'
                    f'IF({b}{r}<25,"Peso normal",IF({b}{r}<30,"Sobrepeso",'
                    f'IF({b}{r}<35,"Obesidad grado 1",IF({b}{r}<40,"Obesidad grado 2","Obesidad grado 3")))))),{dd})')
        return fn
    put("Clasificación del IMC", clasif_imc("Indice de Masa Corporal (IMC)", "Clasificación del IMC"))

    # 6. IMC actual = peso actual / talla actual^2
    def imc_act(r):
        p, t, dd = C("peso actual"), C("talla actual"), D("IMC ACTUAL")
        return f'=IFERROR(IF(OR({p}{r}="",{t}{r}=""),{dd},{p}{r}/{t}{r}^2),{dd})'
    put("IMC ACTUAL", imc_act)
    put("Clasificación del IMC ACTUAL", clasif_imc("IMC ACTUAL", "Clasificación del IMC ACTUAL"))

    # 7. Trimestres (semanas desde la FUM o desde el ingreso, segun corresponda)
    def trimestre(f1: str, f2: str, l2: int = 28) -> str:
        def fn(r):
            a, b = C(f1), C(f2)
            return (f'=IFERROR(IF(OR({a}{r}="",{b}{r}=""),0,'
                    f'IF(DATEDIF({a}{r},{b}{r},"D")/7<14,"1 Trim",'
                    f'IF(DATEDIF({a}{r},{b}{r},"D")/7<{l2},"2 Trim","3 Trim"))),0)')
        return fn
    put("Trimestre Asesoria VIH", trimestre("FUM", "Asesoria Prueba VIH"))
    put("Trimestre Toma Prueba VIH Primer Tamizaje", trimestre("FUM", "Fecha Toma Prueba VIH Primer Tamizaje"))
    put("Trimestre Toma Prueba VIH Segundo Tamizaje", trimestre("FUM", "Fecha Toma Prueba VIH Segundo Tamizaje"))
    put("Trimestre Toma Prueba VIH Tercer Tamizaje", trimestre("FUM", "Fecha Toma Prueba VIH Tercer Tamizaje"))
    put("Trimestre Primera Prueba Treponemica Rapida Sifilis", trimestre("FUM", "Fecha Primera Prueba Treponemica Rapida Sifilis"))
    put("Trimestre Segunda Prueba Treponemica Rapida Sifilis", trimestre("FUM", "Fecha Segunda Prueba Treponemica Rapida Sifilis"))
    put("Trimestre Tercera Prueba Treponemica Rapida Sifilis", trimestre("FUM", "Fecha Tercera Prueba Treponemica Rapida Sifilis"))
    put("Trimestre Toma segunda Prueba VIH", trimestre("FUM", "Fecha toma Segunda Prueba VIH"))
    # Confirmatoria: base = fecha de INGRESO, limites 13 / 26
    put("Trimestre Prueba confirmatoria Según Algoritmo",
        trimestre("Fecha de Ingreso al Control Prenatal", "Fecha prueba confirmatoria Según Algoritmo", l2=13))

    # 8. Controles prenatales
    controles = ['Fecha 1er Control', 'Fecha 2do Control', 'Fecha 3er Control',
                 'Fecha 4to Control', 'Fecha 5to Control', 'Fecha 6to Control',
                 'Fecha 7mo Control', 'fecha 8vo Control', 'Fecha 9no Control']
    ctrl = [C(c) for c in controles]

    def num_controles(r):
        s = "+".join(f'COUNTIF({c}{r},">0")' for c in ctrl)
        return f'=IFERROR({s},0)'
    put("Número Total de Controles Prenatales", num_controles)

    def ultimo_control(r):
        refs = ",".join(f'{c}{r}' for c in ctrl)
        return f'=IFERROR(IF(MAX({refs})=0,"",MAX({refs})),"")'
    put("Ultimo Control Prenatal", ultimo_control)

    def edad_gest_actual(r):
        fum, uc = C("FUM"), C("Ultimo Control Prenatal")
        return (f'=IFERROR(IF(OR({fum}{r}="",{uc}{r}="",{uc}{r}="1845-01-01"),0,'
                f'DATEDIF({fum}{r},{uc}{r},"D")/7),0)')
    put("edad gestacional actual", edad_gest_actual)

    # 9. Relacion anemia vs tratamiento (semaforo)
    def anemia(r):
        doc = C("No. De Identificación")
        f1, f2, f3 = C("Fecha 1ra Realizacion Hemoglobina"), C("Fecha 2da Realizacion Hemoglobina"), C("Fecha 3ra Realizacion Hemoglobina")
        r1, r2, r3 = C("Resultado 1ra Hemoglobina"), C("Resultado 2da Hemoglobina"), C("Resultado 3ra Hemoglobina")
        tr = C("Tipo de tratamiento suminitrado para anemia")
        return (f'=IF({doc}{r}="","",LET('
                f'fd,IFERROR(IF(ISNUMBER({f1}{r}),{f1}{r},DATEVALUE({f1}{r})),0),'
                f'sd,IFERROR(IF(ISNUMBER({f2}{r}),{f2}{r},DATEVALUE({f2}{r})),0),'
                f'td,IFERROR(IF(ISNUMBER({f3}{r}),{f3}{r},DATEVALUE({f3}{r})),0),'
                f'latest,MAX(fd,sd,td),'
                f'h,IF(latest=0,"",IF(latest=td,{r3}{r},IF(latest=sd,{r2}{r},{r1}{r}))),'
                f'hv,IFERROR(VALUE(h),""),'
                f'req,IF(hv<7,3,IF(hv<10,2,1)),'
                f'trat,IFERROR(VALUE(LEFT(TRIM({tr}{r}),1)),0),'
                f'IF(OR(latest=0,hv=""),"🟡 SIN TAMIZAJE",IF(trat=req,"🟢 ADECUADO","🔴 NO ADECUADO"))))')
    put("Relación entre Anemia vs tratamiento", anemia)

    return f


def parse_corrected(corrected_text: str) -> list[list[str]]:
    rows = []
    for line in corrected_text.replace("\r\n", "\n").split("\n"):
        line = line.rstrip("\n")
        if not line.strip():
            continue
        rows.append(line.split("|"))
    return rows


def build_data_excel(corrected_text: str, template: list[dict]) -> io.BytesIO:
    headers = [t["name"] for t in template]
    types = [t["type"] for t in template]
    formulas = build_formulas(template)
    rows = parse_corrected(corrected_text)

    wb = Workbook()
    wb.calculation.fullCalcOnLoad = True  # Recalcula todas las fórmulas al abrir
    ws = wb.active
    ws.title = "DATA"

    header_fill = PatternFill("solid", fgColor="1B5E20")
    header_font = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
    thin = Border(*[Side(style="thin", color="BDBDBD")] * 4)

    for c, h in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=c, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        cell.border = thin

    for ridx, row in enumerate(rows, start=2):
        for c, (ttype, val) in enumerate(zip(types, row), start=1):
            if c in formulas:
                cell = ws.cell(row=ridx, column=c, value=formulas[c](ridx))
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.border = thin
                fmt = FORMULA_FORMATS.get(headers[c - 1])
                if fmt:
                    cell.number_format = fmt
                continue
            val = (val or "").strip()
            if ttype == "DATE":
                if val in DATE_SENTINELS:
                    # Fecha sin dato: campo visible 1845-01-01 (texto, Excel no
                    # soporta fechas reales antes de 1900).
                    cell = ws.cell(row=ridx, column=c, value="1845-01-01")
                else:
                    iso = to_date_iso(val)
                    if iso:
                        try:
                            cell = ws.cell(row=ridx, column=c, value=datetime.strptime(iso, "%Y-%m-%d"))
                        except Exception:
                            cell = ws.cell(row=ridx, column=c, value=val)
                    else:
                        cell = ws.cell(row=ridx, column=c, value=val)
                cell.number_format = "yyyy-mm-dd"
                cell.border = thin
            elif ttype in ("INT", "DECIMAL"):
                num = re.sub(r"[^0-9.\-]", "", val)
                try:
                    cell = ws.cell(row=ridx, column=c, value=float(num) if "." in num else int(num))
                except Exception:
                    # Número sin dato o no convertible: 0
                    cell = ws.cell(row=ridx, column=c, value=0)
                cell.border = thin
            else:
                # Texto sin dato: SIN DATO
                cell = ws.cell(row=ridx, column=c, value=val if val else "SIN DATO")
                cell.border = thin

    for c in range(1, len(headers) + 1):
        letter = col_letter(c)
        max_len = max(len(str(headers[c - 1])), 10)
        ws.column_dimensions[letter].width = min(max_len + 3, 45)

    ws.freeze_panes = "A2"
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf


def build_reporte_errores_excel(corrected_text: str, template: list[dict], errors_by_cell: dict) -> io.BytesIO:
    """Genera una UNICA hoja de calculo con la data y una columna final
    'RESULTADO DE VALIDACION' que describe el/los errores de cada fila.
    Las celdas con dato invalido se marcan en rojo para localizarlas."""
    headers = [t["name"] for t in template]
    types = [t["type"] for t in template]
    rows = parse_corrected(corrected_text)

    wb = Workbook()
    ws = wb.active
    ws.title = "DATA"

    header_fill = PatternFill("solid", fgColor="1B5E20")
    header_font = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
    thin = Border(*[Side(style="thin", color="BDBDBD")] * 4)
    error_fill = PatternFill("solid", fgColor="FECACA")  # rojo mas intenso
    error_font = Font(color="B91C1C", bold=True)
    valid_fill = PatternFill("solid", fgColor="DCFCE7")  # verde claro (VALIDADO)

    ncols = len(headers) + 1  # + RESULTADO DE VALIDACION
    for c in range(1, ncols + 1):
        label = headers[c - 1] if c <= len(headers) else "RESULTADO DE VALIDACION"
        cell = ws.cell(row=1, column=c, value=label)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        cell.border = thin

    # Construir filas con append (rapido)
    for ridx, row in enumerate(rows, start=2):
        out_row = [None] * ncols
        for c, (ttype, val) in enumerate(zip(types, row), start=1):
            val = (val or "").strip()
            if ttype == "DATE":
                if val in DATE_SENTINELS:
                    out_row[c - 1] = "1845-01-01"
                else:
                    iso = to_date_iso(val)
                    out_row[c - 1] = iso if iso else val
            elif ttype in ("INT", "DECIMAL"):
                num = re.sub(r"[^0-9.\-]", "", val)
                try:
                    out_row[c - 1] = float(num) if "." in num else int(num)
                except Exception:
                    out_row[c - 1] = val
            else:
                out_row[c - 1] = val if val else "SIN DATO"
        # RESULTADO DE VALIDACION: describir el error especifico de la fila
        fila_idx = ridx - 2  # 0-based dentro de rows
        errores_fila = [(h, errors_by_cell[(fila_idx, h)]) for h in headers if (fila_idx, h) in errors_by_cell]
        if errores_fila:
            desc = " - ".join(f"{h}: {msg}" for h, msg in errores_fila)
        else:
            desc = "VALIDADO"
        out_row[ncols - 1] = desc
        ws.append(out_row)

    # Marcar en rojo las celdas con dato invalido y la celda RESULTADO
    col_idx = {h: i + 1 for i, h in enumerate(headers)}
    # Rellenar RESULTADO DE VALIDACION por fila
    for ridx in range(len(rows)):
        rc = ws.cell(row=ridx + 2, column=ncols)
        rc.border = thin
        tiene = any((ridx, h) in errors_by_cell for h in headers)
        if tiene:
            rc.fill = error_fill
            rc.font = error_font
        else:
            rc.fill = valid_fill
            rc.font = Font(color="166534", bold=True)
    # Celdas con dato invalido
    for (fila_idx, h) in errors_by_cell.keys():
        if fila_idx >= len(rows):
            continue
        c = col_idx.get(h)
        if c is None:
            continue
        cell = ws.cell(row=fila_idx + 2, column=c)
        cell.fill = error_fill
        cell.font = error_font

    for c in range(1, ncols + 1):
        letter = col_letter(c)
        if c <= len(headers):
            max_len = max(len(str(headers[c - 1])), 10)
            ws.column_dimensions[letter].width = min(max_len + 3, 45)
        else:
            ws.column_dimensions[letter].width = 80  # RESULTADO DE VALIDACION
    ws.freeze_panes = "A2"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf
