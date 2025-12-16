import { Player, WinnerData } from '../App'
import './GameEndScreen.css'

interface GameEndScreenProps {
  players: Player[]
  levelWinners: WinnerData[]
  onPlayAgain: () => void
}

export default function GameEndScreen({ players, levelWinners, onPlayAgain }: GameEndScreenProps) {
  // Conta le vittorie per giocatore
  const winCounts = levelWinners.reduce((acc, winner) => {
    acc[winner.playerId] = (acc[winner.playerId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Ordina i giocatori per numero di vittorie (primo, secondo, terzo)
  const rankedPlayers = [...players].sort((a, b) => {
    const aWins = winCounts[a.id] || 0
    const bWins = winCounts[b.id] || 0
    return bWins - aWins
  })

  // Medaglie
  const getMedal = (rank: number) => {
    switch (rank) {
      case 0:
        return '🥇'
      case 1:
        return '🥈'
      case 2:
        return '🥉'
      default:
        return '🎖️'
    }
  }

  return (
    <div className="game-end-screen">
      <div className="game-end-container">
        <h1 className="game-end-title">🎉 Game Over! 🎉</h1>
        
        <div className="winner-podium">
          {rankedPlayers.slice(0, 3).map((player, idx) => (
            <div key={player.id} className={`podium-position position-${idx}`}>
              <div className="medal">{getMedal(idx)}</div>
              <div className="winner-card" style={{ borderColor: player.cursorColor }}>
                <h3 className="winner-rank">#{idx + 1}</h3>
                <p className="winner-name" style={{ color: player.cursorColor }}>
                  {player.name}
                </p>
                <p className="winner-wins">
                  {winCounts[player.id] || 0} level{winCounts[player.id] !== 1 ? 's' : ''} won
                </p>
                <p className="winner-score">{player.score} points</p>
              </div>
            </div>
          ))}
        </div>

        {rankedPlayers.length > 3 && (
          <div className="other-players">
            <h3>Other Players</h3>
            {rankedPlayers.slice(3).map((player, idx) => (
              <div key={player.id} className="other-player-item">
                <span className="rank">#{idx + 4}</span>
                <span className="name" style={{ color: player.cursorColor }}>
                  {player.name}
                </span>
                <span className="stats">
                  {winCounts[player.id] || 0} wins • {player.score} points
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="level-winners-detail">
          <h3>Level Winners by Speed</h3>
          <div className="winners-table">
            {[1, 2, 3, 4, 5].map(level => {
              const levelWinner = levelWinners.find(w => w.level === level)
              return (
                <div key={level} className="winner-row">
                  <span className="level-label">Level {level}:</span>
                  {levelWinner ? (
                    <>
                      <span className="winner-label">{levelWinner.playerName}</span>
                      <span className="winner-time">({levelWinner.time}s)</span>
                    </>
                  ) : (
                    <span className="no-winner">No winner</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <button onClick={onPlayAgain} className="play-again-button">
          Play Again
        </button>
      </div>
    </div>
  )
}
