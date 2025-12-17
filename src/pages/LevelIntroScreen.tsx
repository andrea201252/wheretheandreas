import './LevelIntroScreen.css'

interface LevelIntroScreenProps {
  level: number
  onStart: () => void
  onBack: () => void
  canStart?: boolean
  hintText?: string
}

export default function LevelIntroScreen({ level, onStart, onBack, canStart = true, hintText }: LevelIntroScreenProps) {
  const getIntroImage = () => {
    return `/images/intro.jpeg`
  }

  return (
    <div className="level-intro-screen" style={{backgroundImage: `url('${getIntroImage()}')` }}>
      <button onClick={onBack} className="level-back-button">
         Back
      </button>
      
      <div className="level-intro-overlay">
        <div className="level-intro-content">
          <h1>Level {level}: Florence Office</h1>
          
          <div className="location-description">
            <p>The two Andreas are hidden in the Florence office. Can you find them before anyone else?</p>
          </div>
          
          <div className="game-rules">
            <h3>Game Rules</h3>
            <ul>
              <li>Find both Andrea icons in the image</li>
              <li>You have <strong>10 clicks</strong> maximum</li>
              <li>The fastest player wins the level</li>
              <li>Top 3 players advance to the next level</li>
              <li>Click precisely on each Andrea to find them</li>
            </ul>
          </div>
          
          {hintText && <p className="level-intro-hint">{hintText}</p>}

          <button
            onClick={onStart}
            className="level-start-button"
            disabled={!canStart}
            style={!canStart ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
          >
            Start Level {level}
          </button>
        </div>
      </div>
    </div>
  )
}
