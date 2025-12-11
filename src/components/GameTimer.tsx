import './GameTimer.css'

interface GameTimerProps {
  timeLeft: number
}

export default function GameTimer({ timeLeft }: GameTimerProps) {
  const isWarning = timeLeft <= 10
  
  return (
    <div className={`game-timer ${isWarning ? 'warning' : ''}`}>
      <div className="timer-icon">⏱️</div>
      <div className="timer-display">{timeLeft}s</div>
    </div>
  )
}
