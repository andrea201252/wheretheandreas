import { Player } from '../App'
import './WinPopup.css'

interface WinPopupProps {
  player: Player
  onClose: () => void
}

export default function WinPopup({ player, onClose }: WinPopupProps) {
  return (
    <div className="win-popup-overlay" onClick={onClose}>
      <div className="win-popup" onClick={(e) => e.stopPropagation()}>
        <div className="confetti-animation"></div>
        <h1 className="win-title">You Win!</h1>
        <div className="winner-info">
          <p className="winner-name" style={{ color: player.cursorColor }}>
            {player.name} found the Andreas!
          </p>
        </div>
        <div className="celebration-emoji">🎉</div>
        <button className="close-btn" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  )
}
