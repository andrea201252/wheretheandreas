import { useState, useEffect } from 'react'
import CoverScreen from './pages/CoverScreen'
import GameModeScreen from './pages/GameModeScreen'
import PlayerSetup from './pages/PlayerSetup'
import GameScreen from './pages/GameScreen'
import JoinGameScreen from './pages/JoinGameScreen'
import SelectPlayerScreen from './pages/SelectPlayerScreen'
import { getGameRoom } from './services/gameService'
import './App.css'

export interface Player {
  id: string
  name: string
  cursorColor: string
  score: number
}

type AppState = 'cover' | 'gameMode' | 'playerSetup' | 'joinGame' | 'selectPlayer' | 'playing' | 'levelComplete' | 'gameEnd'

function App() {
  const [appState, setAppState] = useState<AppState>('cover')
  const [currentLevel, setCurrentLevel] = useState(1)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameId, setGameId] = useState<string | null>(null)
  const [gameMode, setGameMode] = useState<'local' | 'create' | 'join' | null>(null)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]) // Giocatori disponibili quando aderisci

  // Verifica se c'è un gameId nell'URL al caricamento
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
    setAppState('playing')
  }

  const handlePlayersSet = (newPlayers: Player[], gId?: string) => {
    setPlayers(newPlayers)
    if (gId) {
      setGameId(gId)
    }
    setCurrentLevel(1)
    setAppState('playing')
  }

  const handleLevelComplete = (winnerId?: string) => {
    if (winnerId) {
      setPlayers(players.map(p =>
        p.id === winnerId ? { ...p, score: p.score + 10 } : p
      ))
    }
    // Auto-advance al prossimo livello dopo 2 secondi
    setTimeout(() => {
      if (currentLevel >= 5) {
        setAppState('gameEnd')
      } else {
        setCurrentLevel(prev => prev + 1)
        setAppState('playing')
      }
    }, 2000)
    setAppState('levelComplete')
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
      {appState === 'playing' && (
        <GameScreen
          level={currentLevel}
          players={players}
          gameId={gameId}
          onComplete={handleLevelComplete}
          onBackToIntro={handleBackToIntro}
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
        <div className="game-end">
          <h1>Game Over!</h1>
          <div className="final-scores">
            <h2>Final Scores:</h2>
            {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
              <div key={p.id} className="final-score-item">
                <span className="rank">#{idx + 1}</span>
                <span style={{ color: p.cursorColor }}>{p.name}</span>: {p.score} points
              </div>
            ))}
          </div>
          <button onClick={handleBackToIntro}>Play Again</button>
        </div>
      )}
    </div>
  )
}

export default App
