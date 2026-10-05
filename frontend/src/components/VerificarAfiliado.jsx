import React, { useState } from 'react'
import { verificarAfiliado, verificarAfiliadoMasivo } from '../api'
import Pagination from './Pagination'

const MASIVO_PAGE_SIZE = 50

function Campo({ label, value, icon }) {
  return (
    <div className="rounded-xl px-3.5 py-3 transition-colors" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-[0.6rem]" style={{ color: 'var(--text-muted)' }}>{icon}</span>}
        <div className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
      </div>
      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value || '\u2014'}</div>
    </div>
  )
}

function GrupoPanel({ titulo, icon, campos, afiliado }) {
  return (
    <div className="panel overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2.5 pb-3 mb-3" style={{ borderBottom: '2px solid var(--green-100)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-800)' }}>
          {icon}
        </div>
        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{titulo}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {campos.map(([key, label]) => (
          <Campo key={key} label={label} value={afiliado?.[key]} />
        ))}
      </div>
    </div>
  )
}

const GRUPOS = [
  { titulo: 'Datos de identificación', icon: '\u{1F464}', campos: [
    ['primer_nombre', 'Primer nombre'],
    ['segundo_nombre', 'Segundo nombre'],
    ['primer_apellido', 'Primer apellido'],
    ['segundo_apellido', 'Segundo apellido'],
    ['fecha_nacimiento', 'Fecha de nacimiento'],
    ['sexo', 'Sexo'],
  ]},
  { titulo: 'Contacto y residencia', icon: '\u{1F4CD}', campos: [
    ['direccion', 'Dirección'],
    ['barrio', 'Barrio'],
    ['telefono', 'Teléfono'],
    ['correo', 'Correo electrónico'],
    ['municipio_afiliacion', 'Municipio de afiliación'],
    ['departamento_afiliacion', 'Departamento de afiliación'],
  ]},
  { titulo: 'Datos de la afiliación', icon: '\u{1F4CB}', campos: [
    ['categoria', 'Categoría'],
    ['estado_afiliado', 'Estado de afiliación'],
    ['tipo_afiliado', 'Tipo de afiliado'],
    ['fecha_inicio_cobertura', 'Fecha inicio de cobertura'],
    ['discapacidad', 'Discapacidad'],
    ['ips_primaria', 'IPS primaria'],
  ]},
]

function fmtFecha(s) {
  if (!s) return null
  const parts = String(s).split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return s
}

function ResultadoNoEncontrado({ resultado }) {
  return (
    <div className="panel flex items-center gap-4" style={{ border: '1px solid var(--danger)' }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--danger-bg)' }}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ stroke: 'var(--danger)' }} strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {resultado.error ? 'No se pudo realizar la consulta' : 'No se encontr\u00f3 la usuaria'}
        </div>
        <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {resultado.error
            ? resultado.error
            : `No hay un afiliado registrado con el documento ${resultado.documento}.`}
        </div>
      </div>
    </div>
  )
}

export default function VerificarAfiliado() {
  const [documento, setDocumento] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  // Verificacion masiva
  const [masivoFile, setMasivoFile] = useState(null)
  const [masivoLoading, setMasivoLoading] = useState(false)
  const [masivo, setMasivo] = useState(null)
  const [masivoError, setMasivoError] = useState('')
  const [masivoPage, setMasivoPage] = useState(1)

  const buscar = async () => {
    const doc = documento.trim()
    if (!doc) { setError('Ingresa el n\u00famero de documento de la usuaria'); return }
    setError('')
    setResultado(null)
    setBuscando(true)
    try {
      const data = await verificarAfiliado(doc)
      setResultado(data)
    } catch (e) {
      setError(e.message || 'No se pudo realizar la consulta')
    } finally {
      setBuscando(false)
    }
  }

  const verificarMasivo = async () => {
    if (!masivoFile) { setMasivoError('Selecciona un archivo TXT o CSV (TIPO,NUMERO por linea)'); return }
    setMasivoError(''); setMasivo(null); setMasivoPage(1); setMasivoLoading(true)
    try {
      const data = await verificarAfiliadoMasivo(masivoFile)
      setMasivo(data)
    } catch (e) {
      setMasivoError(e.message || 'No se pudo realizar la verificacion masiva')
    } finally {
      setMasivoLoading(false)
    }
  }

  const descargarMasivo = () => {
    if (!masivo?.resultados?.length) return
    const filas = [['Tipo de identificacion', 'Numero de identificacion', 'Estado', 'IPS primaria']]
    for (const r of masivo.resultados) filas.push([r.tipo, r.numero, r.estado, r.ips || ''])
    const csv = filas.map((r) => r.map((c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'verificacion_afiliado_masiva.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const afiliado = resultado?.afiliado || {}
  const nombreCompleto = [
    afiliado.primer_nombre,
    afiliado.segundo_nombre,
    afiliado.primer_apellido,
    afiliado.segundo_apellido,
  ].filter(Boolean).join(' ') || 'Afiliada'

  return (
    <div className="space-y-5 fade-in">
      <div>
        <div className="page-title">Verificar afiliado</div>
        <div className="page-subtitle">Consulta los datos demográficos de una usuaria por número de documento.</div>
      </div>

      {/* Buscador */}
      <div className="panel">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Número de documento</label>
            <input
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') buscar() }}
              placeholder="Ej: 1045678901"
              className="input text-sm"
            />
          </div>
          <button onClick={buscar} disabled={buscando} className="btn-primary text-sm">
            {buscando ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            )}
            {buscando ? 'Consultando...' : 'Verificar'}
          </button>
        </div>
      </div>

      {/* Verificacion masiva */}
      <div className="panel space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-800)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Verificación masiva</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Sube un TXT/CSV con una línea por usuaria: <b>TIPO,NUMERO</b> (ej. <code>CC,1045678901</code>).
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input id="masivo-file" type="file" accept=".txt,.csv" className="hidden"
            onChange={(e) => { setMasivoFile(e.target.files?.[0] || null); setMasivo(null); setMasivoError('') }} />
          <label htmlFor="masivo-file" className="btn-secondary text-sm cursor-pointer">
            {masivoFile ? masivoFile.name : 'Seleccionar archivo'}
          </label>
          <button onClick={verificarMasivo} disabled={masivoLoading || !masivoFile} className="btn-primary text-sm">
            {masivoLoading ? 'Verificando...' : 'Verificar masivo'}
          </button>
          {masivo?.resultados?.length > 0 && (
            <button onClick={descargarMasivo} className="btn-secondary text-sm ml-auto">Descargar CSV</button>
          )}
        </div>

        {masivoError && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>{masivoError}</div>
        )}

        {masivo && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="badge-neutral">Total: {masivo.total}</span>
              <span className="badge-success">Encontrados: {masivo.encontrados}</span>
              <span className="badge-warning">Tipo no coincide: {masivo.tipo_no_coincide}</span>
              <span className="badge-error">No encontrados: {masivo.no_encontrados}</span>
            </div>
            {masivo.error_db && <div className="text-xs" style={{ color: 'var(--warning)' }}>{masivo.error_db}</div>}
            {masivo.errores_formato?.length > 0 && (
              <div className="text-xs" style={{ color: 'var(--warning)' }}>
                {masivo.errores_formato.length} línea(s) con formato inválido (se omitieron).
              </div>
            )}
            {masivo.resultados?.length > 0 ? (
              <div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Tipo de identificación</th><th>Número de identificación</th><th>Estado</th><th>IPS primaria</th></tr>
                    </thead>
                    <tbody>
                      {masivo.resultados.slice((masivoPage - 1) * MASIVO_PAGE_SIZE, masivoPage * MASIVO_PAGE_SIZE).map((r, i) => (
                        <tr key={i}>
                          <td>{r.tipo}</td>
                          <td>{r.numero}</td>
                          <td>
                            <span className={r.estado === 'ENCONTRADO' ? 'badge-success' : r.estado === 'TIPO_NO_COINCIDE' ? 'badge-warning' : 'badge-error'}>
                              {r.estado === 'ENCONTRADO' ? 'Encontrado' : r.estado === 'TIPO_NO_COINCIDE' ? 'Tipo no coincide' : 'No encontrado'}
                            </span>
                            {r.estado === 'TIPO_NO_COINCIDE' && r.tipo_bd && (
                              <span className="ml-1.5 text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>(BD: {r.tipo_bd})</span>
                            )}
                          </td>
                          <td>{r.ips || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={masivoPage}
                  totalPages={Math.max(1, Math.ceil(masivo.resultados.length / MASIVO_PAGE_SIZE))}
                  onChange={setMasivoPage}
                />
              </div>
            ) : (
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No se procesaron filas.</div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {resultado && resultado.encontrado === false && (
        <ResultadoNoEncontrado resultado={resultado} />
      )}

      {resultado && resultado.encontrado === true && (
        <div className="space-y-5">
          {/* Advertencia si IPS no coincide */}
          {resultado.restriction === 'ips_no_coincide' && (
            <div className="px-4 py-3 rounded-lg text-sm flex items-start gap-3" style={{ color: 'var(--warning)', backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)' }}>
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" style={{ stroke: 'var(--warning)' }} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <div className="font-semibold">IPS no coincide</div>
                <div className="mt-0.5">{resultado.message}</div>
              </div>
            </div>
          )}

          {/* Cabecera con nombre completo */}
          <div className="panel" style={{ border: '1px solid var(--green-200)' }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-800)' }}>
                {(afiliado.primer_nombre || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {nombreCompleto}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                    {resultado.documento}
                  </span>
                  {afiliado.sexo && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-800)' }}>
                      {afiliado.sexo}
                    </span>
                  )}
                  {afiliado.fecha_nacimiento && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Nac: {fmtFecha(afiliado.fecha_nacimiento)}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-auto shrink-0">
                <span className="badge-success">Afiliado encontrado</span>
              </div>
            </div>
          </div>

          {/* Grupos de datos demograficos */}
          {GRUPOS.map((g) => (
            <GrupoPanel key={g.titulo} titulo={g.titulo} icon={g.icon} campos={g.campos} afiliado={afiliado} />
          ))}
        </div>
      )}
    </div>
  )
}
