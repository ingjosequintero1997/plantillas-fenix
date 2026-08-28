import React, { useState, useEffect, useMemo } from 'react'
import { fetchEstructuraFormulario, agregarRegistroUnificado } from '../api'

const TIPO_LABEL = {
  SET: 'Seleccione una opción',
  INT: 'Número entero',
  DECIMAL: 'Número (con decimales)',
  DATE: 'Fecha (AAAA-MM-DD)',
  TEXT: 'Texto',
  FORMULA: 'Calculado automáticamente',
}

// Prefijos numericos para detectar numero consecutivo al iniciar un nuevo registro
function consecutivoSiguiente(registros) {
  const max = registros.reduce((acc, r) => {
    const n = parseInt(String(r['No'] ?? ''), 10)
    return isNaN(n) ? acc : Math.max(acc, n)
  }, 0)
  return max + 1
}

function Campo({ tdef, value, onChange, requerido }) {
  const name = tdef.name
  const type = tdef.type
  const allowed = tdef.allowed || []

  const base = {
    className: 'input text-sm w-full',
  }
  const label = (
    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
      {name}
      {requerido && <span style={{ color: 'var(--danger)' }}> *</span>}
      {type === 'FORMULA' && (
        <span className="ml-1.5 text-[0.65rem] px-1.5 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)' }}>automático</span>
      )}
    </label>
  )

  if (type === 'FORMULA') {
    return (
      <div>
        {label}
        <div className="input text-sm w-full flex items-center text-muted" style={{ color: 'var(--text-muted)' }}>
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Se calcula automáticamente
        </div>
      </div>
    )
  }

  if (type === 'SET') {
    return (
      <div>
        {label}
        <select
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          className="input text-sm w-full"
        >
          <option value="">— Seleccione —</option>
          {allowed.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'DATE') {
    return (
      <div>
        {label}
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          className="input text-sm w-full"
        />
      </div>
    )
  }

  if (type === 'INT' || type === 'DECIMAL') {
    return (
      <div>
        {label}
        <input
          type="number"
          step={type === 'DECIMAL' ? '0.01' : '1'}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={TIPO_LABEL[type]}
          className="input text-sm w-full"
        />
      </div>
    )
  }

  return (
    <div>
      {label}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder="Escriba el dato"
        className="input text-sm w-full"
      />
    </div>
  )
}

export default function FormularioRegistro({ templateKey = 'gestante', registros, onRegistrado, onCancelar }) {
  const [bloques, setBloques] = useState([])
  const [activo, setActivo] = useState(0)
  const [valores, setValores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => {
    let cancel = false
    fetchEstructuraFormulario(templateKey).then((data) => {
      if (!cancel && data.bloques) setBloques(data.bloques)
    }).catch((e) => setError(e.message || 'No se pudo cargar el formulario'))
    return () => { cancel = true }
  }, [templateKey])

  // Inicializar valores vacios para todos los campos
  const campoNombres = useMemo(() => {
    const names = []
    bloques.forEach((b) => b.campos.forEach((c) => names.push(c.name)))
    return names
  }, [bloques])

  // Cuando carga la estructura, preseleccionar el consecutivo
  useEffect(() => {
    if (bloques.length > 0 && !valores['No']) {
      const sig = consecutivoSiguiente(registros || [])
      setValores((v) => ({ ...v, 'No': String(sig) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bloques])

  const setValor = (name, val) => setValores((prev) => ({ ...prev, [name]: val }))

  const bloquesConError = useMemo(() => {
    const res = {}
    campoNombres.forEach((n) => {
      const v = String(valores[n] ?? '').trim()
      // Obligatorios del formulario
      const req = ['No. De Identificación', 'Apellido_1,', 'Nombre_1,'].includes(n)
      if (req && !v) res[n] = 'Campo obligatorio'
    })
    return res
  }, [valores, campoNombres])

  const campoRequerido = (n) => ['No. De Identificación', 'Apellido_1,', 'Nombre_1,'].includes(n)

  const totalRequeridosLlenos = useMemo(() => {
    const reqs = ['No. De Identificación', 'Apellido_1,', 'Nombre_1,']
    return reqs.filter((n) => String(valores[n] ?? '').trim()).length
  }, [valores])

  const guardar = async () => {
    setError('')
    setExito('')
    const faltan = ['No. De Identificación', 'Apellido_1,', 'Nombre_1,'].filter((n) => !String(valores[n] ?? '').trim())
    if (faltan.length > 0) {
      setError('Faltan campos obligatorios: ' + faltan.join(', '))
      return
    }
    setGuardando(true)
    try {
      const res = await agregarRegistroUnificado(valores, templateKey)
      setExito('Registro guardado correctamente.')
      if (onRegistrado) onRegistrado(res)
      // limpiar y preparar siguiente consecutivo
      const sig = Number(res?.row_count ?? 0) + 1
      setValores({ 'No': String(sig) })
    } catch (e) {
      setError(e.message || 'No se pudo guardar el registro')
    } finally {
      setGuardando(false)
    }
  }

  if (bloques.length === 0) {
    return (
      <div className="panel text-center py-10">
        <div className="skeleton h-8 w-64 mx-auto rounded-lg mb-3" />
        <div className="skeleton h-4 w-96 mx-auto rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>Registrar gestante</div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Llena los datos del formulario y guarda el registro. Se acumula en Verificar data.
          </div>
        </div>
        <button onClick={onCancelar} className="btn-secondary text-sm">Volver</button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>{error}</div>
      )}
      {exito && (
        <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--success)', backgroundColor: 'var(--success-bg)' }}>{exito}</div>
      )}

      {/* Pestañas por bloque */}
      <div className="flex flex-wrap gap-1.5">
        {bloques.map((b, idx) => (
          <button
            key={b.id}
            onClick={() => setActivo(idx)}
            className="text-xs font-medium px-3 py-2 rounded-lg transition-all"
            style={{
              color: activo === idx ? 'var(--green-800)' : 'var(--text-secondary)',
              backgroundColor: activo === idx ? 'var(--green-100)' : 'var(--bg-subtle)',
              border: `1px solid ${activo === idx ? 'var(--green-300)' : 'var(--border-subtle)'}`,
            }}
          >
            {b.titulo}
          </button>
        ))}
      </div>

      {/* Campos del bloque activo */}
      {bloques[activo] && (
        <div className="panel">
          <div className="pb-3 mb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{bloques[activo].titulo}</div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{bloques[activo].descripcion}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bloques[activo].campos.map((c) => (
              <Campo
                key={c.name}
                tdef={c}
                value={valores[c.name] ?? ''}
                onChange={setValor}
                requerido={campoRequerido(c.name)}
              />
            ))}
          </div>
          {Object.keys(bloquesConError).length > 0 && (
            <div className="mt-3 text-xs" style={{ color: 'var(--danger)' }}>
              Campos obligatorios pendientes: {Object.keys(bloquesConError).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Navegación entre bloques */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={() => setActivo(Math.max(0, activo - 1))} disabled={activo === 0} className="btn-secondary text-sm disabled:opacity-40">← Anterior</button>
          <button onClick={() => setActivo(Math.min(bloques.length - 1, activo + 1))} disabled={activo === bloques.length - 1} className="btn-secondary text-sm disabled:opacity-40">Siguiente →</button>
        </div>
        <button onClick={guardar} disabled={guardando} className="btn-primary text-sm">
          {guardando ? 'Guardando...' : 'Guardar registro'}
        </button>
      </div>
    </div>
  )
}