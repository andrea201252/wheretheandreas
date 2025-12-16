import { useState, useRef, useEffect } from 'react'
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
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const currentPlayer = currentPlayerId ? players.find(p => p.id === currentPlayerId) : players[0]

  // Quando l'immagine è caricata, salva le dimensioni
  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const handleImageLoad = () => {
      // Usa le dimensioni reali dell'immagine visualizzata
      const rect = img.getBoundingClientRect()
      setImageDimensions({
        width: rect.width,
        height: rect.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      })
      console.log(`Immagine caricata: display=${rect.width}x${rect.height}, naturale=${img.naturalWidth}x${img.naturalHeight}`)
    }

    if (img.complete) {
      handleImageLoad()
    } else {
      img.addEventListener('load', handleImageLoad)
      return () => img.removeEventListener('load', handleImageLoad)
    }
  }, [level])

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!currentPlayer) return
    
    const img = e.currentTarget
    const rect = img.getBoundingClientRect()

    // Click relativo all'immagine visualizzata
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Scala le coordinate dalla dimensione visualizzata alla dimensione originale
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    
    const originalX = clickX * scaleX
    const originalY = clickY * scaleY

    console.log(`Click visualizzato: x=${clickX.toFixed(2)}, y=${clickY.toFixed(2)}`)
    console.log(`Dimensioni immagine - display: ${rect.width}x${rect.height}, naturale: ${img.naturalWidth}x${img.naturalHeight}`)
    console.log(`Scale factors: ${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`)
    console.log(`Click originale (scaled): x=${originalX.toFixed(2)}, y=${originalY.toFixed(2)}`)

    setClickPositions([...clickPositions, { x: originalX, y: originalY, playerId: currentPlayer.id }])
    onPhotoClick(originalX, originalY, currentPlayer.id)
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
      ref={containerRef}
      className="photo-board"
      style={{
        cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="6" fill="${currentPlayer?.cursorColor || '#000'}"/></svg>') 16 16, auto`,
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Immagine del livello */}
      <img
        ref={imgRef}
        src={`/images/level${level}.jpeg`}
        alt={`Level ${level}`}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
          cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="6" fill="${currentPlayer?.cursorColor || '#000'}"/></svg>') 16 16, auto`
        }}
      />

      {/* SVG per disegnare i poligoni - scalati alle coordinate originali */}
      <svg 
        className="polygon-overlay" 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: imageDimensions.naturalWidth || '100%', 
          height: imageDimensions.naturalHeight || '100%',
          pointerEvents: 'none'
        }}
        viewBox={`0 0 ${imageDimensions.naturalWidth} ${imageDimensions.naturalHeight}`}
      >
        {(showSolution) && andrews.map(andrea => (
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
