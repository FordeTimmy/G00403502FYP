import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { chooseAction, updateQValue, getQTable } from './qLearning';

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
        await setDoc(doc(db, 'ai_training', 'q_table'), { QTable: getQTable() });
        console.log('Q-table saved to Firebase!');
    } catch (error) {
        console.error('Error saving Q-table:', error);
    }
};

export const simulateGames = async (numGames = 10000) => {
    console.log(`Training AI with ${numGames} simulated games...`);
    let winCount = 0;
    let lossCount = 0;

    for (let i = 0; i < numGames; i++) {
        let deck = createDeck();
        let playerHand = [deck.pop(), deck.pop()];
        let dealerHand = [deck.pop(), deck.pop()];
        let state = `${calculateHandValue(playerHand)}-${dealerHand[0].value}-0-1`;
        let gameOver = false;
        let reward = 0;

        while (!gameOver) {
            const action = chooseAction(state);
            switch (action) {
                case 'hit':
                    playerHand.push(deck.pop());
                    if (calculateHandValue(playerHand) > 21) {
                        reward = -10;
                        gameOver = true;
                        lossCount++;
                    }
                    break;

                case 'stand':
                    while (calculateHandValue(dealerHand) < 17) {
                        dealerHand.push(deck.pop());
                    }
                    const playerTotal = calculateHandValue(playerHand);
                    const dealerTotal = calculateHandValue(dealerHand);
                    
                    if (dealerTotal > 21 || playerTotal > dealerTotal) {
                        reward = 10;
                        winCount++;
                    } else if (playerTotal === dealerTotal) {
                        reward = 0;
                    } else {
                        reward = -10;
                        lossCount++;
                    }
                    gameOver = true;
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

        if (i % 1000 === 0) {
            console.log(`Simulated ${i} games, Win rate: ${((winCount/(i+1))*100).toFixed(2)}%`);
        }
    }

    console.log(`Training complete! Final win rate: ${((winCount/numGames)*100).toFixed(2)}%`);
    await saveQTableToFirebase();
    return { winCount, lossCount };
};
