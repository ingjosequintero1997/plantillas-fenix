import React from 'react'

const FORMULAS = [
  { variable: 'EDAD', desc: 'Edad actual calculada desde la fecha de nacimiento', tipo: 'Numérico', sinDato: '0' },
  { variable: 'FPP', desc: 'Fecha probable de parto (FUM + 280 días)', tipo: 'Fecha', sinDato: '1845-01-01' },
  { variable: 'Días para el parto', desc: 'Días restantes hasta la fecha probable de parto', tipo: 'Numérico', sinDato: '0' },
  { variable: 'Alarma', desc: 'Clasifica: Nacido, Semana de parto, Menos 4 sem, Pendiente', tipo: 'Texto', sinDato: 'SIN DATO' },
  { variable: 'Edad gest. inicio', desc: 'Semanas de gestación desde la FUM hasta el ingreso', tipo: 'Numérico', sinDato: '0' },
  { variable: 'Trimestre de inicio', desc: 'Clasifica el trimestre de inicio del control', tipo: 'Texto', sinDato: 'SIN DATO' },
  { variable: 'IMC inicial', desc: 'Peso inicial ÷ talla²', tipo: 'Numérico', sinDato: '0' },
  { variable: 'Clasificación IMC', desc: 'Bajo peso, Normal, Sobrepeso u Obesidad', tipo: 'Texto', sinDato: 'SIN DATO' },
  { variable: 'Trimestres de tamizajes', desc: 'Trimestre de las pruebas de VIH y Sífilis según FUM + fecha de la prueba', tipo: 'Numérico', sinDato: '0' },
  { variable: 'Trimestre confirmatorio', desc: 'Trimestre de la prueba confirmatoria según algoritmo', tipo: 'Numérico', sinDato: '0' },
  { variable: 'Total de controles', desc: 'Cuenta cuántos controles prenatales se registraron', tipo: 'Numérico', sinDato: '0' },
  { variable: 'Último control', desc: 'Fecha del último control prenatal registrado', tipo: 'Fecha', sinDato: '1845-01-01' },
  { variable: 'Edad gest. actual', desc: 'Semanas de gestación hasta el último control', tipo: 'Numérico', sinDato: '0' },
  { variable: 'IMC actual', desc: 'Peso actual ÷ talla actual²', tipo: 'Numérico', sinDato: '0' },
]

const TIPO_STYLE = {
  'Numérico': { color: '#237A32', bg: 'var(--primary-light)' },
  'Fecha': { color: '#185C25', bg: '#E8F1EC' },
  'Texto': { color: 'var(--text-secondary)', bg: 'var(--bg)' },
}

export default function FormulasView() {
  return (
    <div className="panel">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <span className="font-medium">Fórmulas aplicadas</span>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Estas variables se calculan automáticamente al abrir el archivo en Excel.</p>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Qué calcula</th>
              <th>Tipo</th>
              <th>Si no hay dato</th>
            </tr>
          </thead>
          <tbody>
            {FORMULAS.map((f) => {
              const st = TIPO_STYLE[f.tipo] || TIPO_STYLE['Texto']
              return (
                <tr key={f.variable}>
                  <td className="font-medium">{f.variable}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{f.desc}</td>
                  <td>
                    <span className="inline-flex rounded px-2 py-0.5 text-xs" style={{ color: st.color, backgroundColor: st.bg }}>{f.tipo}</span>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{f.sinDato}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}