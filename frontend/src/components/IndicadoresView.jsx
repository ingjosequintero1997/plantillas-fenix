import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import { fetchCargues, fetchIndicadores, fetchIndicadoresDeCargue, fetchTemplates } from '../api'
import { useNavigate } from 'react-router-dom'
import { loader } from '../components/QualityBanner'

export default function IndicadoresView({ templateKey = 'gestante', dataValidada = '', templateNames = [], ipsName = '' }) {
  const [indicadores, setIndicadores] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(templateKey || 'gestante')
  const [loaded, setLoaded] = useState(false)
  const [verPorMunicipio, setVerPorMunicipio] = useState(false)
  const [cargues, setCargues] = useState([])
  const [cargueId, setCargueId] = useState('')
  const [carguesLoaded, setCarguesLoaded] = useState(false)
  const { user } = useAuth()

  useEffect(() => { if (templateKey) setSelectedTemplate(templateKey) }, [templateKey])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        let list = await fetchCargues(selectedTemplate)
        if (!list.length) {
          const todos = await fetchCargues('')
          list = todos.filter((c) => !c.template_key || c.template_key === selectedTemplate)
          if (!list.length) list = todos
        }
        if (!mounted) return
        setCargues(list)
        if (list.length && !cargueId) setCargueId(String(list[0].id))
      } catch (e) {
        if (mounted) setError('No se pudo cargar el historial de cargues: ' + (e.message || 'error'))
      } finally { if (mounted) setCarguesLoaded(true) }
    }
    load()
    return () => { mounted = false }
  }, [selectedTemplate])

  const cargueIdRef = useRef(cargueId)
  cargueIdRef.current = cargueId
  const carguesRef = useRef(cargues)
  carguesRef.current = cargues
  const dataValidadaRef = useRef(dataValidada)
  dataValidadaRef.current = dataValidada
  const handleGenerateRef = useRef(null)

  // Determinar si estamos en modo IPS y si hay un nombre de IPS específico
  const isIpsUser = user?.role === 'ips_user'
  const ipsUserName = isIpsUser ? user?.ips_name || '' : ''

  const handleGenerate = useCallback(async () => {
    setLoading(true); setError(''); setIndicadores(null); setVerPorMunicipio(false)
    try {
      let result = null
      const id = cargueIdRef.current || (carguesRef.current.length ? carguesRef.current[0].id : '')
      if (id) { try { result = await fetchIndicadoresDeCargue(id) } catch (e) { result = null } }
      if (!result && dataValidadaRef.current && typeof dataValidadaRef.current === 'string' && dataValidadaRef.current.trim()) {
        try { result = await fetchIndicadores(selectedTemplate, String(dataValidadaRef.current).trim()) } catch (e) { result = null }
      }
      if (!result) {
        try {
          let stored = null
          try { stored = leerUltimaData() } catch (e) {}
          if (!stored) { try { stored = JSON.parse(window.__ultimaDataValidada || 'null') } catch (e) {} }
          if (!stored) { try { stored = JSON.parse(sessionStorage.getItem('ultima_data_validada') || 'null') } catch (e) {} }
          if (!stored) { try { stored = JSON.parse(localStorage.getItem('ultima_data_validada') || 'null') } catch (e) {} }
          if (stored) {
            let st = stored.corrected_text || stored.raw_text || ''
            if (stored.compressed && /^[A-Za-z0-9+/=]+$/.test(st)) {
              const pako = await import('pako')
              const bin = atob(st)
              const bytes = new Uint8Array(bin.length)
              for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
              st = pako.ungzip(bytes, { to: 'string' })
            }
            if (st && st.trim()) {
              // Si es IPS, filtrar por la IPS del usuario
              if (isIpsUser && ipsUserName) {
                // Agregamos el nombre de la IPS al filtrado para que solo muestre indicadores de esa IPS
                result = await fetchIndicadores(selectedTemplate, st, ipsUserName)
              } else {
                result = await fetchIndicadores(selectedTemplate, String(st).trim())
              }
            }
          }
        } catch (e) { /* ignore */ }
      }
      if (!result) { setError(`No se encontro data valida (cargues disponibles: ${carguesRef.current.length}). Valida una data primero.`); setLoading(false); return }
      setIndicadores(result)
      setLoaded(true)
    } catch (e) { setError('Error al generar indicadores: ' + (e.message || 'Error desconocido')) }
    finally { setLoading(false) }
  }, [selectedTemplate, isIpsUser, ipsUserName])

  handleGenerateRef.current = handleGenerate

  // Efecto para generar indicadores cuando cambian los datos o el usuario IPS
  useEffect(() => {
    if (isIpsUser && ipsUserName) {
      // Para IPS, esperar a que carguen los cargues primero
      if (cargues.length > 0 && !loading) {
        handleGenerate()
      } else if (!loading) {
        // Trigger load after a short delay to ensure cargues are fetched
        const timer = setTimeout(() => {
          if (!loading) handleGenerate()
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [isIpsUser, ipsUserName, cargues.length, loading, handleGenerate])

  // Si es IPS y no hay cargues aún, mostrar mensaje
  if (isIpsUser && !carguesLoaded && !loading) {
    return <div className="skeleton h-40 w-full rounded-xl" />
  }

  // Mostrar error si no hay data disponible para este IPS
  if (isIpsUser && cargues.length > 0 && error && error.includes('No se encontro data valida')) {
    // Mostrar mensaje específico para IPS
    // El error ya se muestra abajo
  }

  return (
    <div>
      <div className="skeleton h-40 w-full rounded-xl" />
    </div>
  )
}