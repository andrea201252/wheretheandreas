import { useState } from 'react'
import './CoverScreen.css'

interface CoverScreenProps {
  onComplete: (skipCover: boolean) => void
  onBack?: () => void
}

export default function CoverScreen({ onComplete, onBack }: CoverScreenProps) {
  return (
    <div className="cover-screen">
      {onBack && (
        <button onClick={onBack} className="back-button">
          Back
        </button>
      )}
      <img src="/images/Copertina.png" alt="Cover" className="cover-image" />
      <button onClick={() => onComplete(true)} className="start-button">
        Start Game
      </button>
      <button onClick={() => onComplete(true)} className="skip-button">
        Skip
      </button>
    </div>
  )
}
