import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { Player } from "../App"
import { Polygon } from "../utils/polygonUtils"
import "./PhotoBoard.css"

interface Andrea {
  id: number
  polygon: Polygon
}

interface PhotoBoardProps {
  level: number
  onPhotoClick: (x: number, y: number, playerId: string) => void
  showSolution: boolean
  andrews: Andrea[]
  players: Player[]
  currentPlayerId?: string
}

type Size = { w: number; h: number }
type StageLayout = { left: number; top: number; w: number; h: number }

function computeStageLayout(container: Size, natural: Size): StageLayout {
  if (container.w <= 0 || container.h <= 0 || natural.w <= 0 || natural.h <= 0) {
    return { left: 0, top: 0, w: container.w || 0, h: container.h || 0 }
  }

  const imgAR = natural.w / natural.h
  const boxAR = container.w / container.h

  // "contain": l'immagine entra nel box senza crop.
  if (imgAR > boxAR) {
    // limitata dalla larghezza
    const w = container.w
    const h = container.w / imgAR
    return { left: 0, top: (container.h - h) / 2, w, h }
  }

  // limitata dall'altezza
  const h = container.h
  const w = container.h * imgAR
  return { left: (container.w - w) / 2, top: 0, w, h }
}

export default function PhotoBoard({
  level,
  onPhotoClick,
  showSolution,
  andrews,
  players,
  currentPlayerId
}: PhotoBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [natural, setNatural] = useState<Size>({ w: 0, h: 0 })
  const [containerSize, setContainerSize] = useState<Size>({ w: 0, h: 0 })
  const [clickPositions, setClickPositions] = useState<Array<{ x: number; y: number; playerId: string }>>([])

  const currentPlayer = useMemo(() => {
    if (!players.length) return undefined
    if (!currentPlayerId) return players[0]
    return players.find(p => p.id === currentPlayerId) || players[0]
  }, [players, currentPlayerId])

  const stage = useMemo(() => computeStageLayout(containerSize, natural), [containerSize, natural])

  // Track container resize (responsive)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const cr = entry.contentRect
      setContainerSize({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // When level changes, reset clicks
  useEffect(() => {
    setClickPositions([])
  }, [level])

  const handleImgLoad = () => {
    const img = imgRef.current
    if (!img) return
    setNatural({ w: img.naturalWidth, h: img.naturalHeight })
  }

  const handleStageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!currentPlayer) return
    if (natural.w <= 0 || natural.h <= 0) return

    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0 || rect.height <= 0) return

    const rx = e.clientX - rect.left
    const ry = e.clientY - rect.top

    // Ignora click fuori dall'area reale dell'immagine
    if (rx < 0 || ry < 0 || rx > rect.width || ry > rect.height) return

    const x = (rx / rect.width) * natural.w
    const y = (ry / rect.height) * natural.h

    setClickPositions(prev => [...prev, { x, y, playerId: currentPlayer.id }])
    onPhotoClick(x, y, currentPlayer.id)
  }

  const polygonToPath = (polygon: Polygon): string => {
    return polygon.points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
  }

  const getPolygonCenter = (polygon: Polygon) => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity
    polygon.points.forEach(p => {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    })
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  }

  const cursorSvg = useMemo(() => {
    const color = encodeURIComponent(currentPlayer?.cursorColor || "#000")
    return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='16' r='6' fill='${color}'/></svg>") 16 16, auto`
  }, [currentPlayer?.cursorColor])

  return (
    <div
      ref={containerRef}
      className="photo-board"
      style={{ cursor: cursorSvg }}
    >
      <div
        ref={stageRef}
        className="photo-board__stage"
        onClick={handleStageClick}
        style={{ left: stage.left, top: stage.top, width: stage.w, height: stage.h, cursor: cursorSvg }}
      >
        <img
          ref={imgRef}
          className="photo-board__img"
          src={`/images/level${level}.jpeg`}
          alt={`Level ${level}`}
          onLoad={handleImgLoad}
          draggable={false}
        />

        {natural.w > 0 && natural.h > 0 && (
          <svg
            className="polygon-overlay"
            viewBox={`0 0 ${natural.w} ${natural.h}`}
            preserveAspectRatio="none"
          >
            {showSolution &&
              andrews.map(andrea => (
                <path
                  key={`polygon-${andrea.id}`}
                  d={polygonToPath(andrea.polygon)}
                  className="andrea-polygon"
                  fill="rgba(255, 107, 107, 0.2)"
                  stroke="#FF6B6B"
                  strokeWidth="3"
                />
              ))}
          </svg>
        )}

        {showSolution && natural.w > 0 && natural.h > 0 &&
          andrews.map(andrea => {
            const c = getPolygonCenter(andrea.polygon)
            return (
              <div
                key={`label-${andrea.id}`}
                className="andrea-label"
                style={{
                  left: `${(c.x / natural.w) * 100}%`,
                  top: `${(c.y / natural.h) * 100}%`,
                  transform: "translate(-50%, -50%)"
                }}
              >
                Andrea {andrea.id}
              </div>
            )
          })}

        {natural.w > 0 && natural.h > 0 &&
          clickPositions.map((pos, idx) => {
            const player = players.find(p => p.id === pos.playerId)
            return (
              <div
                key={idx}
                className="click-marker"
                style={{
                  left: `${(pos.x / natural.w) * 100}%`,
                  top: `${(pos.y / natural.h) * 100}%`,
                  borderColor: player?.cursorColor,
                  backgroundColor: (player?.cursorColor || "#4a90e2") + "20"
                }}
              />
            )
          })}
      </div>

      {currentPlayer && (
        <div className="current-player-badge" style={{ color: currentPlayer.cursorColor }}>
          {currentPlayer.name}
        </div>
      )}
    </div>
  )
}
