import React from 'react';
import './GameModeScreen.css';

interface GameModeScreenProps {
  onSelectMode: (mode: 'local' | 'online') => void;
}

export const GameModeScreen: React.FC<GameModeScreenProps> = ({ onSelectMode }) => {
  return (
    <div className="game-mode-container">
      <h2>Select Game Mode</h2>
      <div className="mode-cards">
        <div className="mode-card" onClick={() => onSelectMode('local')}>
          <div className="mode-icon">👥</div>
          <h3>Local Play</h3>
          <p>Play with friends on the same device</p>
        </div>
        <div className="mode-card" onClick={() => onSelectMode('online')}>
          <div className="mode-icon">🌐</div>
          <h3>Online Play</h3>
          <p>Play with friends online</p>
        </div>
      </div>
    </div>
  );
};
