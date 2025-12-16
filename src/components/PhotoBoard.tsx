import { useState } from 'react'
import { Player } from '../App'
import { Polygon } from '../utils/polygonUtils'
import './PhotoBoard.css'

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

export default function PhotoBoard({
  level,
  onPhotoClick,
  showSolution,
  andrews,
  players,
  currentPlayerId
}: PhotoBoardProps) {
  const [clickPositions, setClickPositions] = useState<{ x: number; y: number; playerId: string }[]>([])
  
  const currentPlayer = currentPlayerId ? players.find(p => p.id === currentPlayerId) : players[0]

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentPlayer) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setClickPositions([...clickPositions, { x, y, playerId: currentPlayer.id }])
    onPhotoClick(x, y, currentPlayer.id)
  }

  // Converte i punti del poligono a stringa SVG path
  const polygonToPath = (polygon: Polygon): string => {
    return polygon.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
  }

  // Calcola il bounding box del poligono per posizionare la label
  const getPolygonCenter = (polygon: Polygon) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    polygon.points.forEach(p => {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    })
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  return (
    <div
      className="photo-board"
      onClick={handleClick}
      style={{
        cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="6" fill="${currentPlayer?.cursorColor || '#000'}"/></svg>') 16 16, auto`,
        backgroundImage: `url('/images/level${level}.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* SVG per disegnare i poligoni */}
      <svg className="polygon-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {(showSolution || true) && andrews.map(andrea => (
          <g key={`polygon-${andrea.id}`}>
            <path
              d={polygonToPath(andrea.polygon)}
              className="andrea-polygon"
              fill="rgba(255, 107, 107, 0.2)"
              stroke="#FF6B6B"
              strokeWidth="3"
            />
          </g>
        ))}
      </svg>

      {/* Label dei poligoni */}
      {showSolution && andrews.map(andrea => {
        const center = getPolygonCenter(andrea.polygon)
        return (
          <div
            key={`label-${andrea.id}`}
            className="andrea-label"
            style={{
              left: `${center.x}px`,
              top: `${center.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            Andrea {andrea.id}
          </div>
        )
      })}

      {/* Visual feedback dei click */}
      {clickPositions.map((pos, idx) => (
        <div
          key={idx}
          className="click-marker"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            borderColor: players.find(p => p.id === pos.playerId)?.cursorColor,
            backgroundColor: players.find(p => p.id === pos.playerId)?.cursorColor + '20'
          }}
        />
      ))}

      {/* Current player indicator */}
      {currentPlayer && (
        <div className="current-player-badge" style={{ color: currentPlayer.cursorColor }}>
          {currentPlayer.name}
        </div>
      )}
    </div>
  )
}
