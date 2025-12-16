import { useState } from 'react'
import './JoinGameScreen.css'

interface JoinGameScreenProps {
  onJoinGame: (gameId: string) => void
  onBackToMode: () => void
}

export default function JoinGameScreen({ onJoinGame, onBackToMode }: JoinGameScreenProps) {
  const [gameId, setGameId] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    if (!gameId.trim()) {
      setError('Please enter a Game ID')
      return
    }
    if (gameId.length !== 9) {
      setError('Game ID must be 9 characters')
      return
    }
    onJoinGame(gameId.toUpperCase())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin()
    }
  }

  return (
    <div className="join-game-screen">
      <div className="join-container">
        <h1>🎮 Join Online Game</h1>
        
        <div className="join-form">
          <label htmlFor="gameId">Enter Game ID:</label>
          <input
            id="gameId"
            type="text"
            value={gameId}
            onChange={(e) => {
              setGameId(e.target.value.toUpperCase())
              setError('')
            }}
            onKeyPress={handleKeyPress}
            placeholder="e.g., ABC123XYZ"
            maxLength={9}
            className="game-id-input"
          />
          
          {error && <p className="error-message">{error}</p>}
          
          <div className="button-group">
            <button onClick={handleJoin} className="join-button">
              Join Game ✓
            </button>
            <button onClick={onBackToMode} className="back-button">
              Back ← 
            </button>
          </div>
        </div>

        <div className="instructions">
          <h3>How to Join:</h3>
          <ol>
            <li>Get the 9-character Game ID from the host</li>
            <li>Enter it above</li>
            <li>Click "Join Game"</li>
            <li>Wait for the host to start</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
