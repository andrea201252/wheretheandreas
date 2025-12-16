import { useEffect, useState } from 'react'
import './CoverScreen.css'

interface CoverScreenProps {
  onComplete: (skipCover: boolean) => void
}

export default function CoverScreen({ onComplete }: CoverScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onComplete(false), 500) // Auto-complete after 5 seconds
    }, 5000) // Mostra per 5 secondi

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className={`cover-screen ${!isVisible ? 'fade-out' : ''}`}>
      <img src="/images/Copertina.png" alt="Cover" className="cover-image" />
      <button onClick={() => onComplete(true)} className="start-button">
        Start Game 🎮
      </button>
      <button onClick={() => onComplete(true)} className="skip-button">
        Skip ⏭️
      </button>
    </div>
  )
}
