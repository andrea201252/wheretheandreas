import { useState } from 'react'
import { Player } from '../App'
import { createGameRoom, generateGameId, joinGameRoom } from '../services/gameService'
import './PlayerSetup.css'

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
]

interface PlayerSetupProps {
  onPlayersSet: (players: Player[], gameId?: string) => void
  isOnline?: boolean
  gameId?: string | null
}

export default function PlayerSetup({ onPlayersSet, isOnline = false, gameId: initialGameId = null }: PlayerSetupProps) {
  const [view, setView] = useState<'setup' | 'sharing'>('setup')
  const [playerCount, setPlayerCount] = useState(2)
  const [players, setPlayers] = useState<Partial<Player>[]>(
    Array(2).fill(null).map((_, i) => ({
      id: `player-${i}`,
      name: `Player ${i + 1}`,
      cursorColor: CURSOR_COLORS[i],
      score: 0
    }))
  )
  const [gameId, setGameId] = useState<string>(initialGameId || '')

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count)
    const newPlayers = Array(count).fill(null).map((_, i) => ({
      id: `player-${i}`,
      name: players[i]?.name || `Player ${i + 1}`,
      cursorColor: players[i]?.cursorColor || CURSOR_COLORS[i % CURSOR_COLORS.length],
      score: 0
    }))
    setPlayers(newPlayers)
  }

  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], name }
    setPlayers(newPlayers)
  }

  const handleColorChange = (index: number, color: string) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], cursorColor: color }
    setPlayers(newPlayers)
  }

  const handleStartGame = async () => {
    const validPlayers = players.map((p, i) => ({
      id: p.id || `player-${i}`,
      name: p.name || `Player ${i + 1}`,
      cursorColor: p.cursorColor || CURSOR_COLORS[i % CURSOR_COLORS.length],
      score: 0
    }))

    if (isOnline) {
      if (initialGameId) {
        // Unirsi a una partita esistente - aggiungi i giocatori
        for (const player of validPlayers) {
          await joinGameRoom(initialGameId, player)
        }
        onPlayersSet(validPlayers, initialGameId)
      } else {
        // Creare una nuova partita online
        const newGameId = generateGameId()
        setGameId(newGameId)
        await createGameRoom(newGameId, validPlayers)
        setView('sharing')
      }
    } else {
      // Gioco locale
      onPlayersSet(validPlayers)
    }
  }

  const handleCopyLink = () => {
    const gameLink = `${window.location.origin}?gameId=${gameId}`
    navigator.clipboard.writeText(gameLink)
    alert('Link copiato! Condividilo con gli altri giocatori.')
  }

  const handleStartOnlineGame = () => {
    const validPlayers = players.map((p, i) => ({
      id: p.id || `player-${i}`,
      name: p.name || `Player ${i + 1}`,
      cursorColor: p.cursorColor || CURSOR_COLORS[i % CURSOR_COLORS.length],
      score: 0
    }))
    onPlayersSet(validPlayers, gameId)
  }

  if (view === 'sharing' && isOnline) {
    return (
      <div className="player-setup">
        <div className="setup-container sharing-view">
          <h1>Game Created! 🎮</h1>
          <p className="game-id-label">Game ID:</p>
          <div className="game-id-display">
            <code>{gameId}</code>
            <button onClick={handleCopyLink} className="copy-btn">
              Copy Link
            </button>
          </div>
          <p className="sharing-info">Share this ID with your friends to join the game!</p>
          <button className="start-btn" onClick={handleStartOnlineGame}>
            Start Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="player-setup">
      <div className="setup-container">
        <h1>Player Setup</h1>
        
        <div className="player-count-section">
          <label>Number of Players:</label>
          <div className="player-count-buttons">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(count => (
              <button
                key={count}
                className={`count-btn ${playerCount === count ? 'active' : ''}`}
                onClick={() => handlePlayerCountChange(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="players-list">
          {players.map((player, index) => (
            <div key={index} className="player-card">
              <div className="form-group">
                <label>Player {index + 1} Name:</label>
                <input
                  type="text"
                  value={player.name || ''}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                />
              </div>

              <div className="form-group">
                <label>Cursor Color:</label>
                <div className="color-picker">
                  {CURSOR_COLORS.map(color => (
                    <button
                      key={color}
                      className={`color-btn ${player.cursorColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(index, color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="start-btn" onClick={handleStartGame}>
          Start Game
        </button>
      </div>
    </div>
  )
}
