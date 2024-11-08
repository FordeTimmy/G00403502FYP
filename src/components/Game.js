
import React, { useState } from 'react';

const Game = () => {
  // State for player and dealer hands
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameStatus, setGameStatus] = useState('');

  // Function to start a new game
  const startGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameStatus('Playing...');
   //add logic here 
  };

  return (
    <div>
    
      <button onClick={startGame}>Start New Game</button>

      <div>
        <h3>Player's Hand</h3>
        <p>{playerHand.join(', ') || 'No cards yet'}</p>
      </div>

      <div>
        <h3>Dealer's Hand</h3>
        <p>{dealerHand.join(', ') || 'No cards yet'}</p>
      </div>

      <p>{gameStatus}</p>
    </div>
  );
};

export default Game;
