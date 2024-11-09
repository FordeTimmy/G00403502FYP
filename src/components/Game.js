import React, { useState } from 'react';

// Creating the deck and shuffling logic
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
    if (card.value === 'A') return 11;
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
        return playerHand.length === 2 &&
            getCardValue(playerHand[0]) === getCardValue(playerHand[1]) &&
            bet <= currency;
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

    const hit = () => {
        if (gameStatus !== 'Playing...') return;

        const newDeck = [...deck];
        const newCard = newDeck.pop();

        if (isSplit) {
            if (currentHand === 1) {
                const newHand1 = [...playerHand1, newCard];
                setPlayerHand1(newHand1);
                setDeck(newDeck);

                if (calculateHandValue(newHand1) > 21) {
                    setGameStatus('Hand 1 Bust! Moving to Hand 2...');
                    setCurrentHand(2); // Move to Hand 2 if Hand 1 busts
                } else {
                    setGameStatus('Playing...'); // Keep playing Hand 1 if it’s still under 21
                }
            } else if (currentHand === 2) {
                const newHand2 = [...playerHand2, newCard];
                setPlayerHand2(newHand2);
                setDeck(newDeck);

                if (calculateHandValue(newHand2) > 21) {
                    setGameStatus('Hand 2 Bust! Dealer’s turn.');
                    dealerTurn();
                } else {
                    setGameStatus('Playing...'); // Keep playing Hand 2 if it’s still under 21
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
            } else {
                setGameStatus('Playing...'); // Keep playing if not busting
            }
        }
    };


    // Dealer's turn to play
    const dealerTurn = () => {
        let newDeck = [...deck];
        let newDealerHand = [...dealerHand];

        while (calculateHandValue(newDealerHand) < 17) {
            const newCard = newDeck.pop();
            newDealerHand.push(newCard);
        }

        setDealerHand(newDealerHand);
        setDeck(newDeck);

        const dealerTotal = calculateHandValue(newDealerHand);
        const hand1Total = calculateHandValue(playerHand1);
        const hand2Total = calculateHandValue(playerHand2);

        // Determine result for each hand if split
        if (isSplit) {
            let resultMessage = '';

            if (hand1Total > 21) {
                resultMessage += 'Hand 1 Bust! Dealer wins. ';
            } else if (dealerTotal > 21 || hand1Total > dealerTotal) {
                resultMessage += 'Hand 1 Wins! ';
                setCurrency(currency + bet * 2);
            } else if (dealerTotal === hand1Total) {
                resultMessage += 'Hand 1 Push. ';
                setCurrency(currency + bet);
            } else {
                resultMessage += 'Dealer wins Hand 1. ';
            }

            if (hand2Total > 21) {
                resultMessage += 'Hand 2 Bust! Dealer wins.';
            } else if (dealerTotal > 21 || hand2Total > dealerTotal) {
                resultMessage += 'Hand 2 Wins!';
                setCurrency(currency + bet * 2);
            } else if (dealerTotal === hand2Total) {
                resultMessage += 'Hand 2 Push.';
                setCurrency(currency + bet);
            } else {
                resultMessage += 'Dealer wins Hand 2.';
            }

            setGameStatus(resultMessage);
        } else {
            const playerTotal = calculateHandValue(playerHand);
            if (playerTotal > 21) {
                setGameStatus('Player busts! Dealer wins.');
            } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
                setGameStatus('Player wins!');
                setCurrency(currency + bet * 2);
            } else if (dealerTotal === playerTotal) {
                setGameStatus('Push.');
                setCurrency(currency + bet);
            } else {
                setGameStatus('Dealer wins.');
            }
        }
    };

    const stand = () => {
        if (gameStatus === 'Playing...') {
            if (isSplit && currentHand === 1) {
                setCurrentHand(2); // Switch to Hand 2
                setGameStatus('Playing...'); // Reset status 
            } else {
                dealerTurn(); // Only call dealerTurn when both hands are done or if not split
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
            setCurrentHand(1); // Start with the first hand
        }
    };

    return (
        <div>
            <h2>Blackjack Game</h2>
            <p>Currency: ${currency}</p>

            <button onClick={() => placeBet(10)}>Bet 10</button>
            <button onClick={() => placeBet(20)}>Bet 20</button>
            <button onClick={() => placeBet(50)}>Bet 50</button>

            <button onClick={() => startGame(bet)} disabled={bet === 0}>Start New Game</button>
            <button
                onClick={hit}
                disabled={gameStatus !== 'Playing...' || (isSplit && currentHand === 2 && calculateHandValue(playerHand2) >= 21)}>
                Hit
            </button>


            <button onClick={stand} disabled={gameStatus !== 'Playing...'}>Stand</button>
            <button onClick={doubleDown} disabled={isDoubleDown || currency < bet}>Double Down</button>
            <button onClick={handleSplit} disabled={!canSplit()}>Split</button>

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

            <div>
                <h3>Dealer's Hand ({calculateHandValue(dealerHand)})</h3>
                <p>{dealerHand.map(card => `${card.value}${card.suit}`).join(', ') || 'No cards yet'}</p>
            </div>

            <p>{gameStatus}</p>
        </div>
    );
};

export default Game;
