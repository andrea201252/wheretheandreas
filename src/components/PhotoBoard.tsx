import { useState } from 'react'
import { Player } from '../App'
import './PhotoBoard.css'

interface Andrea {
  id: number
  x: number
  y: number
  width: number
  height: number
  buffer?: number
}

interface PhotoBoardProps {
  level: number
  onPhotoClick: (x: number, y: number, playerId: string) => void
  showSolution: boolean
  andrews: Andrea[]
  foundAndreas: number[]
  players: Player[]
}

export default function PhotoBoard({ 
  level, 
  onPhotoClick, 
  showSolution, 
  andrews,
  foundAndreas,
  players
}: PhotoBoardProps) {
  const [clickPositions, setClickPositions] = useState<{ x: number; y: number; playerId: string }[]>([])
  const [activePlayerIndex, setActivePlayerIndex] = useState(0)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const playerId = players[activePlayerIndex].id
    setClickPositions([...clickPositions, { x, y, playerId }])
    onPhotoClick(x, y, playerId)

    // Cambia giocatore attivo
    setActivePlayerIndex((activePlayerIndex + 1) % players.length)
  }

  return (
      <div 
      className="photo-board" 
      onClick={handleClick}
      style={{
        cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="6" fill="${players[activePlayerIndex].cursorColor}"/></svg>') 16 16, auto`,
        backgroundImage: `url('/images/level${level}.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Rettangoli degli Andrea per debug/soluzione */}
      {showSolution && andrews.map(andrea => (
        <div
          key={`rect-${andrea.id}`}
          className="andrea-rectangle"
          style={{
            left: `${andrea.x}px`,
            top: `${andrea.y}px`,
            width: `${andrea.width}px`,
            height: `${andrea.height}px`,
          }}
        >
          <span className="andrea-label">Andrea {andrea.id}</span>
        </div>
      ))}

      {/* Arrows che puntano agli Andrea */}
      {(showSolution || foundAndreas.length > 0) && andrews.map(andrea => (
        <div
          key={andrea.id}
          className="arrow-indicator"
          style={{
            left: `${andrea.x + andrea.width / 2}px`,
            top: `${andrea.y + andrea.height / 2}px`,
          }}
        >
          ↓
        </div>
      ))}

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
      <div className="current-player-badge" style={{ color: players[activePlayerIndex].cursorColor }}>
        🎮 {players[activePlayerIndex].name}
      </div>
    </div>
  )
}
