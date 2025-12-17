import { useState, useEffect, useMemo } from 'react'
import CoverScreen from './pages/CoverScreen'
import GameModeScreen from './pages/GameModeScreen'
import PlayerSetup from './pages/PlayerSetup'
import GameScreen from './pages/GameScreen'
import LevelIntroScreen from './pages/LevelIntroScreen'
import JoinGameScreen from './pages/JoinGameScreen'
import SelectPlayerScreen from './pages/SelectPlayerScreen'
import GameEndScreen from './pages/GameEndScreen'
import RemoteCursors from './components/RemoteCursors'
import {
  finalizeLevel,
  getGameRoom,
  isLevelProcessed,
  onGameUpdates,
  onLevelResultsUpdate,
  claimPlayerSlot,
  releasePlayerSlot,
  getClientId,
  updateGamePhase,
  updateGameStatus
} from './services/gameService'
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

  const clientId = useMemo(() => getClientId(), [])
  const [levelWinners, setLevelWinners] = useState<WinnerData[]>([]) // Traccia i vincitori di ogni livello
  const [levelWinnersCount, setLevelWinnersCount] = useState<Record<number, number>>({}) // Conta vincitori per livello

  // Online sync (Realtime DB)
  const [gameRoom, setGameRoom] = useState<any>(null)
  const [onlineLevelPlacements, setOnlineLevelPlacements] = useState<Record<number, any>>({})
  const [submittedLevels, setSubmittedLevels] = useState<Record<number, boolean>>({})

  const isOnline = useMemo(() => !!gameId && (gameMode === 'create' || gameMode === 'join'), [gameId, gameMode])
  const hostId = useMemo(() => (gameRoom?.hostId as string | null) ?? null, [gameRoom])
  const isHost = useMemo(
    () => (
      (!!hostClientId && hostClientId === clientId) ||
      (!!hostId && !!selectedPlayerId && hostId === selectedPlayerId)
    ),
    [hostClientId, clientId, hostId, selectedPlayerId]
  )

  const pointsForRank = (rank: number) => {
    if (rank === 1) return 10
    if (rank === 2) return 8
    if (rank === 3) return 6
    if (rank === 4) return 5
    if (rank === 6) return 3
    return 1
  }

  // =========================
  // ONLINE: subscribe room + drive UI state
  // =========================
  useEffect(() => {
    if (!gameId) {
      setGameRoom(null)
      setOnlineLevelPlacements({})
      return
    }

    const unsub = onGameUpdates(gameId, (data) => {
      setGameRoom(data)

      if (data?.players) {
        const syncedPlayers = Object.values(data.players).map((p: any) => ({
          id: p.id,
          name: p.name,
          cursorColor: p.cursorColor,
          score: p.score || 0
        })) as Player[]
        setPlayers(syncedPlayers)

        // Player slot claims (anti-duplica): mostra solo quelli non presi o presi da questo client
        const claims = (data as any)?.claims || {}
        const filteredAvailable = syncedPlayers.filter((p) => {
          const claimedBy = claims?.[p.id]
          return !claimedBy || claimedBy === clientId
        })
        setAvailablePlayers(filteredAvailable)
      }

      if (typeof data?.level === 'number') {
        setCurrentLevel(data.level)
      }

      if (data?.levelPlacements) {
        // keys arrivano come stringhe: normalizza a number
        const normalized: Record<number, any> = {}
        Object.entries(data.levelPlacements).forEach(([k, v]) => {
          const nk = Number(k)
          normalized[Number.isFinite(nk) ? nk : 0] = v
        })
        setOnlineLevelPlacements(normalized)
      }

      // Non forzare lo stato se non hai ancora scelto il player
      if (!selectedPlayerId) return

      // Evita override mentre sei nelle schermate di ingresso
      if (appState === 'cover' || appState === 'gameMode' || appState === 'joinGame' || appState === 'selectPlayer' || appState === 'playerSetup') {
        return
      }

      const phase = data?.phase
      const status = data?.status

      // Se ho già inviato il risultato per questo livello, resto in attesa (non torno in playing)
      const submittedThisLevel = !!submittedLevels[data?.level ?? currentLevel]

      if (status === 'completed' || phase === 'gameEnd') {
        setAppState('gameEnd')
      } else if (phase === 'levelIntro') {
        setAppState('levelIntro')
      } else if (phase === 'playing' && !submittedThisLevel) {
        setAppState('playing')
      }
    })

    return () => unsub()
  }, [gameId, selectedPlayerId, appState, submittedLevels, currentLevel])

  // =========================
  // ONLINE: host finalizza livello quando tutti hanno inviato un risultato
  // =========================
  useEffect(() => {
    if (!isOnline || !gameId || !isHost) return
    if (!players || players.length === 0) return

    const level = currentLevel
    const unsub = onLevelResultsUpdate(gameId, level, async (results) => {
      try {
        const resultObj = results || {}
        if (Object.keys(resultObj).length < players.length) return

        // idempotenza
        const already = await isLevelProcessed(gameId, level)
        if (already) return

        // ranking: found prima, poi time min, poi submittedAt
        const rows = players.map(p => {
          const r = resultObj[p.id] || { time: 30, found: false, submittedAt: 9e15 }
          return {
            playerId: p.id,
            playerName: p.name,
            found: !!r.found,
            time: typeof r.time === 'number' ? r.time : 30,
            submittedAt: typeof r.submittedAt === 'number' ? r.submittedAt : 9e15,
            currentScore: p.score || 0
          }
        })

        rows.sort((a, b) => {
          if (a.found !== b.found) return a.found ? -1 : 1
          if (a.time !== b.time) return a.time - b.time
          return a.submittedAt - b.submittedAt
        })

        const placements = rows.map((r, idx) => {
          const rank = idx + 1
          const points = pointsForRank(rank)
          return {
            playerId: r.playerId,
            playerName: r.playerName,
            rank,
            time: r.time,
            found: r.found,
            points
          }
        })

        const scoreUpdates: Record<string, number> = {}
        placements.forEach(pl => {
          const base = players.find(p => p.id === pl.playerId)?.score || 0
          scoreUpdates[pl.playerId] = base + pl.points
        })

        if (level >= 5) {
          await finalizeLevel(
            gameId,
            level,
            placements,
            scoreUpdates,
            { phase: 'gameEnd', status: 'completed' }
          )
        } else {
          await finalizeLevel(
            gameId,
            level,
            placements,
            scoreUpdates,
            { phase: 'levelIntro', status: 'playing', level: level + 1 }
          )
        }
      } catch (e) {
        console.error('Errore finalize level:', e)
      }
    })

    return () => unsub()
  }, [isOnline, gameId, isHost, currentLevel, players])

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

  const handleSelectPlayer = async (selectedPlayer: Player) => {
    // ONLINE: claim atomico del player slot (evita doppia selezione)
    if (gameId && isOnline) {
      const ok = await claimPlayerSlot(gameId, selectedPlayer.id, clientId)
      if (!ok) {
        // slot preso da un altro client: resta in select
        return
      }
      // aggiorna URL per condivisione (host o join)
      try {
        const params = new URLSearchParams(window.location.search)
        params.set('gameId', gameId)
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
      } catch {}
    }

    // L'utente ha selezionato quale giocatore incarnare
    setPlayers([selectedPlayer])
    setSelectedPlayerId(selectedPlayer.id)

    // In online il flusso è pilotato dalla room (phase); fallback: levelIntro
    if (gameId) {
      setAppState('levelIntro')
    } else {
      setAppState('playing')
    }
  }

  const handlePlayersSet = (newPlayers: Player[], gId?: string) => {
    setPlayers(newPlayers)

    // ONLINE (create): non auto-selezionare il primo player.
    if (gId) {
      setGameId(gId)
      setAvailablePlayers(newPlayers)
      setSelectedPlayerId(null)

      // URL shareable
      try {
        const params = new URLSearchParams(window.location.search)
        params.set('gameId', gId)
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
      } catch {}

      setCurrentLevel(1)
      setAppState('selectPlayer')
      return
    }

    // LOCALE: il primo giocatore è quello attuale
    setSelectedPlayerId(newPlayers[0]?.id || null)
    setCurrentLevel(1)
    setAppState('levelIntro')
  }

  const handleLevelComplete = (winnerId?: string, winnerData?: WinnerData) => {
    console.log(`Level complete - Winner: ${winnerId}, Data:`, winnerData)

    // ONLINE: punteggi e avanzamento gestiti dall'host tramite Realtime DB
    if (isOnline && gameId && selectedPlayerId) {
      setSubmittedLevels(prev => ({ ...prev, [currentLevel]: true }))
      setAppState('levelIntro')
      return
    }
    
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


  const resetToMode = async () => {
    if (gameId && isOnline && selectedPlayerId) {
      try { await releasePlayerSlot(gameId, selectedPlayerId, clientId) } catch {}
    }
    setAppState('gameMode')
    setGameId(null)
    setGameMode(null)
    setAvailablePlayers([])
    setSelectedPlayerId(null)
  }

  return (
    <div className="app">
      {isOnline && gameId && selectedPlayerId && players.length > 0 && (
        <RemoteCursors gameId={gameId} players={players} currentPlayerId={selectedPlayerId} />
      )}
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
          onBackToMode={() => { void resetToMode() }}
        />
      )}
      {appState === 'selectPlayer' && (
        <SelectPlayerScreen
          availablePlayers={availablePlayers}
          onSelectPlayer={handleSelectPlayer}
          onBackToMode={() => { void resetToMode() }}
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
          canStart={!isOnline || isHost}
          hintText={isOnline && !isHost ? 'Waiting for the host to start…' : undefined}
          onStart={() => {
            if (isOnline && gameId) {
              if (!isHost) return
              updateGamePhase(gameId, 'playing').catch(() => {})
              updateGameStatus(gameId, 'playing').catch(() => {})
              setSubmittedLevels(prev => {
                const copy = { ...prev }
                delete copy[currentLevel]
                return copy
              })
            }
            setAppState('playing')
          }}
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
          levelWinners={isOnline ? [] : levelWinners}
          levelPlacements={isOnline ? onlineLevelPlacements : undefined}
          onPlayAgain={handleBackToIntro}
        />
      )}
    </div>
  )
}

export default App
