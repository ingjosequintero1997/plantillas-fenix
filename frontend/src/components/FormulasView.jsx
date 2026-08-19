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
  'Numérico': 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/40',
  'Fecha': 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-700/40',
  'Texto': 'bg-gray-100 dark:bg-[#3D3D40] text-ink-muted border-ink-line/60 dark:border-[#666669]',
}

export default function FormulasView() {
  return (
    <section className="rounded-2xl bg-white dark:bg-[#333337] border border-ink-line/50 dark:border-[#666669]/50 shadow-sm dark:shadow-black/30 p-5 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center shrink-0 shadow-md shadow-brand-900/20">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">Fórmulas aplicadas</h2>
          <p className="text-xs text-ink-muted/70">Estas variables se calculan automáticamente al abrir el archivo en Excel</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-ink-line/50 dark:border-[#666669]/50">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#F8F7F4] dark:bg-[#28282B] border-b border-ink-line/50 dark:border-[#666669]/50">
              <th className="px-4 py-2.5 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Variable</th>
              <th className="px-4 py-2.5 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Qué calcula</th>
              <th className="px-4 py-2.5 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Tipo</th>
              <th className="px-4 py-2.5 text-left text-[0.5rem] font-bold uppercase tracking-wider text-ink-muted">Si no hay dato</th>
            </tr>
          </thead>
          <tbody>
            {FORMULAS.map((f) => (
              <tr key={f.variable} className="border-b border-surface-100 dark:border-[#666669]/40 align-top hover:bg-brand-50/20 dark:hover:bg-brand-900/10 transition-colors">
                <td className="px-4 py-2.5 text-xs font-bold text-ink">{f.variable}</td>
                <td className="px-4 py-2.5 text-xs text-ink-muted">{f.desc}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.45rem] font-bold uppercase tracking-wider border ${TIPO_STYLE[f.tipo]}`}>
                    {f.tipo}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs font-semibold text-brand-700 dark:text-brand-300">{f.sinDato}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
