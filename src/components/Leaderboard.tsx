import React from 'react'
import { Player } from '../App'
import './Leaderboard.css'

interface LeaderboardProps {
  finders: string[]
  players: Player[]
}

export default function Leaderboard({ finders, players }: LeaderboardProps) {
  // Crea la graduatoria top 3
  const leaderboard = finders.slice(0, 3).map((playerId, index) => {
    const player = players.find(p => p.id === playerId)
    return { position: index + 1, player }
  })

  if (leaderboard.length === 0) {
    return null
  }

  return (
    <div className="leaderboard">
      <h3>🏆 Finders</h3>
      <div className="leaderboard-items">
        {leaderboard.map(({ position, player }) => (
          <div key={position} className={`leaderboard-item position-${position}`}>
            <span className="position">#{position}</span>
            <span className="name" style={{ color: player?.cursorColor }}>
              {player?.name || 'Unknown'}
            </span>
            {position === 1 && <span className="medal">🥇</span>}
            {position === 2 && <span className="medal">🥈</span>}
            {position === 3 && <span className="medal">🥉</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
