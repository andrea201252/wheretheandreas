import { useState } from 'react'
import { Player } from '../App'
import './PhotoBoard.css'

interface Andrea {
  id: number
  x: number
  y: number
  width: number
  height: number
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
        cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="6" fill="${players[activePlayerIndex].cursorColor}"/></svg>') 16 16, auto`
      }}
    >
      {/* Placeholder per l'immagine */}
      <div className="photo-placeholder">
        <p>Photo Level {level}</p>
        <p className="small-text">(Upload your photo here)</p>
        <div className="current-player" style={{ color: players[activePlayerIndex].cursorColor }}>
          Current: {players[activePlayerIndex].name}
        </div>
      </div>

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
    </div>
  )
}
