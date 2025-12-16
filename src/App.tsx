import { useState, useEffect } from 'react'
import CoverScreen from './pages/CoverScreen'
import GameModeScreen from './pages/GameModeScreen'
import PlayerSetup from './pages/PlayerSetup'
import GameScreen from './pages/GameScreen'
import LevelIntroScreen from './pages/LevelIntroScreen'
import JoinGameScreen from './pages/JoinGameScreen'
import SelectPlayerScreen from './pages/SelectPlayerScreen'
import GameEndScreen from './pages/GameEndScreen'
import { getGameRoom } from './services/gameService'
import './App.css'

export interface Player {
  id: string
  name: string
  cursorColor: string
  score: number
}

export interface WinnerData {
  playerId: string
  playerName: string
  time: number
  level: number
}

type AppState = 'cover' | 'gameMode' | 'playerSetup' | 'joinGame' | 'selectPlayer' | 'levelIntro' | 'playing' | 'levelComplete' | 'gameEnd'

function App() {
  const [appState, setAppState] = useState<AppState>('cover')
  const [currentLevel, setCurrentLevel] = useState(1)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameId, setGameId] = useState<string | null>(null)
  const [gameMode, setGameMode] = useState<'local' | 'create' | 'join' | null>(null)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]) // Giocatori disponibili quando aderisci
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null) // Giocatore corrente
  const [levelWinners, setLevelWinners] = useState<WinnerData[]>([]) // Traccia i vincitori di ogni livello
  const [levelWinnersCount, setLevelWinnersCount] = useState<Record<number, number>>({}) // Conta vincitori per livello

  // Verifica se c'� un gameId nell'URL al caricamento
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlGameId = params.get('gameId')
    
    if (urlGameId) {
      setGameId(urlGameId)
      setGameMode('join')
      // Carica i giocatori disponibili dalla partita
      getGameRoom(urlGameId)
        .then(gameRoom => {
          if (gameRoom && gameRoom.players) {
            const players = Object.values(gameRoom.players).map((p: any) => ({
              id: p.id,
              name: p.name,
              cursorColor: p.cursorColor,
              score: p.score || 0
            })) as Player[]
            setAvailablePlayers(players)
            setAppState('selectPlayer')
          }
        })
        .catch(err => console.error('Errore caricamento gioco:', err))
    } else {
      setAppState('cover')
    }
  }, [])

  const handleCoverComplete = () => {
    setAppState('gameMode')
  }

  const handleGameModeSelect = (mode: 'local' | 'create' | 'join') => {
    setGameMode(mode)
    if (mode === 'local') {
      setAppState('playerSetup')
    } else if (mode === 'create') {
      setAppState('playerSetup')
    } else if (mode === 'join') {
      setAppState('joinGame')
    }
  }

  const handleJoinGame = (gId: string) => {
    setGameId(gId)
    setGameMode('join')
    // Carica i giocatori disponibili
    getGameRoom(gId)
      .then(gameRoom => {
        if (gameRoom && gameRoom.players) {
          const players = Object.values(gameRoom.players).map((p: any) => ({
            id: p.id,
            name: p.name,
            cursorColor: p.cursorColor,
            score: p.score || 0
          })) as Player[]
          setAvailablePlayers(players)
          setAppState('selectPlayer')
        }
      })
      .catch(err => {
        console.error('Errore caricamento gioco:', err)
        setAppState('joinGame') // Ritorna indietro se errore
      })
  }

  const handleSelectPlayer = (selectedPlayer: Player) => {
    // L'utente ha selezionato quale giocatore incarnare
    setPlayers([selectedPlayer])
    setSelectedPlayerId(selectedPlayer.id)
    setAppState('playing')
  }

  const handlePlayersSet = (newPlayers: Player[], gId?: string) => {
    setPlayers(newPlayers)
    // In modalità locale, il primo giocatore è quello attuale
    setSelectedPlayerId(newPlayers[0]?.id || null)
    if (gId) {
      setGameId(gId)
    }
    setCurrentLevel(1)
    setAppState('levelIntro')
  }

  const handleLevelComplete = (winnerId?: string, winnerData?: WinnerData) => {
    console.log(`Level complete - Winner: ${winnerId}, Data:`, winnerData)
    if (winnerId) {
      const updatedPlayers = players.map(p => {
        if (p.id === winnerId) {
          console.log(`Updating ${p.name} score from ${p.score} to ${p.score + 10}`)
          return { ...p, score: p.score + 10 }
        }
        return p
      })
      setPlayers(updatedPlayers)
    }
    // Traccia il vincitore del livello
    if (winnerData) {
      const newWinners = [...levelWinners, winnerData]
      setLevelWinners(newWinners)
      
      // Conta i vincitori per questo livello
      const winnersThisLevel = newWinners.filter(w => w.level === currentLevel).length
      const newWinnersCount = { ...levelWinnersCount, [currentLevel]: winnersThisLevel }
      setLevelWinnersCount(newWinnersCount)
      
      // Se ci sono 2 giocatori, aspetta 2 vincitori. Se ce ne sono 3+, aspetta 3 vincitori
      const winnersNeeded = Math.min(3, players.length)
      console.log(`Level ${currentLevel} winners: ${winnersThisLevel}/${winnersNeeded}`)
      
      // Se sono stati raggiunti i vincitori necessari, auto-advance al livello successivo
      if (winnersThisLevel >= winnersNeeded) {
        setTimeout(() => {
          if (currentLevel >= 5) {
            setAppState('gameEnd')
          } else {
            setCurrentLevel(prev => prev + 1)
            setAppState('levelIntro')
          }
        }, 2000)
        setAppState('levelComplete')
        return
      }
    }
    
    // Se non ci sono ancora abbastanza vincitori, rimani nel gioco
    setAppState('playing')
  }

  const handleNextLevel = () => {
    if (currentLevel >= 5) {
      setAppState('gameEnd')
    } else {
      setCurrentLevel(prev => prev + 1)
      setAppState('playing')
    }
  }

  const handleBackToIntro = () => {
    setAppState('gameMode')
    setCurrentLevel(1)
    setPlayers([])
    setGameId(null)
    setGameMode(null)
    setAvailablePlayers([])
    setSelectedPlayerId(null)
    setLevelWinners([])
    setLevelWinnersCount({})
  }

  return (
    <div className="app">
      {appState === 'cover' && <CoverScreen onComplete={handleCoverComplete} />}
      {appState === 'gameMode' && (
        <GameModeScreen
          onSelectMode={handleGameModeSelect}
          onBack={handleBackToIntro}
        />
      )}
      {appState === 'joinGame' && (
        <JoinGameScreen
          onJoinGame={handleJoinGame}
          onBackToMode={() => setAppState('gameMode')}
        />
      )}
      {appState === 'selectPlayer' && (
        <SelectPlayerScreen
          availablePlayers={availablePlayers}
          onSelectPlayer={handleSelectPlayer}
          onBackToMode={() => {
            setAppState('gameMode')
            setGameId(null)
            setGameMode(null)
            setAvailablePlayers([])
          }}
        />
      )}
      {appState === 'playerSetup' && (
        <PlayerSetup
          onPlayersSet={handlePlayersSet}
          isOnline={gameMode === 'create' || gameMode === 'join'}
          gameId={gameId}
        />
      )}
      {appState === 'levelIntro' && (
        <LevelIntroScreen
          level={currentLevel}
          onStart={() => setAppState('playing')}
          onBack={() => setAppState('gameMode')}
        />
      )}
      {appState === 'playing' && (
        <GameScreen
          level={currentLevel}
          players={players}
          gameId={gameId}
          onComplete={handleLevelComplete}
          onBackToIntro={handleBackToIntro}
          currentPlayerId={selectedPlayerId || undefined}
        />
      )}
      {appState === 'levelComplete' && (
        <div className="level-complete">
          <h1>Level {currentLevel} Completed!</h1>
          <div className="scores">
            {players.map(p => (
              <div key={p.id} className="score-item">
                <span style={{ color: p.cursorColor }}>{p.name}</span>: {p.score} points
              </div>
            ))}
          </div>
          {currentLevel < 5 ? (
            <button onClick={handleNextLevel}>Next Level</button>
          ) : (
            <button onClick={handleNextLevel}>See Final Scores</button>
          )}
          <button onClick={handleBackToIntro}>Back to Home</button>
        </div>
      )}
      {appState === 'gameEnd' && (
        <GameEndScreen
          players={players}
          levelWinners={levelWinners}
          onPlayAgain={handleBackToIntro}
        />
      )}
    </div>
  )
}

export default App
