import React, { useState } from 'react'
import { verificarAfiliado } from '../api'

function Campo({ label, value }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: 'var(--bg-subtle)' }}>
      <div className="text-[0.65rem] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value || '\u2014'}</div>
    </div>
  )
}

const GRUPOS = [
  { titulo: 'Datos de identificación', campos: [
    ['primer_nombre', 'Primer Nombre'],
    ['segundo_nombre', 'Segundo Nombre'],
    ['primer_apellido', 'Primer Apellido'],
    ['segundo_apellido', 'Segundo Apellido'],
    ['fecha_nacimiento', 'Fecha Nacimiento'],
    ['sexo', 'Sexo'],
  ]},
  { titulo: 'Contacto y residencia', campos: [
    ['direccion', 'Dirección'],
    ['barrio', 'Barrio'],
    ['telefono', 'Teléfono'],
    ['correo', 'Correo Electrónico'],
    ['municipio_afiliacion', 'Municipio Afiliación'],
    ['departamento_afiliacion', 'Departamento Afiliación'],
  ]},
  { titulo: 'Datos del afiliado', campos: [
    ['categoria', 'Categoría'],
    ['estado_afiliado', 'Estado Afiliado'],
    ['tipo_afiliado', 'Tipo Afiliado'],
    ['fecha_inicio_cobertura', 'Fecha inicio cobertura'],
    ['discapacidad', 'Discapacidad'],
    ['ips_primaria', 'IPS primaria'],
  ]},
]

export default function VerificarAfiliado() {
  const [documento, setDocumento] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  const buscar = async () => {
    const doc = documento.trim()
    if (!doc) { setError('Ingresa el número de documento de la usuaria'); return }
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

  return (
    <div className="space-y-6 fade-in">
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

      {error && (
        <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>{error}</div>
      )}

      {resultado && resultado.encontrado === false && (
        <div className="panel flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </div>
          <div className="min-w-0">
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {resultado.error ? 'No se pudo realizar la consulta' : 'No se encontró la usuaria'}
            </div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {resultado.error
                ? resultado.error
                : `No hay un afiliado registrado con el documento ${resultado.documento}.`}
            </div>
          </div>
        </div>
      )}

      {resultado && resultado.encontrado === true && (
        <div className="space-y-6">
          {/* Cabecera con nombre completo */}
          <div className="panel">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: 'var(--green-100)', color: 'var(--green-800)' }}>
                {(resultado.afiliado?.primer_nombre || '?').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {[
                    resultado.afiliado?.primer_nombre,
                    resultado.afiliado?.segundo_nombre,
                    resultado.afiliado?.primer_apellido,
                    resultado.afiliado?.segundo_apellido,
                  ].filter(Boolean).join(' ') || 'Afiliada'}
                </div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Documento: {resultado.documento}</div>
              </div>
              <div className="ml-auto">
                <span className="badge-success">Afiliado encontrado</span>
              </div>
            </div>
          </div>

          {/* Grupos de datos demograficos */}
          {GRUPOS.map((g) => (
            <div className="panel" key={g.titulo}>
              <div className="pb-3 mb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{g.titulo}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.campos.map(([key, label]) => (
                  <Campo key={key} label={label} value={resultado.afiliado?.[key]} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}