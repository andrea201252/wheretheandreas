import { Player } from '../App'
import './SelectPlayerScreen.css'

interface SelectPlayerScreenProps {
  availablePlayers: Player[]
  onSelectPlayer: (player: Player) => void
  onBackToMode: () => void
}

export default function SelectPlayerScreen({ availablePlayers, onSelectPlayer, onBackToMode }: SelectPlayerScreenProps) {
  return (
    <div className="select-player-screen">
      <button onClick={onBackToMode} className="back-button-select">
         Back
      </button>
      
      <div className="select-player-container">
        <h1> Join the Game!</h1>
        <p>Select which player you are:</p>
        
        <div className="players-grid">
          {availablePlayers.map(player => (
            <div 
              key={player.id}
              className="player-card-select"
              onClick={() => onSelectPlayer(player)}
            >
              <div className="player-color-circle" style={{ backgroundColor: player.cursorColor }}></div>
              <h3>{player.name}</h3>
              <p>Score: {player.score}</p>
              <button className="select-btn">Join as {player.name}</button>
            </div>
          ))}
        </div>
        
        {availablePlayers.length === 0 && (
          <div className="no-players">
            <p>No players available in this game.</p>
          </div>
        )}
      </div>
    </div>
  )
}
