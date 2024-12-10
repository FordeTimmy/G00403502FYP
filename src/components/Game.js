import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

// Creating the deck and shuffling logic
const createDeck = () => {
    const suits = ['♠', '♥', '♣', '♦'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];

    // Generate all 52 cards
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    return deck.sort(() => Math.random() - 0.5); // Shuffle the deck randomly 
};

// Function to get card value
const getCardValue = (card) => {
    if (['J', 'Q', 'K'].includes(card.value)) return 10; // Face cards are worth 10
    if (card.value === 'A') return 11; // Ace is worth 11 by default
    return parseInt(card.value);
};

// Function to calculate hand total
const calculateHandValue = (hand) => {
    let total = 0;
    let aces = 0; // Count the number of Aces in the hand

     // Sum up the values of all cards
    hand.forEach(card => {
        total += getCardValue(card);
        if (card.value === 'A') aces += 1; // Track the number of Aces
    });

    // Adjust Aces to avoid busting (each Ace can be worth 1 instead of 11)
    while (total > 21 && aces > 0) {
        total -= 10; // Subtract 10 for each Ace
        aces -= 1; // Reduce the Ace count
    }

    return total; // Return the total value of the hand
};

const updateUserStats = async (gameResult, betAmount = 0) => {
    if (!auth.currentUser) return;

    const db = getFirestore();
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);

    // Initialize stats if they don't exist
    if (!userSnap.exists()) {
        await setDoc(userRef, {
            handsWon: 0,
            handsLost: 0,
            totalAmountWon: 0,
            totalAmountLost: 0,
            gamesPlayed: 0
        });
    }

    const userData = userSnap.exists() ? userSnap.data() : {};
    const isWin = gameResult === 'win';

    const newStats = {
        handsWon: (userData.handsWon || 0) + (isWin ? 1 : 0),
        handsLost: (userData.handsLost || 0) + (!isWin ? 1 : 0),
        totalAmountWon: (userData.totalAmountWon || 0) + (isWin ? betAmount : 0),
        totalAmountLost: (userData.totalAmountLost || 0) + (!isWin ? betAmount : 0),
        gamesPlayed: (userData.gamesPlayed || 0) + 1
    };

    try {
        await updateDoc(userRef, newStats);
        console.log("Stats updated successfully:", newStats);
    } catch (error) {
        console.error("Error updating stats:", error);
    }
};

const Game = () => {
    const [currency, setCurrency] = useState(1000); // Player's currency
    const [bet, setBet] = useState(0); // Initial bet
    const [canBet, setCanBet] = useState(true); // Allow betting only at the start
    const [playerHand, setPlayerHand] = useState([]);  // Player's hand
    const [dealerHand, setDealerHand] = useState([]); // Dealer's hand
    const [currentHand, setCurrentHand] = useState(1); // Track which hand is active
    const [deck, setDeck] = useState([]); // Current deck
    const [gameStatus, setGameStatus] = useState('');
    const [isDoubleDownAllowed, setIsDoubleDownAllowed] = useState(true); // Allow double down only at start
    const [isSplit, setIsSplit] = useState(false); // Split status
    const [playerHand1, setPlayerHand1] = useState([]);
    const [playerHand2, setPlayerHand2] = useState([]);
    const [isPaused, setIsPaused] = useState(false); // Pause status
    const [timer, setTimer] = useState(null); // Timer for auto-dealing

    // Move useEffect inside the component
    useEffect(() => {
        const loadSavedGame = async () => {
            if (!auth.currentUser) return;

            const db = getFirestore();
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().savedGame) {
                const savedGame = userSnap.data().savedGame;
                setCurrency(savedGame.currency || 1000);
                setBet(savedGame.bet || 0);
                setGameStatus(savedGame.gameStatus || '');
            }
        };

        loadSavedGame();
    }, []);

    
    const saveGame = async () => {
        if (!auth.currentUser) return;

        const db = getFirestore();
        const userRef = doc(db, 'users', auth.currentUser.uid);

        try {
            await updateDoc(userRef, {
                savedGame: {
                    currency,
                    bet,
                    gameStatus,
                    lastSaved: new Date().toISOString()
                }
            });
            alert('Game saved successfully!');
        } catch (error) {
            console.error('Error saving game:', error);
            alert('Failed to save game');
        }
    };

    // Function to check if the player can split
    const canSplit = () => {
        return playerHand.length === 2 && // Ensure there are exactly 2 cards
            getCardValue(playerHand[0]) === getCardValue(playerHand[1]) && // Both cards must have the same value
            bet <= currency; // Player must have enough currency to place an additional bet
    };

    // Function to place a bet and start a new game
    const placeBet = (amount) => {
        if (canBet && amount <= currency && amount > 0) { // Check if betting is allowed 
            setBet(amount);
            setCurrency(currency - amount); // Deduct the bet from the player's currency
            setCanBet(false); // Disable further betting once the game starts
            startGame(amount);
        } else {
            alert("Betting is only allowed at the start of the game, and you need sufficient funds.");
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
        setIsDoubleDownAllowed(true); // Allow double down only at the start of each game
        setIsSplit(false);
        setPlayerHand1([]);
        setPlayerHand2([]);
        setBet(betAmount); // Update the bet
        clearTimeout(timer); // Clear any existing timer if a new game starts
    };

    // Function to handle the end of a round
const endRound = (status) => {
    console.log("endRound called with status:", status);  // Debugging log
    setGameStatus(`${status} New hand starting in 5 seconds...`);
    setIsDoubleDownAllowed(false); // Disable double down after the round ends

    // Improve result determination logic
    let result;
    if (status.toLowerCase().includes('player wins')) {
        result = 'win';
    } else if (status.toLowerCase().includes('push')) {
        result = 'push';
    } else {
        result = 'loss';  // Consider everything else as a loss (dealer wins, player busts)
    }

    // Only update stats for wins and losses, not pushes
    if (result !== 'push') {
        updateUserStats(result, bet);
    }

    // Only set the timer if the game is not paused
    if (!isPaused) {
        const newTimer = setTimeout(() => {
            console.log("Timer triggered - calling startNewHand");  // Debugging log
            startNewHand();
        }, 5000);
        setTimer(newTimer); // Update the timer state
    }
};
    

    // Function to start a new hand automatically
    const startNewHand = () => {
        console.log("startNewHand called");  // Debugging log
        clearTimeout(timer); // Ensure any old timer is cleared
        setGameStatus('');
        setBet(0);
        setCanBet(true);
        setPlayerHand([]);
        setDealerHand([]);
        setDeck(createDeck());
    };

    // Function to handle pause/resume
    const togglePause = () => {
        if (isPaused) {
            // Resume game - restore previous game status
            setGameStatus('Playing...');
        } else {
            // Pause game - clear any pending timers
            clearTimeout(timer);
        }
        setIsPaused(!isPaused);
    };

    // UseEffect to clean up the timer on component unmount
    useEffect(() => {
        return () => {
            console.log("Cleaning up timer");  // Debugging log
            clearTimeout(timer);
        };
    }, [timer]);
    
// Function to handle the player hitting 
    const hit = () => {
        if (gameStatus !== 'Playing...') return; // Prevent hitting if the game is not active

        const newDeck = [...deck]; // Copy the current deck
        const newCard = newDeck.pop(); // Draw the top card

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
                endRound('Player busts! Dealer wins.'); 
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
                endRound('Player busts! Dealer wins.');  // This will be counted as a loss
            } else if (dealerTotal > 21) {
                setCurrency(currency + bet * 2);
                endRound('Player wins!');  // This will be counted as a win
            } else if (playerTotal > dealerTotal) {
                setCurrency(currency + bet * 2);
                endRound('Player wins!');  // This will be counted as a win
            } else if (dealerTotal === playerTotal) {
                setCurrency(currency + bet);
                endRound('Push.');  // This will be counted as a push
            } else {
                endRound('Dealer wins.');  // This will be counted as a loss
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
        if (isDoubleDownAllowed && bet <= currency) {
            setCurrency(currency - bet);
            setBet(bet * 2);
            setIsDoubleDownAllowed(false); // Disable double down after it’s used
            hit(); // Automatically hit after doubling down
            stand(); // End the player's turn after doubling down
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

            {/* Betting Buttons, disabled if betting is not allowed */}
            <button onClick={() => placeBet(10)} disabled={!canBet || isPaused}>Bet 10</button>
            <button onClick={() => placeBet(20)} disabled={!canBet || isPaused}>Bet 20</button>
            <button onClick={() => placeBet(50)} disabled={!canBet || isPaused}>Bet 50</button>

            {/* Game Control Buttons */}
            <button onClick={() => startGame(bet)} disabled={bet === 0 || !canBet || isPaused}>Start New Game</button>
            <button onClick={togglePause}>{isPaused ? 'Resume' : 'Pause'}</button>
            <button
                onClick={hit}
                disabled={gameStatus !== 'Playing...' || isPaused || (isSplit && currentHand === 2 && calculateHandValue(playerHand2) >= 21)}>
                Hit
            </button>
            <button onClick={saveGame}>Save Game</button>
            <button onClick={stand} disabled={gameStatus !== 'Playing...' || isPaused}>Stand</button>
            <button onClick={doubleDown} disabled={!isDoubleDownAllowed || isPaused}>Double Down</button>
            <button onClick={handleSplit} disabled={!canSplit() || isPaused}>Split</button>

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
