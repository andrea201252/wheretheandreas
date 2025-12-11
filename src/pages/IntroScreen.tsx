import './IntroScreen.css'

interface IntroScreenProps {
  onStart: () => void
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <div className="intro-container">
      {/* Sfondo sfumato con decorazioni festive */}
      <div className="intro-background">
        <div className="decoration decoration-gift decoration-gift-1"></div>
        <div className="decoration decoration-gift decoration-gift-2"></div>
        <div className="decoration decoration-flower decoration-flower-1"></div>
        <div className="decoration decoration-flower decoration-flower-2"></div>
        <div className="decoration decoration-tree decoration-tree-1"></div>
        <div className="decoration decoration-tree decoration-tree-2"></div>
      </div>

      <div className="intro-content">
        <h1 className="rainbow-title">Where are the Andrea's</h1>
        <p className="intro-description">
          Find the two Andreas hidden in the photo!
        </p>
        <button onClick={onStart} className="start-button">
          Start Game
        </button>
      </div>
    </div>
  )
}
