import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

// Change from const to let for the QTable
let QTable = {};
// Adjust hyperparameters for better learning
let epsilon = 0.7;  // Start with moderate exploration
const epsilonDecay = 0.998;  // Faster decay
const minEpsilon = 0.1;  // Minimum exploration rate
const alpha = 0.01;  // Slower, more stable learning
const gamma = 0.99;  // Focus on long-term rewards
const maxMemory = 20000;
let experienceMemory = [];

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

const sampleFromMemory = (batchSize = 32) => {
    if (experienceMemory.length < batchSize) return experienceMemory;
    const samples = [];
    for (let i = 0; i < batchSize; i++) {
        const index = Math.floor(Math.random() * experienceMemory.length);
        samples.push(experienceMemory[index]);
    }
    return samples;
};

export const initializeQTable = () => {
    QTable = {}; // Reset Q-table
    console.log('Q-table initialized');
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

    // Learn from batch of experiences
    const experiences = sampleFromMemory();
    experiences.forEach(exp => {
        if (!QTable[exp.state]) initializeQ(exp.state, ['hit', 'stand', 'doubleDown', 'split']);
        if (!QTable[exp.nextState]) initializeQ(exp.nextState, ['hit', 'stand', 'doubleDown', 'split']);

        const maxNextQ = Math.max(...Object.values(QTable[exp.nextState]));
        const oldQ = QTable[exp.state][exp.action];
        QTable[exp.state][exp.action] = oldQ + alpha * (exp.reward + gamma * maxNextQ - oldQ);
    });

    // Decay epsilon
    epsilon = Math.max(minEpsilon, epsilon * epsilonDecay);
};

export const chooseAction = (state) => {
    initializeQ(state, ['hit', 'stand', 'doubleDown', 'split']);

    if (Math.random() < epsilon) {
        // Explore: Choose random action
        const actions = Object.keys(QTable[state]);
        return actions[Math.floor(Math.random() * actions.length)];
    } else {
        // Exploit: Choose best action
        return Object.entries(QTable[state]).reduce((best, [action, value]) => 
            value > QTable[state][best] ? action : best
        , Object.keys(QTable[state])[0]);
    }
};

export const getQTable = () => QTable;
