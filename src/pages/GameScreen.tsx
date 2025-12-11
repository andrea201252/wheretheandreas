import { useState, useEffect } from 'react'
import { Player } from '../App'
import GameTimer from '../components/GameTimer'
import PhotoBoard from '../components/PhotoBoard'
import WinPopup from '../components/WinPopup'
import { updatePlayerScore, updateGameTime } from '../services/gameService'
import './GameScreen.css'

interface GameScreenProps {
  level: number
  players: Player[]
  gameId: string | null
  onComplete: (winnerId?: string) => void
  onBackToIntro: () => void
}

interface Andrea {
  id: number
  x: number
  y: number
  width: number
  height: number
}

interface AndreaLocation {
  andrea1: Andrea
  andrea2: Andrea
}

export default function GameScreen({ level, players, gameId, onComplete, onBackToIntro }: GameScreenProps) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [showSolution, setShowSolution] = useState(false)
  const [foundAndreas, setFoundAndreas] = useState<number[]>([])
  const [winner, setWinner] = useState<Player | null>(null)
  const [showWinPopup, setShowWinPopup] = useState(false)
  
  // Configurazione Andrea per livelli con coordinate per ogni Andrea
  const andreasConfig: Record<number, AndreaLocation> = {
    1: {
      andrea1: { id: 1, x: 0, y: 0, width: 80, height: 100 },
      andrea2: { id: 2, x: 0, y: 0, width: 70, height: 90 },
    },
    2: {
      andrea1: { id: 1, x: 0, y: 0, width: 60, height: 80 },
      andrea2: { id: 2, x: 0, y: 0, width: 75, height: 95 },
    },
    3: {
      andrea1: { id: 1, x: 0, y: 0, width: 70, height: 85 },
      andrea2: { id: 2, x: 0, y: 0, width: 80, height: 100 },
    },
    4: {
      andrea1: { id: 1, x: 0, y: 0, width: 75, height: 90 },
      andrea2: { id: 2, x: 0, y: 0, width: 70, height: 95 },
    },
    5: {
      andrea1: { id: 1, x: 0, y: 0, width: 80, height: 100 },
      andrea2: { id: 2, x: 0, y: 0, width: 75, height: 95 },
    },
  }

  const currentAndreaLocations = andreasConfig[level] || andreasConfig[1]
  const currentAndreas = [currentAndreaLocations.andrea1, currentAndreaLocations.andrea2]

  useEffect(() => {
    if (timeLeft <= 0) {
      setShowSolution(true)
      return
    }

    const timer = setTimeout(() => {
      const newTime = timeLeft - 1
      setTimeLeft(newTime)
      
      // Aggiorna il tempo su Firebase se online
      if (gameId) {
        updateGameTime(gameId, newTime).catch(err => console.error('Errore update tempo:', err))
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, gameId])

  useEffect(() => {
    // Passa automaticamente al prossimo livello dopo 3 secondi se vinto prima del tempo
    if (winner && !showSolution) {
      const timer = setTimeout(async () => {
        // Aggiorna punteggio su Firebase se online
        if (gameId) {
          const newScore = winner.score + 10
          await updatePlayerScore(gameId, winner.id, newScore).catch(err => 
            console.error('Errore update score:', err)
          )
        }
        onComplete(winner.id)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [winner, showSolution, onComplete, gameId])

  const handlePhotoClick = (x: number, y: number, playerId: string) => {
    if (showSolution || winner) return

    // Verifica se il click è su un Andrea
    for (const andrea of currentAndreas) {
      if (
        x >= andrea.x &&
        x <= andrea.x + andrea.width &&
        y >= andrea.y &&
        y <= andrea.y + andrea.height
      ) {
        if (!foundAndreas.includes(andrea.id)) {
          const newFound = [...foundAndreas, andrea.id]
          setFoundAndreas(newFound)
          
          // Se trovi entrambi, mostra il popup di vittoria
          if (newFound.length === 2) {
            const winningPlayer = players.find(p => p.id === playerId)
            if (winningPlayer) {
              setWinner(winningPlayer)
              setShowWinPopup(true)
            }
          }
        }
        return
      }
    }
  }

  const handleShowSolution = () => {
    setShowSolution(true)
  }

  return (
    <div className="game-screen">
      <div className="game-header">
        <h2>Level {level}</h2>
        <GameTimer timeLeft={timeLeft} />
        <div className="players-status">
          {players.map(p => (
            <div key={p.id} style={{ color: p.cursorColor }}>
              {p.name}: {p.score}
            </div>
          ))}
        </div>
        <button onClick={onBackToIntro} className="back-button">
          ← Back
        </button>
      </div>

      <div className="game-container">
        <PhotoBoard 
          level={level}
          onPhotoClick={handlePhotoClick}
          showSolution={showSolution}
          andrews={currentAndreas}
          foundAndreas={foundAndreas}
          players={players}
        />
      </div>

      {showWinPopup && winner && (
        <WinPopup player={winner} onClose={() => setShowWinPopup(false)} />
      )}

      {showSolution && !winner && (
        <div className="solution-panel">
          <h3>Solution!</h3>
          <p>The two Andreas were here:</p>
          {timeLeft <= 0 && !foundAndreas.includes(1) && (
            <button onClick={handleShowSolution}>Continue</button>
          )}
        </div>
      )}
    </div>
  )
}
