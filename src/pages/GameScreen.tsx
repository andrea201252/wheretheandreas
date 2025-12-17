import { useState, useEffect } from 'react'
import { Player, WinnerData } from '../App'
import GameTimer from '../components/GameTimer'
import PhotoBoard from '../components/PhotoBoard'
import Leaderboard from '../components/Leaderboard'
import { submitLevelResult, updateGameTime, onPlayersUpdate } from '../services/gameService'
import { isPointInPolygon, htmlPolygonToPolygon, Point, Polygon } from '../utils/polygonUtils'
import './GameScreen.css'

interface GameScreenProps {
  level: number
  players: Player[]
  gameId: string | null
  onComplete: (winnerId?: string, winnerData?: WinnerData) => void
  onBackToIntro: () => void
  currentPlayerId?: string
}

interface Andrea {
  id: number
  polygon: Polygon
}

interface AndreaLocation {
  andrea1: Andrea
  andrea2: Andrea
}

// Converte un rettangolo HTML image map (x1,y1,x2,y2) a poligono
const rectToPolygon = (x1: number, y1: number, x2: number, y2: number): Polygon => {
  return {
    points: [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 }
    ]
  }
}

export default function GameScreen({ level, players, gameId, onComplete, onBackToIntro, currentPlayerId }: GameScreenProps) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [showSolution, setShowSolution] = useState(false)
  const [foundAndreas, setFoundAndreas] = useState<number[]>([])
  const [winners, setWinners] = useState<WinnerData[]>([])
  const [showWinPopup, setShowWinPopup] = useState<WinnerData | null>(null)
  const [findersOrder, setFindersOrder] = useState<string[]>([])
  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>(players)
  const [playerClicks, setPlayerClicks] = useState<Record<string, number>>({})

  // Coordinate HTML image map convertite a poligoni - Associate al level corretto
  const andreasConfig: Record<number, AndreaLocation> = {
    1: {
      andrea1: { id: 1, polygon: htmlPolygonToPolygon([120,748,164,815,190,861,162,912,147,985,149,1025,110,1043,29,1052,32,979,6,959,-1,839]) },
      andrea2: { id: 2, polygon: htmlPolygonToPolygon([967,618,943,628,942,679,938,711,943,728,958,741,975,752,999,746,1008,755,1020,778,1018,805,968,822,946,841,955,872,963,937,966,979,951,996,1017,1007,1044,1009,1060,951,1047,833,1007,703,1002,650,1005,638,987,615,965,612]) },
    },
    2: {
      andrea1: { id: 1, polygon: rectToPolygon(624,527,706,615) },
      andrea2: { id: 2, polygon: rectToPolygon(751,465,833,553) },
    },
    3: {
      andrea1: { id: 1, polygon: rectToPolygon(52,436,157,703) },
      andrea2: { id: 2, polygon: rectToPolygon(908,571,1084,839) },
    },
    4: {
      andrea1: { id: 1, polygon: rectToPolygon(30,862,92,940) },
      andrea2: { id: 2, polygon: rectToPolygon(445,901,507,979) },
    },
    5: {
      andrea1: { id: 1, polygon: rectToPolygon(151,763,387,871) },
      andrea2: { id: 2, polygon: rectToPolygon(157,493,238,675) },
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

  // Quando c'è un vincitore, mostra il popup (senza auto-advance)
  useEffect(() => {
    if (showWinPopup && !showSolution) {
      console.log(`Popup di vittoria mostrato per ${showWinPopup.playerName}`)
    }
  }, [showWinPopup, showSolution])

  const handlePhotoClick = (x: number, y: number, playerId: string) => {
    if (showSolution || showWinPopup) return // Non permettere click dopo vittoria
    if (playerId !== currentPlayerId) return

    const player = displayPlayers.find(p => p.id === playerId)
    if (!player) return

    // Limite di 10 click per giocatore
    const currentClicks = playerClicks[playerId] || 0
    if (currentClicks >= 10) {
      console.log(`Player ${playerId} ha raggiunto il limite di click`)
      return
    }

    setPlayerClicks({ ...playerClicks, [playerId]: currentClicks + 1 })

    const clickPoint: Point = { x, y }
    console.log(`Click at: x=${x}, y=${y}`)
    console.log(`Current level ${level}, Andrews:`, currentAndreas)
    console.log(`Checking click against ${currentAndreas.length} andrews...`)

    // Verifica se il click è dentro un poligono Andrea usando ray casting
    for (const andrea of currentAndreas) {
      console.log(`Checking Andrea ${andrea.id}:`, andrea.polygon)
      if (isPointInPolygon(clickPoint, andrea.polygon)) {
        console.log(`HIT! Andrea ${andrea.id} found!`)
        if (!foundAndreas.includes(andrea.id)) {
          const newFound = [...foundAndreas, andrea.id]
          console.log(`Found count: ${newFound.length}/2`)
          setFoundAndreas(newFound)
          setFindersOrder([...findersOrder, playerId])

          if (newFound.length === 2) {
            console.log(`VITTORIA! Entrambi gli Andrea trovati!`)
            // Registra il vincitore con il tempo impiegato
            const timeSpent = 30 - timeLeft
            const winnerData: WinnerData = {
              playerId: player.id,
              playerName: player.name,
              time: timeSpent,
              level: level
            }
            setWinners([...winners, winnerData])
            setShowWinPopup(winnerData)
          } else {
            console.log(`Trovato 1 Andrea, aspetta il secondo...`)
          }
        }
        return
      }
    }
    console.log(`MISS! Click not in any Andrea polygon`)
  }

  const handleContinue = async () => {
    // Online: salva SEMPRE un risultato per questo player (serve per ranking/punti)
    if (gameId && currentPlayerId) {
      const isWinner = !!showWinPopup
      const time = isWinner ? showWinPopup!.time : 30
      await submitLevelResult(gameId, level, currentPlayerId, {
        time,
        found: isWinner,
        submittedAt: Date.now()
      }).catch(err => console.error('Errore submit result:', err))
    }
    // Passa i dati del vincitore a App.tsx
    if (showWinPopup) {
      onComplete(showWinPopup.playerId, showWinPopup)
    } else {
      onComplete(undefined, undefined)
    }
  }

  return (
    <div className="game-screen">
      <div className="game-header">
        <h2>Level {level}</h2>
        <GameTimer timeLeft={timeLeft} />
        <div className="players-status">
          <div className="connected-players">
            <strong>Giocatori ({displayPlayers.length}):</strong>
            {displayPlayers.map(p => (
              <div key={p.id} style={{ color: p.cursorColor, fontWeight: p.id === currentPlayerId ? 'bold' : 'normal' }}>
                {p.name}: {p.score} {p.id === currentPlayerId && '(Tu)'}
              </div>
            ))}
          </div>
        </div>
        <button onClick={onBackToIntro} className="game-back-button">
           Back
        </button>
      </div>

      <div className="game-container">
        <PhotoBoard 
          level={level}
          onPhotoClick={handlePhotoClick}
          showSolution={showSolution}
          andrews={currentAndreas}
          players={displayPlayers}
          currentPlayerId={currentPlayerId}
        />
      </div>

      <Leaderboard finders={findersOrder} players={displayPlayers} />

      {showWinPopup && (
        <div className="solution-panel">
          <h3>🎉 Vittoria!</h3>
          <p><strong>{showWinPopup.playerName}</strong> ha trovato entrambi gli Andrea!</p>
          <p>Tempo: <strong>{showWinPopup.time}s</strong></p>
          <button 
            onClick={handleContinue}
            className="continue-button"
            style={{ cursor: 'pointer' }}
          >
            Continua al prossimo livello
          </button>
        </div>
      )}

      {showSolution && !showWinPopup && (
        <div className="solution-panel">
          <h3>Soluzione!</h3>
          <p>I due Andrea erano qui:</p>
          <button 
            onClick={() => {
              console.log('Continue button clicked')
              handleContinue()
            }} 
            className="continue-button"
            style={{ cursor: 'pointer' }}
          >
            Continua al prossimo livello
          </button>
        </div>
      )}
    </div>
  )
}
