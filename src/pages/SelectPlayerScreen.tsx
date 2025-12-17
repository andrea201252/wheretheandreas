import { Player } from '../App'
import './SelectPlayerScreen.css'

interface SelectPlayerScreenProps {
  availablePlayers: Player[]
  onSelectPlayer: (player: Player) => void
  onBackToMode: () => void
}

export default function SelectPlayerScreen({
  availablePlayers,
  onSelectPlayer,
  onBackToMode
}: SelectPlayerScreenProps) {
  return (
    <div className="select-player-screen">
      <button onClick={onBackToMode} className="back-button-select">
        Back
      </button>

      <div className="select-container">
        <h1>Select Your Player</h1>
        <p className="subtitle">A player can only be selected by one person.</p>

        <div className="players-grid">
          {availablePlayers.map((player) => (
            <div
              key={player.id}
              className="player-card-select"
              role="button"
              tabIndex={0}
              onClick={() => onSelectPlayer(player)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectPlayer(player)
              }}
            >
              <h2>{player.name}</h2>
              <p>Score: {player.score}</p>
              <button
                className="select-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectPlayer(player)
                }}
              >
                Join as {player.name}
              </button>
            </div>
          ))}
        </div>

        {availablePlayers.length === 0 && (
          <div className="no-players">
            <p>No players available. All slots are already taken.</p>
          </div>
        )}
      </div>
    </div>
  )
}
