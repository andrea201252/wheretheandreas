import { useState, useEffect } from 'react'
import { Player } from '../App'
import GameTimer from '../components/GameTimer'
import PhotoBoard from '../components/PhotoBoard'
import WinPopup from '../components/WinPopup'
import Leaderboard from '../components/Leaderboard'
import { updatePlayerScore, updateGameTime, onPlayersUpdate } from '../services/gameService'
import { isPointInPolygon, rectangleToPolygon, Point, Polygon } from '../utils/polygonUtils'
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
  polygon: Polygon
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
  const [findersOrder, setFindersOrder] = useState<string[]>([])
  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>(players)
  
  // Configurazione Andrea con poligoni (convertiti da rettangoli)
  const andreasConfig: Record<number, AndreaLocation> = {
    1: {
      andrea1: { id: 1, polygon: rectangleToPolygon(-1, 748, 191, 304) },
      andrea2: { id: 2, polygon: rectangleToPolygon(938, 612, 122, 397) },
    },
    2: {
      andrea1: { id: 1, polygon: rectangleToPolygon(613, 556, 76, 52) },
      andrea2: { id: 2, polygon: rectangleToPolygon(751, 495, 82, 113) },
    },
    3: {
      andrea1: { id: 1, polygon: rectangleToPolygon(58, 429, 88, 261) },
      andrea2: { id: 2, polygon: rectangleToPolygon(904, 576, 198, 257) },
    },
    4: {
      andrea1: { id: 1, polygon: rectangleToPolygon(58, 887, 21, 38) },
      andrea2: { id: 2, polygon: rectangleToPolygon(452, 806, 44, 161) },
    },
    5: {
      andrea1: { id: 1, polygon: rectangleToPolygon(118, 766, 282, 85) },
      andrea2: { id: 2, polygon: rectangleToPolygon(177, 512, 63, 131) },
    },
  }

  const currentAndreaLocations = andreasConfig[level] || andreasConfig[1]
  const currentAndreas = [currentAndreaLocations.andrea1, currentAndreaLocations.andrea2]

  // Sincronizza i giocatori online
  useEffect(() => {
    if (!gameId) return

    const unsubscribe = onPlayersUpdate(gameId, (playersData) => {
      if (playersData) {
        const syncedPlayers = Object.values(playersData).map((p: any) => ({
          id: p.id,
          name: p.name,
          cursorColor: p.cursorColor,
          score: p.score || 0
        })) as Player[]
        setConnectedPlayers(syncedPlayers)
      }
    })

    return () => unsubscribe()
  }, [gameId])

  const displayPlayers = gameId ? connectedPlayers : players

  useEffect(() => {
    if (timeLeft <= 0) {
      setShowSolution(true)
      return
    }

    const timer = setTimeout(() => {
      const newTime = timeLeft - 1
      setTimeLeft(newTime)

      if (gameId) {
        updateGameTime(gameId, newTime).catch(err => console.error('Errore update tempo:', err))
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, gameId])

  useEffect(() => {
    if (winner && !showSolution) {
      const timer = setTimeout(async () => {
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

    const player = displayPlayers.find(p => p.id === playerId)
    if (!player) return

    const clickPoint: Point = { x, y }
    console.log(\Click at: x=\, y=\\)
    console.log('Current Andreas:', currentAndreas)

    // Verifica se il click è dentro un poligono Andrea usando ray casting
    for (const andrea of currentAndreas) {
      console.log(\Checking Andrea \: \, andrea.polygon.points)
      
      if (isPointInPolygon(clickPoint, andrea.polygon)) {
        console.log(\HIT! Andrea \ found!\)
        if (!foundAndreas.includes(andrea.id)) {
          const newFound = [...foundAndreas, andrea.id]
          setFoundAndreas(newFound)
          setFindersOrder([...findersOrder, playerId])
          
          if (newFound.length === 2) {
            setWinner(player)
            setShowWinPopup(true)
          }
        }
        return
      }
    }
    console.log('No Andrea hit')
  }

  const handleContinue = () => {
    onComplete()
  }

  return (
    <div className="game-screen">
      {winner && !showSolution && (
        <div className="celebration-message">
          <span>Great {winner.name} You Find them!</span>
        </div>
      )}

      <div className="game-header">
        <h2>Level {level}</h2>
        <GameTimer timeLeft={timeLeft} />
        <div className="players-status">
          <div className="connected-players">
            <strong>Online Players ({displayPlayers.length}):</strong>
            {displayPlayers.map(p => (
              <div key={p.id} style={{ color: p.cursorColor }}>
                {p.name}: {p.score}
              </div>
            ))}
          </div>
        </div>
        <button onClick={onBackToIntro} className="back-button">
           Back
        </button>
      </div>

      <div className="game-container">
        <PhotoBoard 
          level={level}
          onPhotoClick={handlePhotoClick}
          showSolution={showSolution}
          andrews={currentAndreas}
          foundAndreas={foundAndreas}
          players={displayPlayers}
        />
      </div>

      <Leaderboard finders={findersOrder} players={displayPlayers} />

      {showWinPopup && winner && (
        <WinPopup player={winner} onClose={() => setShowWinPopup(false)} />
      )}

      {showSolution && !winner && (
        <div className="solution-panel">
          <h3>Solution!</h3>
          <p>The two Andreas were here:</p>
          <button onClick={handleContinue} className="continue-button">Continue to Next Level</button>
        </div>
      )}
    </div>
  )
}
