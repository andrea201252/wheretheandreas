import React, { useEffect, useState } from 'react'
import './CoverScreen.css'

interface CoverScreenProps {
  onComplete: () => void
}

export default function CoverScreen({ onComplete }: CoverScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500) // Attendi l'animazione di fade out
    }, 3000) // Mostra per 3 secondi

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className={`cover-screen ${!isVisible ? 'fade-out' : ''}`}>
      <img src="/images/Copertina.png" alt="Cover" className="cover-image" />
      <button onClick={() => onComplete()} className="skip-button">
        Skip ⏭️
      </button>
    </div>
  )
}
