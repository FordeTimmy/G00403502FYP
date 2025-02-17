import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';
import { chooseAction, updateQValue, getQTable, loadQTable, saveQTable } from './qLearning';

// Helper functions
const calculateHandValue = (hand) => {
    let total = 0;
    let aces = 0;
    hand.forEach(card => {
        if (card.value === 'A') {
            aces++;
            total += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            total += 10;
        } else {
            total += parseInt(card.value);
        }
    });
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
};

const createDeck = () => {
    const suits = ['♠', '♥', '♣', '♦'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

const saveQTableToFirebase = async () => {
    const db = getFirestore();
    try {
        // Save to a user-specific path instead
        if (auth.currentUser) {
            await setDoc(doc(db, 'users', auth.currentUser.uid, 'ai_training', 'q_table'), {
                QTable: getQTable(),
                lastUpdated: new Date().toISOString()
            });
            console.log('Q-table saved successfully!');
        } else {
            console.log('User not authenticated, storing Q-table locally only');
            localStorage.setItem('q_table', JSON.stringify(getQTable()));
        }
    } catch (error) {
        console.error('Error saving Q-table:', error);
        // Fallback to local storage
        localStorage.setItem('q_table', JSON.stringify(getQTable()));
    }
};

const calculateReward = (playerTotal, dealerTotal, numCards, betAmount) => {
    let reward = 0;

    // Enhanced reward structure
    if (playerTotal === 21 && numCards === 2) {
        reward = 60;  // Higher blackjack bonus
    } else if (playerTotal === 21) {
        reward = 40;  // Higher perfect hand reward
    } else if (playerTotal === 20) {
        reward = 25;  // Better near-perfect reward
    } else if (playerTotal === 19) {
        reward = 20;  // Better strong hand reward
    } else if (playerTotal === 18) {
        reward = 15;  // New reward tier
    }
    
    // Enhanced winning conditions
    else if (dealerTotal > 21) {
        reward = 20 + Math.min(15, (21 - playerTotal)); // Better dealer bust bonus
    } else if (playerTotal > dealerTotal && playerTotal < 21) {
        reward = 20 + (playerTotal - dealerTotal) * 3; // Triple winning margin bonus
    }
    
    // Adjusted penalties
    else if (playerTotal > 21) {
        reward = -25 - Math.min(15, (playerTotal - 21)); // Harsher bust penalty
    } else if (playerTotal < dealerTotal) {
        reward = -20 - (dealerTotal - playerTotal) * 2; // Doubled loss penalty
    }

    // Strategic play rewards
    if (playerTotal >= 17 && playerTotal <= 21) {
        reward += 10; // Higher bonus for safe play
    }

    return reward;
};

const runSimulation = async (numGames) => {
    let winCount = 0;
    let lossCount = 0;

    for (let i = 0; i < numGames; i++) {
        let deck = createDeck();
        let playerHand = [deck.pop(), deck.pop()];
        let dealerHand = [deck.pop(), deck.pop()];
        let state = `${calculateHandValue(playerHand)}-${dealerHand[0].value}-0-1`;
        let gameOver = false;
        let reward = 0;
        let bet = 10; // Default bet amount

        while (!gameOver) {
            const action = chooseAction(state);
            let playerTotal = calculateHandValue(playerHand);
            const previousTotal = playerTotal;

            switch (action) {
                case 'hit':
                    playerHand.push(deck.pop());
                    playerTotal = calculateHandValue(playerHand);
                    if (playerTotal > 21) {
                        reward = calculateReward(playerTotal, 0, playerHand.length, bet);
                        gameOver = true;
                        lossCount++;
                    } else if (playerTotal > previousTotal && playerTotal <= 21) {
                        reward = 5; // Reward for successful hit
                        if (playerTotal >= 17) {
                            reward += 3; // Additional reward for safe hit
                        }
                    }
                    break;

                case 'stand':
                    while (calculateHandValue(dealerHand) < 17) {
                        dealerHand.push(deck.pop());
                    }
                    const dealerTotal = calculateHandValue(dealerHand);
                    reward = calculateReward(playerTotal, dealerTotal, playerHand.length, bet);
                    gameOver = true;
                    if (reward > 0) winCount++;
                    else if (reward < 0) lossCount++;
                    break;

                default:
                    gameOver = true;
                    reward = -5;
                    lossCount++;
            }

            const nextState = `${calculateHandValue(playerHand)}-${dealerHand[0].value}-0-1`;
            updateQValue(state, action, reward, nextState);
            state = nextState;
        }
    }

    return { winCount, lossCount };
};

export const simulateGames = async (numGames = 2000, iterations = 25) => {
    console.log('Loading previous Q-table...');
    await loadQTable();

    console.log(`Starting enhanced training: ${numGames} games × ${iterations} iterations`);
    let totalWins = 0;
    let totalGames = 0;

    for (let i = 0; i < iterations; i++) {
        const { winCount, lossCount } = await runSimulation(numGames);
        totalWins += winCount;
        totalGames += numGames;

        // Save progress every 5 iterations
        if ((i + 1) % 5 === 0) {
            await saveQTable();
            console.log(`Progress saved at iteration ${i + 1}`);
            console.log(`Current win rate: ${((totalWins/totalGames)*100).toFixed(2)}%`);
        }
    }

    await saveQTable();
    return { totalWins, totalGames };
};
