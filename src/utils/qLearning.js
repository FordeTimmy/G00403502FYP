import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

// Further optimized learning parameters for higher win rate
let QTable = {};
let epsilon = 0.99;  // Even higher initial exploration
const epsilonDecay = 0.9999;  // Much slower decay for better learning
const minEpsilon = 0.3;  // Higher minimum to keep exploring good options
const alpha = 0.08;  // Higher learning rate for faster adaptation
const gamma = 0.99;  // Maximum emphasis on future rewards
const maxMemory = 300000;  // Much larger memory for better pattern recognition
const batchSize = 256;  // Larger batch size for better learning

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
        const db = getFirestore();
        if (!auth.currentUser) {
            console.log('No user logged in, initializing new Q-table');
            initializeQTable();
            return;
        }

        const docRef = doc(db, 'users', auth.currentUser.uid, 'training', 'q_table');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            QTable = { ...docSnap.data().QTable };
            console.log('Q-table loaded successfully!');
        } else {
            console.log('No Q-table found, initializing new one');
            initializeQTable();
        }
    } catch (error) {
        console.error('Error loading Q-table:', error);
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

    // Enhanced action filtering
    const playerTotal = parseInt(state.split('-')[0]);
    const dealerCard = parseInt(state.split('-')[1]) || 10;
    const actions = Object.keys(QTable[state]);

    // Smarter action filtering based on basic strategy
    const validActions = actions.filter(action => {
        if (playerTotal >= 21 && action === 'hit') return false;
        if (playerTotal <= 8 && action === 'stand') return false;
        if (playerTotal >= 17 && action === 'hit') return false;
        if (action === 'split' && !state.includes('-1-')) return false;
        if (action === 'doubleDown' && playerTotal < 9) return false;
        if (action === 'doubleDown' && playerTotal > 11) return false;
        return true;
    });

    if (Math.random() < epsilon) {
        // Weighted random exploration
        const weights = validActions.map(action => {
            const qValue = QTable[state][action];
            return Math.exp(qValue); // Use exponential to favor better actions
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const random = Math.random() * totalWeight;
        let sum = 0;
        for (let i = 0; i < validActions.length; i++) {
            sum += weights[i];
            if (random <= sum) return validActions[i];
        }
        return validActions[0];
    } else {
        // Exploit best action
        return validActions.reduce((best, action) => 
            QTable[state][action] > QTable[state][best] ? action : best
        , validActions[0]);
    }
};

export const getQTable = () => QTable;

export const getExperienceMemorySize = () => experienceMemory.length;
