import { useEffect, useMemo, useRef, useState } from 'react'
import { Player } from '../App'
import {
  attachCursorDisconnectCleanup,
  onCursorsUpdate,
  removePlayerCursor,
  updatePlayerCursor,
  type CursorPayload
} from '../services/gameService'
import './RemoteCursors.css'

type CursorState = Record<string, CursorPayload>

interface RemoteCursorsProps {
  gameId: string
  players: Player[]
  currentPlayerId: string
}

export default function RemoteCursors({ gameId, players, currentPlayerId }: RemoteCursorsProps) {
  const [cursors, setCursors] = useState<CursorState>({})
  const rafRef = useRef<number | null>(null)
  const lastSentRef = useRef<number>(0)

  const playerById = useMemo(() => {
    const m = new Map<string, Player>()
    players.forEach(p => m.set(p.id, p))
    return m
  }, [players])

  useEffect(() => {
    const unsub = onCursorsUpdate(gameId, (data) => setCursors(data || {}))
    return () => unsub()
  }, [gameId])

  useEffect(() => {
    attachCursorDisconnectCleanup(gameId, currentPlayerId)

    const send = (clientX: number, clientY: number) => {
      const w = Math.max(1, window.innerWidth)
      const h = Math.max(1, window.innerHeight)
      const payload: CursorPayload = {
        x: Math.min(1, Math.max(0, clientX / w)),
        y: Math.min(1, Math.max(0, clientY / h)),
        ts: Date.now()
      }
      updatePlayerCursor(gameId, currentPlayerId, payload).catch(() => {})
    }

    const scheduleSend = (clientX: number, clientY: number) => {
      const now = performance.now()
      // throttle ~30fps
      if (now - lastSentRef.current < 33) return
      lastSentRef.current = now

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => send(clientX, clientY))
    }

    const onMove = (e: PointerEvent) => scheduleSend(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      scheduleSend(t.clientX, t.clientY)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })

    // Invio iniziale (evita cursore "zero")
    scheduleSend(window.innerWidth / 2, window.innerHeight / 2)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('touchmove', onTouch)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      removePlayerCursor(gameId, currentPlayerId).catch(() => {})
    }
  }, [gameId, currentPlayerId])

  const others = Object.entries(cursors)
    .filter(([playerId]) => playerId !== currentPlayerId)
    .map(([playerId, c]) => ({ playerId, c }))

  return (
    <div className="remote-cursors-layer" aria-hidden>
      {others.map(({ playerId, c }) => {
        const p = playerById.get(playerId)
        const left = `${(c.x ?? 0) * 100}%`
        const top = `${(c.y ?? 0) * 100}%`
        return (
          <div
            key={playerId}
            className="remote-cursor"
            style={{ left, top, borderColor: p?.cursorColor || '#fff' }}
            title={p?.name || playerId}
          >
            <div className="remote-cursor__dot" style={{ backgroundColor: p?.cursorColor || '#fff' }} />
            <div className="remote-cursor__label" style={{ color: p?.cursorColor || '#fff' }}>
              {p?.name || playerId}
            </div>
          </div>
        )
      })}
    </div>
  )
}
