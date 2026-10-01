import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { pointsAdded } from '../features/blueprints/blueprintsSlice.js'
import { REALTIME_TECHS, connectRealtime, isPoint } from '../lib/realtime.js'

const KEY = 'rt-tech'

function initialTech() {
  try {
    const saved = localStorage.getItem(KEY)
    if (REALTIME_TECHS.some((t) => t.value === saved)) return saved
  } catch {
    /* sin almacenamiento */
  }
  return 'none'
}

/** Tecnología de tiempo real elegida en el selector (se recuerda en localStorage). */
export function useRealtimeTech() {
  const [tech, setTech] = useState(initialTech)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, tech)
    } catch {
      /* noop */
    }
  }, [tech])

  return [tech, setTech]
}

/**
 * Mantiene el canal de tiempo real del plano abierto: una conexión por
 * (tecnología, autor, plano), de modo que al cambiar de plano se abandona el
 * canal anterior. Los puntos que llegan se agregan al plano actual en Redux.
 *
 * status: 'off' (None) | 'idle' (sin plano abierto) | 'connecting' | 'connected' | 'disconnected'
 */
export function useBlueprintRealtime(tech, author, name) {
  const dispatch = useDispatch()
  const connRef = useRef(null)
  const [connStatus, setConnStatus] = useState('connecting')
  const active = tech !== 'none' && !!author && !!name

  useEffect(() => {
    if (!active) return undefined
    setConnStatus('connecting')
    const conn = connectRealtime(tech, {
      author,
      name,
      onStatus: setConnStatus,
      onUpdate: (upd) => {
        // Aislamiento por plano: se ignora lo que no sea del canal actual o venga mal formado.
        if (upd?.author !== author || upd?.name !== name || !Array.isArray(upd.points)) return
        const points = upd.points.filter(isPoint)
        if (points.length) dispatch(pointsAdded({ author, name, points }))
      },
    })
    connRef.current = conn
    return () => {
      connRef.current = null
      conn.close()
    }
  }, [active, tech, author, name, dispatch])

  /** Dibujo incremental: publica el punto y lo agrega al plano actual. */
  const addPoint = useCallback(
    (point) => {
      const conn = connRef.current
      const sent = conn ? conn.sendPoint(point) : false
      // Si el servidor hace eco al emisor, el punto se pinta cuando vuelve (sin duplicarlo).
      if (sent && conn.echoesSender) return
      dispatch(pointsAdded({ author, name, points: [point] }))
    },
    [author, name, dispatch],
  )

  const status = tech === 'none' ? 'off' : active ? connStatus : 'idle'
  return { status, addPoint }
}
