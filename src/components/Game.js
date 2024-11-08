
import React, { useState } from 'react';

// Deck creation and shuffling logic
const createDeck = () => {
    const suits = ['♠', '♥', '♣', '♦']; // Got these symbols online which are just uincode 
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
  
    for (let suit of suits) {
      for (let value of values) {
        deck.push({ suit, value });
      }
    }
    return deck.sort(() => Math.random() - 0.5); // Shuffle the deck
  };
  
  // Function to get card value
  const getCardValue = (card) => {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11; // Adjust Ace later
    return parseInt(card.value);
  };
  
  // Function to calculate hand total
  const calculateHandValue = (hand) => {
    let total = 0;
    let aces = 0;
  
    hand.forEach(card => {
      total += getCardValue(card);
      if (card.value === 'A') aces += 1;
    });
  
    // Adjust for Aces
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
  
    return total;
  };

  const Game = () => {
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [deck, setDeck] = useState([]);
    const [gameStatus, setGameStatus] = useState('');
  
    // Function to start a new game
    const startGame = () => {
      const newDeck = createDeck();
      const playerInitialHand = [newDeck.pop(), newDeck.pop()];
      const dealerInitialHand = [newDeck.pop(), newDeck.pop()];
      setDeck(newDeck);
      setPlayerHand(playerInitialHand);
      setDealerHand(dealerInitialHand);
      setGameStatus('Playing...');
    };
  
    // Player draws a new card
    const hit = () => {
      if (gameStatus !== 'Playing...') return;
  
      const newDeck = [...deck];
      const newCard = newDeck.pop();
      const newPlayerHand = [...playerHand, newCard];
      setPlayerHand(newPlayerHand);
      setDeck(newDeck);
  
      const playerTotal = calculateHandValue(newPlayerHand);
      if (playerTotal > 21) {
        setGameStatus('Player busts! Dealer wins.');
      }
    };
  
    // Dealer's turn to draw cards
    const dealerTurn = () => {
      let newDeck = [...deck];
      let newDealerHand = [...dealerHand];
  
      while (calculateHandValue(newDealerHand) < 17) {
        const newCard = newDeck.pop();
        newDealerHand.push(newCard);
      }
  
      setDealerHand(newDealerHand);
      setDeck(newDeck);
  
      const playerTotal = calculateHandValue(playerHand);
      const dealerTotal = calculateHandValue(newDealerHand);
  
      if (dealerTotal > 21 || playerTotal > dealerTotal) {
        setGameStatus('Player wins!');
      } else if (dealerTotal > playerTotal) {
        setGameStatus('Dealer wins.');
      } else {
        setGameStatus('It\'s a draw.');
      }
    };
  
    // Player stands and dealer takes turn
    const stand = () => {
      if (gameStatus === 'Playing...') {
        dealerTurn();
      }
    };
  
    return (
      <div>
        <button onClick={startGame}>Start New Game</button>
        <button onClick={hit} disabled={gameStatus !== 'Playing...'}>Hit</button>
        <button onClick={stand} disabled={gameStatus !== 'Playing...'}>Stand</button>
  
        <div>
          <h3>Player's Hand ({calculateHandValue(playerHand)})</h3>
          <p>{playerHand.map(card => `${card.value}${card.suit}`).join(', ') || 'No cards yet'}</p>
        </div>
  
        <div>
          <h3>Dealer's Hand ({calculateHandValue(dealerHand)})</h3>
          <p>{dealerHand.map(card => `${card.value}${card.suit}`).join(', ') || 'No cards yet'}</p>
        </div>
  
        <p>{gameStatus}</p>
      </div>
    );
  };
  
  export default Game;