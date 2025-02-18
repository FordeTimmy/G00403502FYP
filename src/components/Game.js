import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';
import './Game.css';
import { initializeQ, updateQValue, getQTable, chooseAction } from '../utils/qLearning';
import { simulateGames } from '../utils/simulateGames';
import { useNavigate } from 'react-router-dom';  // Add this import at the top



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
    const navigate = useNavigate();  // Add this hook
    const [renderTrigger, setRenderTrigger] = useState(false);
    
    // Add debug logging for chip images
    useEffect(() => {
        console.log("Chip images:");
        console.log("Red chip:", getChipImage('10'));
        console.log("Green chip:", getChipImage('20'));
        console.log("Blue chip:", getChipImage('50'));
        console.log("Black chip:", getChipImage('100'));
        
        // Force re-render after short delay
        setTimeout(() => {
            setRenderTrigger(prev => !prev);
        }, 500);
    }, []);

    // Update card image helper to use Deck of Cards API CDN
    const getCardImage = (card) => {
        if (!card) return '';
        const value = card.value;
        const suit = card.suit;
        let suitCode = '';
        let valueCode = value;
        
        // Convert suit symbols to letters
        switch(suit) {
            case '♠': suitCode = 'S'; break;
            case '♥': suitCode = 'H'; break;
            case '♣': suitCode = 'C'; break;
            case '♦': suitCode = 'D'; break;
            default: suitCode = 'S';
        }

        // Convert values to match API format
        switch(value) {
            case '10': valueCode = '0'; break;
            case 'J': valueCode = 'J'; break;
            case 'Q': valueCode = 'Q'; break;
            case 'K': valueCode = 'K'; break;
            case 'A': valueCode = 'A'; break;
            default: valueCode = value;
        }

        return `https://deckofcardsapi.com/static/img/${valueCode}${suitCode}.png`;
    };

    // Update chip image helper with new values
    const getChipImage = (value) => {
        const chipMap = {
            '10': './images/chips/redchip.png',
            '20': './images/chips/greenchip.png',
            '50': './images/chips/bluechip.png',
            '100': './images/chips/blackchip.png'
        };
        return chipMap[value];
    };

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
    const [activeBet, setActiveBet] = useState(null); // Add this state for the active bet chip
    const [lastAction, setLastAction] = useState(null); // Add state for tracking last action

    // Move useEffect inside the component
    useEffect(() => {
        const loadSavedGame = async () => {
            if (!auth.currentUser) return;

            try {
                const db = getFirestore();
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    if (userData.savedGame) {
                        const savedGame = userData.savedGame;
                        console.log('Loading saved game state:', savedGame);
                        setCurrency(savedGame.currency || 1000);
                        setBet(savedGame.bet || 0);
                        setGameStatus(savedGame.gameStatus || '');
                    } else {
                        // Initialize new user with default currency
                        console.log('Initializing new user with default currency');
                        await updateDoc(userRef, {
                            savedGame: {
                                currency: 1000,
                                bet: 0,
                                gameStatus: '',
                                lastSaved: new Date().toISOString()
                            }
                        });
                        setCurrency(1000);
                    }
                }
            } catch (error) {
                console.error('Error loading saved game:', error);
                alert('Failed to load saved game state');
            }
        };

        loadSavedGame();
    }, []);

    
    const saveGame = async () => {
        if (!auth.currentUser) return;

        const db = getFirestore();
        const userRef = doc(db, 'users', auth.currentUser.uid);

        try {
            const gameState = {
                savedGame: {
                    currency: currency,
                    bet: bet,
                    gameStatus: gameStatus,
                    lastSaved: new Date().toISOString()
                }
            };
            
            console.log('Saving game state:', gameState);
            await updateDoc(userRef, gameState);
            alert('Game saved successfully!');
        } catch (error) {
            console.error('Error saving game:', error);
            alert('Failed to save game');
        }
    };

    // Add auto-save when currency changes
    useEffect(() => {
        const autoSave = async () => {
            if (auth.currentUser && currency !== 1000) { // Only save if currency has changed from initial value
                const db = getFirestore();
                const userRef = doc(db, 'users', auth.currentUser.uid);
                
                try {
                    await updateDoc(userRef, {
                        savedGame: {
                            currency: currency,
                            bet: bet,
                            gameStatus: gameStatus,
                            lastSaved: new Date().toISOString()
                        }
                    });
                    console.log('Auto-saved game state');
                } catch (error) {
                    console.error('Error auto-saving game:', error);
                }
            }
        };

        autoSave();
    }, [currency, bet, gameStatus]); // Trigger auto-save when currency changes

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
            setActiveBet(amount); // Store the bet amount to show correct chip
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

        // Initialize Q-values for the initial game state
        const currentState = `${calculateHandValue(playerInitialHand)}-${dealerInitialHand[0].value}-${getCardValue(playerInitialHand[0]) === getCardValue(playerInitialHand[1]) ? '1' : '0'}-1`;
        initializeQ(currentState, ['hit', 'stand', 'doubleDown', 'split']);
    };

    // Function to handle the end of a round
const endRound = (status) => {
    console.log("endRound called with status:", status);  // Debugging log
    setGameStatus(`${status} New hand starting in 5 seconds...`);
    setIsDoubleDownAllowed(false); // Disable double down after the round ends

    // Improve result determination logic
    let result;
    let reward;
    if (status.toLowerCase().includes('player wins')) {
        setCurrency(prev => prev + (bet * 2)); // Return original bet plus winnings
        result = 'win';
        reward = 10;
    } else if (status.toLowerCase().includes('push')) {
        setCurrency(prev => prev + bet); // Return original bet on push
        result = 'push';
        reward = 0;
    } else {
        result = 'loss';  // Consider everything else as a loss (dealer wins, player busts)
        reward = -10;
    }

    // Get the current state and update Q-value
    const currentState = `${calculateHandValue(playerHand)}-${dealerHand[0].value}-${canSplit() ? '1' : '0'}-${isDoubleDownAllowed ? '1' : '0'}`;
    const nextState = 'end';

    if (lastAction) {
        updateQValue(currentState, lastAction, reward, nextState);
        console.log('Updated Q-table:', getQTable());
    }

    // Reset lastAction
    setLastAction(null);

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
        setActiveBet(null);
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
        setLastAction('hit');

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
        
        // Log Q-table after hit action
        console.log('Q-table after hit:', getQTable());
    };

    // Dealer's turn to play
    const dealerTurn = () => {
        let newDeck = [...deck];
        let newDealerHand = [...dealerHand];

        // Dealer must hit on 16 and stand on 17
        while (calculateHandValue(newDealerHand) < 17) {
            const newCard = newDeck.pop();
            newDealerHand.push(newCard);
        }

        setDealerHand(newDealerHand);
        setDeck(newDeck);

        const dealerTotal = calculateHandValue(newDealerHand);

        if (isSplit) {
            const hand1Total = calculateHandValue(playerHand1);
            const hand2Total = calculateHandValue(playerHand2);
            let resultMessage = '';

            // Handle first split hand
            if (hand1Total > 21) {
                resultMessage += 'Hand 1 Bust! Dealer wins. ';
            } else if (dealerTotal > 21 || hand1Total > dealerTotal) {
                resultMessage += 'Hand 1 Wins! ';
            } else if (dealerTotal === hand1Total) {
                resultMessage += 'Hand 1 Push. ';
            } else {
                resultMessage += 'Dealer wins Hand 1. ';
            }

            // Handle second split hand
            if (hand2Total > 21) {
                resultMessage += 'Hand 2 Bust! Dealer wins.';
            } else if (dealerTotal > 21 || hand2Total > dealerTotal) {
                resultMessage += 'Hand 2 Wins!';
            } else if (dealerTotal === hand2Total) {
                resultMessage += 'Hand 2 Push.';
            } else {
                resultMessage += 'Dealer wins Hand 2.';
            }

            endRound(resultMessage);
        } else {
            const playerTotal = calculateHandValue(playerHand);
            
            // Handle regular game outcome
            if (playerTotal > 21) {
                endRound('Player busts! Dealer wins.');
            } else if (dealerTotal > 21) {
                endRound('Player wins!');
            } else if (playerTotal > dealerTotal) {
                endRound('Player wins!');
            } else if (dealerTotal === playerTotal) {
                endRound('Push.');
            } else {
                endRound('Dealer wins.');
            }
        }
    };

    const stand = () => {
        if (gameStatus === 'Playing...') {
            setLastAction('stand');
            if (isSplit && currentHand === 1) {
                setCurrentHand(2); // Switch to Hand 2
                setGameStatus('Playing...'); // Reset status 
            } else {
                dealerTurn(); // Only call dealerTurn when both hands are done or if not split
            }
            // Log Q-table after stand action
            console.log('Q-table after stand:', getQTable());
        }
    };

    // Function to double down
    const doubleDown = () => {
        if (isDoubleDownAllowed && bet <= currency) {
            setLastAction('doubleDown');
            setCurrency(currency - bet);
            setBet(bet * 2);
            setIsDoubleDownAllowed(false); // Disable double down after it’s used
            hit(); // Automatically hit after doubling down
            stand(); // End the player's turn after doubling down
            
            // Log Q-table after double down action
            console.log('Q-table after double down:', getQTable());
        }
    };

    // Function to split the hand
    const handleSplit = () => {
        if (canSplit()) {
            setLastAction('split');
            setIsSplit(true);
            setPlayerHand1([playerHand[0]]);
            setPlayerHand2([playerHand[1]]);
            setCurrency(currency - bet); // Deduct additional bet for the second hand
            setCurrentHand(1); // Start with the first hand
            
            // Log Q-table after split action
            console.log('Q-table after split:', getQTable());
        }
    };

    const getAIRecommendation = () => {
        // Only provide recommendation during active gameplay and when hands are dealt
        if (gameStatus !== 'Playing...' || !playerHand.length || !dealerHand.length) return '';
        
        const currentState = `${calculateHandValue(playerHand)}-${dealerHand[0].value}-${canSplit() ? '1' : '0'}-${isDoubleDownAllowed ? '1' : '0'}`;
        const recommendation = chooseAction(currentState);
        
        // Only recommend valid actions
        if (recommendation === 'split' && !canSplit()) return 'hit';
        if (recommendation === 'doubleDown' && !isDoubleDownAllowed) return 'hit';
        
        return recommendation;
    };

    // Keep the manual training function
    const handleRetrainAI = async () => {
        if (window.confirm('This will train the AI with 10,000 games. Continue?')) {
            setGameStatus('Training AI...');
            try {
                await simulateGames(10000);
                setGameStatus('AI training complete!');
                setTimeout(() => setGameStatus(''), 3000);
            } catch (error) {
                console.error('AI training error:', error);
                setGameStatus('AI training failed');
            }
        }
    };

    // Add this function to handle navigation
    const handleHomeClick = () => {
        if (window.confirm('Are you sure you want to return to the home page? Current game progress will be lost.')) {
            navigate('/');
        }
    };

    return (
        <div className="casino-table">
            <div className="game-header">
                {/* Add home button next to title */}
                <div className="header-content">
                    <h1 className="game-title">Casino Blackjack</h1>
                    <button onClick={handleHomeClick} className="home-button">
                        Home
                    </button>
                </div>
                <div className="currency-display">
                    Balance: ${currency.toLocaleString()}
                </div>
            </div>

            {/* Move chips to vertical layout */}
            <div className="betting-chips">
                {[
                    { value: '100', label: '100' },
                    { value: '50', label: '50' },
                    { value: '20', label: '20' },
                    { value: '10', label: '10' }
                ].map((chip, index) => (
                    <div key={index} className="chip-container">
                        <img 
                            src={getChipImage(chip.value)}
                            alt={`Bet ${chip.label}`}
                            className={`chip ${(!canBet || isPaused) ? 'disabled' : ''}`}
                            onClick={() => canBet && !isPaused && placeBet(parseInt(chip.value))}
                        />
                        <span className="chip-label">{chip.label}</span>
                    </div>
                ))}
            </div>

            {/* Add AI suggestion before the dealer's hand */}
            {gameStatus === 'Playing...' && (
                <div className="ai-suggestion">
                    <p>AI Suggestion: {getAIRecommendation()}</p>
                </div>
            )}

            {/* Dealer's hand */}
            <div className="dealer-hand">
                <h3 className="text-white">Dealer's Hand ({calculateHandValue(dealerHand)})</h3>
                <div className="flex gap-2">
                    {dealerHand.map((card, index) => (
                        <img 
                            key={index}
                            src={getCardImage(card)}
                            alt={`${card.value}${card.suit}`}
                            className="card"
                        />
                    ))}
                </div>
            </div>

            {/* Updated betting display */}
            {activeBet && (
                <>
                    <div className="bet-amount">Current Bet: ${activeBet}</div>
                    <div className="pot-container">
                        <div className="pot-chip-container">
                            <img 
                                src={getChipImage(activeBet.toString())}
                                alt="Pot Chip"
                                className="pot-chip"
                            />
                            <span className="pot-chip-label">{activeBet}</span>
                        </div>
                    </div>
                </>
            )}

            {/* Player's hand(s) */}
            {isSplit ? (
                <>
                    <div className="player-hand">
                        <h3 className="text-white">Hand 1 ({calculateHandValue(playerHand1)})</h3>
                        <div className="flex gap-2">
                            {playerHand1.map((card, index) => (
                                <img 
                                    key={index}
                                    src={getCardImage(card)}
                                    alt={`${card.value}${card.suit}`}
                                    className="card"
                                />
                            ))}
                        </div>
                    </div>
                    <div className="player-hand">
                        <h3 className="text-white">Hand 2 ({calculateHandValue(playerHand2)})</h3>
                        <div className="flex gap-2">
                            {playerHand2.map((card, index) => (
                                <img 
                                    key={index}
                                    src={getCardImage(card)}
                                    alt={`${card.value}${card.suit}`}
                                    className="card"
                                />
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="player-hand">
                    <h3 className="text-white">Player's Hand ({calculateHandValue(playerHand)})</h3>
                    <div className="flex gap-2">
                        {playerHand.map((card, index) => (
                            <img 
                                key={index}
                                src={getCardImage(card)}
                                alt={`${card.value}${card.suit}`}
                                className="card"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Game controls */}
            <div className="controls">
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
                <button 
                    onClick={handleRetrainAI}
                    className="train-button"
                    disabled={gameStatus === 'Playing...' || isPaused}
                >
                    Train AI
                </button>
            </div>

            {/* Move status message to right side */}
            {gameStatus && (
                <div className="game-status">
                    {gameStatus}
                </div>
            )}
        </div>
    );
};

export default Game;
