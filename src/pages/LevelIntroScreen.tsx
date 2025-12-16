import React from 'react'
import './LevelIntroScreen.css'

interface LevelIntroScreenProps {
  level: number
  onStart: () => void
}

export default function LevelIntroScreen({ level, onStart }: LevelIntroScreenProps) {
  const getIntroImage = () => {
    if (level === 1) {
      return '/images/intro.jpeg'
    }
    return `/images/level${level}.jpeg`
  }

  return (
    <div className="level-intro-screen">
      <img src={getIntroImage()} alt="Level intro" className="intro-image" />
      <div className="intro-text">
        <h1>We're in the Florence Office</h1>
        <p>The two Andreas are hide. Find them!!</p>
        <button onClick={onStart} className="start-button">
          Start Level {level}
        </button>
      </div>
    </div>
  )
}
