import React, { useState } from 'react';

// Deck creation and shuffling logic
const createDeck = () => {
  const suits = ['♠', '♥', '♣', '♦'];
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
  const [currency, setCurrency] = useState(1000); // Player's currency
  const [bet, setBet] = useState(0); // Initial bet
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [currentHand, setCurrentHand] = useState(1); // Track which hand is active
  const [deck, setDeck] = useState([]);
  const [gameStatus, setGameStatus] = useState('');
  const [isDoubleDown, setIsDoubleDown] = useState(false); // Double Down status
  const [isSplit, setIsSplit] = useState(false); // Split status
  const [playerHand1, setPlayerHand1] = useState([]);
  const [playerHand2, setPlayerHand2] = useState([]);

  // Function to check if the player can split
  const canSplit = () => {
    if (playerHand.length !== 2) {
      return false; // Prevents errors when playerHand doesn't have exactly 2 cards
    }
    
    const canSplitCondition = (
      getCardValue(playerHand[0]) === getCardValue(playerHand[1]) && 
      bet <= currency
    );
    
    console.log("Player Hand:", playerHand);
    console.log("Card Values:", getCardValue(playerHand[0]), getCardValue(playerHand[1]));
    console.log("Bet:", bet);
    console.log("Currency:", currency);
    console.log("Can Split:", canSplitCondition);
    
    return canSplitCondition;
  };
  

  // Function to place a bet and start a new game
  const placeBet = (amount) => {
    if (amount <= currency && amount > 0) {
      setBet(amount);
      setCurrency(currency - amount); // Deduct the bet from the player's currency
    } else {
      alert("Insufficient funds or invalid bet amount.");
    }
  };
  

  // Function to start a new game
  const startGame = (betAmount) => {
    const newDeck = createDeck();
    const playerInitialHand = [newDeck.pop(), newDeck.pop()];
    const dealerInitialHand = [newDeck.pop(), newDeck.pop()];
    setDeck(newDeck);
    setPlayerHand(playerInitialHand);
    setDealerHand(dealerInitialHand);
    setGameStatus('Playing...');
    setIsDoubleDown(false);
    setIsSplit(false);
    setPlayerHand1([]);
    setPlayerHand2([]);
    setBet(betAmount);
  };

  // Player draws a new card
  // Player draws a new card
const hit = () => {
    if (gameStatus !== 'Playing...') return;
  
    const newDeck = [...deck];
    const newCard = newDeck.pop();
  
    if (isSplit) {
      if (currentHand === 1) {
        const newHand1 = [...playerHand1, newCard];
        setPlayerHand1(newHand1);
        if (calculateHandValue(newHand1) > 21) {
          setGameStatus('Hand 1 Bust! Moving to Hand 2...');
          setCurrentHand(2); // Move to Hand 2
        }
      } else {
        const newHand2 = [...playerHand2, newCard];
        setPlayerHand2(newHand2);
        setDeck(newDeck);
        if (calculateHandValue(newHand2) > 21) {
          setGameStatus('Hand 2 Bust! Dealer wins.');
        } else {
          setGameStatus('Playing Hand 2...');
        }
      }
    } else {
      // If not split, handle hit normally
      const newPlayerHand = [...playerHand, newCard];
      setPlayerHand(newPlayerHand);
      setDeck(newDeck);
  
      const playerTotal = calculateHandValue(newPlayerHand);
      if (playerTotal > 21) {
        setGameStatus('Player busts! Dealer wins.');
      }
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
      setCurrency(currency + bet * 2); // Win payout
      setGameStatus('Player wins!');
    } else if (dealerTotal > playerTotal) {
      setGameStatus('Dealer wins.');
    } else {
      setCurrency(currency + bet); // Push payout
      setGameStatus('It\'s a draw.');
    }
  };

  // Player stands and moves to the next hand if split
const stand = () => {
  if (gameStatus === 'Playing...') {
    if (isSplit && currentHand === 1) {
      setGameStatus('Playing Hand 2...');
      setCurrentHand(2); // Switch to the second hand
    } else {
      dealerTurn(); // End game if both hands have been played or if not split
    }
  }
};

  // Function to double down
  const doubleDown = () => {
    if (bet <= currency) {
      setCurrency(currency - bet); // Deduct additional bet
      setBet(bet * 2); // Double the bet
      setIsDoubleDown(true);
      hit();
      stand(); // End the player's turn
    }
  };

  // Function to split the hand
  const handleSplit = () => {
    if (canSplit()) {
      setIsSplit(true);
      setPlayerHand1([playerHand[0]]);
      setPlayerHand2([playerHand[1]]);
      setCurrency(currency - bet); // Deduct additional bet for the second hand
    }
  };

  return (
    <div>
      <h2>Blackjack Game</h2>
      <p>Currency: ${currency}</p>
  
      {/* Betting Buttons */}
      <button onClick={() => placeBet(10)}>Bet 10</button>
      <button onClick={() => placeBet(20)}>Bet 20</button>
      <button onClick={() => placeBet(50)}>Bet 50</button>
  
      {/* Game Control Buttons */}
      <button onClick={() => startGame(bet)} disabled={bet === 0}>Start New Game</button>
      <button onClick={hit} disabled={gameStatus !== 'Playing...'}>Hit</button>
      <button onClick={stand} disabled={gameStatus !== 'Playing...'}>Stand</button>
      <button onClick={doubleDown} disabled={isDoubleDown || currency < bet}>Double Down</button>
      <button onClick={handleSplit} disabled={!canSplit()}>Split</button>
  
      {/* Render Player Hands */}
      {isSplit ? (
        <>
          <div>
            <h3>Hand 1 ({calculateHandValue(playerHand1)})</h3>
            <p>{playerHand1.map(card => `${card.value}${card.suit}`).join(', ')}</p>
            {currentHand === 1 && <p>Currently Playing Hand 1</p>}
          </div>
          <div>
            <h3>Hand 2 ({calculateHandValue(playerHand2)})</h3>
            <p>{playerHand2.map(card => `${card.value}${card.suit}`).join(', ')}</p>
            {currentHand === 2 && <p>Currently Playing Hand 2</p>}
          </div>
        </>
      ) : (
        <div>
          <h3>Player's Hand ({calculateHandValue(playerHand)})</h3>
          <p>{playerHand.map(card => `${card.value}${card.suit}`).join(', ') || 'No cards yet'}</p>
        </div>
      )}
  
      {/* Dealer's Hand */}
      <div>
        <h3>Dealer's Hand ({calculateHandValue(dealerHand)})</h3>
        <p>{dealerHand.map(card => `${card.value}${card.suit}`).join(', ') || 'No cards yet'}</p>
      </div>
  
      <p>{gameStatus}</p>
    </div>
  );
  
};

export default Game;
