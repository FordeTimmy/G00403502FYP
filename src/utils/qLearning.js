import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

// Optimized parameters for stable higher win rate
let QTable = {};
let epsilon = 0.95;  // Slightly lower initial exploration
const epsilonDecay = 0.9997;  // More balanced decay
const minEpsilon = 0.2;  // Lower minimum for more exploitation
const alpha = 0.05;  // Moderate learning rate
const gamma = 0.97;  // Slightly lower future reward weight
const maxMemory = 150000;  // Balanced memory size
const batchSize = 128;  // Moderate batch size

// Initialize experience memory array
let experienceMemory = [];

// Initialize state for Q-learning
export const initializeQ = (state, actions) => {
    if (!QTable[state]) {
        QTable[state] = {};
        for (let action of actions) {
            QTable[state][action] = 0;
        }
    }
};

const addToMemory = (experience) => {
    experienceMemory.push(experience);
    if (experienceMemory.length > maxMemory) {
        experienceMemory.shift();
    }
};

const sampleFromMemory = (batchSize = 64) => {
    if (experienceMemory.length < batchSize) return experienceMemory;
    const samples = [];
    for (let i = 0; i < batchSize; i++) {
        const index = Math.floor(Math.random() * experienceMemory.length);
        samples.push(experienceMemory[index]);
    }
    return samples;
};

// Reset functions
export const initializeQTable = () => {
    QTable = {};
    experienceMemory = []; // Reset experience memory too
    console.log('Q-table and experience memory initialized');
};

export const loadQTable = async () => {
    try {
        if (!auth.currentUser) {
            console.log('No authenticated user, using local storage');
            const localQTable = localStorage.getItem('q_table');
            if (localQTable) {
                QTable = JSON.parse(localQTable);
                console.log('Loaded Q-table from local storage');
            } else {
                initializeQTable();
            }
            return;
        }

        const db = getFirestore();
        const docRef = doc(db, 'users', auth.currentUser.uid, 'training', 'q_table');
        
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                QTable = { ...docSnap.data().QTable };
                console.log('Q-table loaded from Firestore');
            } else {
                console.log('No Q-table in Firestore, initializing new one');
                initializeQTable();
            }
        } catch (firestoreError) {
            console.error('Firestore error:', firestoreError);
            // Try loading from localStorage as fallback
            const localQTable = localStorage.getItem('q_table');
            if (localQTable) {
                QTable = JSON.parse(localQTable);
                console.log('Loaded Q-table from local storage fallback');
            } else {
                initializeQTable();
            }
        }
    } catch (error) {
        console.error('Error in loadQTable:', error);
        initializeQTable();
    }
};

export const saveQTable = async () => {
    try {
        if (!auth.currentUser) {
            console.log('No user logged in, saving Q-table locally');
            localStorage.setItem('q_table', JSON.stringify(QTable));
            return;
        }

        const db = getFirestore();
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'training', 'q_table'), {
            QTable,
            lastUpdated: new Date().toISOString(),
            trainingStats: {
                epsilon,
                experienceMemorySize: experienceMemory.length
            }
        });
        console.log('Q-table saved successfully!');
    } catch (error) {
        console.error('Error saving Q-table:', error);
        // Fallback to localStorage
        localStorage.setItem('q_table', JSON.stringify(QTable));
    }
};

export const updateQValue = (state, action, reward, nextState) => {
    initializeQ(state, ['hit', 'stand', 'doubleDown', 'split']);
    initializeQ(nextState, ['hit', 'stand', 'doubleDown', 'split']);

    // Add to experience memory
    addToMemory({ state, action, reward, nextState });

    // More frequent learning from experiences
    const experiences = sampleFromMemory(batchSize);
    experiences.forEach(exp => {
        if (!QTable[exp.state]) initializeQ(exp.state, ['hit', 'stand', 'doubleDown', 'split']);
        if (!QTable[exp.nextState]) initializeQ(exp.nextState, ['hit', 'stand', 'doubleDown', 'split']);

        const maxNextQ = Math.max(...Object.values(QTable[exp.nextState]));
        const oldQ = QTable[exp.state][exp.action];
        QTable[exp.state][exp.action] = oldQ + alpha * (exp.reward + gamma * maxNextQ - oldQ);
    });

    // Slower epsilon decay
    epsilon = Math.max(minEpsilon, epsilon * epsilonDecay);
};

export const chooseAction = (state) => {
    initializeQ(state, ['hit', 'stand', 'doubleDown', 'split']);

    const playerTotal = parseInt(state.split('-')[0]);
    const dealerCard = parseInt(state.split('-')[1]) || 10;
    const actions = Object.keys(QTable[state]);

    // Strict basic strategy filtering
    const validActions = actions.filter(action => {
        // Always hit on 11 or below
        if (playerTotal <= 11 && action !== 'hit') return false;
        
        // Never hit on 17 or above
        if (playerTotal >= 17 && action === 'hit') return false;
        
        // Consider dealer's upcard for stand decisions
        if (playerTotal >= 12 && playerTotal <= 16) {
            if (dealerCard >= 7 && action === 'stand') return false;
            if (dealerCard <= 6 && action === 'hit') return false;
        }

        // Double down restrictions
        if (action === 'doubleDown') {
            if (playerTotal < 9 || playerTotal > 11) return false;
            if (dealerCard >= 7) return false;
        }

        // Split restrictions
        if (action === 'split' && !state.includes('-1-')) return false;

        return true;
    });

    // More conservative exploration
    if (Math.random() < epsilon) {
        const weights = validActions.map(action => {
            const qValue = QTable[state][action];
            return Math.exp(qValue * 1.5); // Reduced weight factor
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const random = Math.random() * totalWeight;
        let sum = 0;
        for (let i = 0; i < validActions.length; i++) {
            sum += weights[i];
            if (random <= sum) return validActions[i];
        }
        return validActions[0];
    }
    
    // Use best action from valid ones
    return validActions.reduce((best, action) => 
        QTable[state][action] > QTable[state][best] ? action : best
    , validActions[0]);
};

export const getQTable = () => QTable;

export const getExperienceMemorySize = () => experienceMemory.length;
