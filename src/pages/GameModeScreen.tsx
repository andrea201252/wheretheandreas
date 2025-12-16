import './GameModeScreen.css'

interface GameModeScreenProps {
  onSelectMode: (mode: 'local' | 'create' | 'join') => void
  onBack?: () => void
}

export default function GameModeScreen({ onSelectMode, onBack }: GameModeScreenProps) {
  return (
    <div className="game-mode-screen">
      {onBack && (
        <button onClick={onBack} className="back-button-top">
           Back
        </button>
      )}
      
      <div className="mode-container">
        <h1> How do you want to play?</h1>
        
        <div className="modes">
          <div className="mode-card" onClick={() => onSelectMode('local')}>
            <div className="mode-icon"></div>
            <h2>Local Play</h2>
            <p>Play with friends on the same device</p>
            <button className="mode-btn local-btn">Play Locally</button>
          </div>
          
          <div className="mode-card" onClick={() => onSelectMode('create')}>
            <div className="mode-icon"></div>
            <h2>Create Online Game</h2>
            <p>Host a game and share the ID with friends</p>
            <button className="mode-btn online-btn">Create Game</button>
          </div>
          
          <div className="mode-card" onClick={() => onSelectMode('join')}>
            <div className="mode-icon"></div>
            <h2>Join Online Game</h2>
            <p>Join a friend's game with a Game ID</p>
            <button className="mode-btn online-btn">Join Game</button>
          </div>
        </div>
      </div>
    </div>
  )
}
