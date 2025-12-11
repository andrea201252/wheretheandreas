import './GameModeScreen.css'

interface GameModeScreenProps {
  onSelectMode: (mode: 'local' | 'online') => void
  onBack: () => void
}

export default function GameModeScreen({ onSelectMode, onBack }: GameModeScreenProps) {
  return (
    <div className="game-mode-screen">
      <button className="back-button-top" onClick={onBack}>← Back</button>
      
      <div className="mode-container">
        <h1>Select Game Mode</h1>
        
        <div className="modes">
          <div className="mode-card">
            <div className="mode-icon">👥</div>
            <h2>Local Play</h2>
            <p>Play with friends on the same device</p>
            <button onClick={() => onSelectMode('local')} className="mode-btn local-btn">
              Play Locally
            </button>
          </div>

          <div className="mode-card">
            <div className="mode-icon">🌐</div>
            <h2>Online Play</h2>
            <p>Play with friends anywhere in the world</p>
            <button onClick={() => onSelectMode('online')} className="mode-btn online-btn">
              Play Online
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
