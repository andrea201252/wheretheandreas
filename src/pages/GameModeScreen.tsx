import './GameModeScreen.css'

interface GameModeScreenProps {
  onSelectMode: (mode: 'local' | 'create' | 'join') => void
  onBack?: () => void
}

export default function GameModeScreen({ onSelectMode, onBack }: GameModeScreenProps) {
  return (
    <div className="game-mode-container">
      {onBack && (
        <button onClick={onBack} className="back-button-mode">
           Back
        </button>
      )}
      <h2>Select Game Mode</h2>
      <div className="mode-cards">
        <div className="mode-card" onClick={() => onSelectMode('local')}>
          <div className="mode-icon"></div>
          <h3>Local Play</h3>
          <p>Play with friends on the same device</p>
        </div>
        <div className="mode-card" onClick={() => onSelectMode('create')}>
          <div className="mode-icon"></div>
          <h3>Create Online Game</h3>
          <p>Host a game and share the ID</p>
        </div>
        <div className="mode-card" onClick={() => onSelectMode('join')}>
          <div className="mode-icon"></div>
          <h3>Join Online Game</h3>
          <p>Join a friend's game with Game ID</p>
        </div>
      </div>
    </div>
  )
}
