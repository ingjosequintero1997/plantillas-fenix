import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  const [carguesLoaded, setCarguesLoaded] = useState(false]