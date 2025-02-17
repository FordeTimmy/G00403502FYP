import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

// Accelerated learning parameters
let QTable = {};
let epsilon = 0.95;  // Still high exploration but slightly reduced
const epsilonDecay = 0.995;  // Faster decay
const minEpsilon = 0.1;  // Lower minimum for more exploitation
const alpha = 0.05;  // Higher learning rate for faster updates
const gamma = 0.95;  // Slightly reduced to focus more on immediate rewards
const maxMemory = 50000;  // Reduced memory size for faster processing
const batchSize = 32;  // Smaller batch size for faster updates

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

    // Smart action filtering based on state
    const playerTotal = parseInt(state.split('-')[0]);
    const dealerCard = parseInt(state.split('-')[1]) || 10; // Convert face cards to 10
    const actions = Object.keys(QTable[state]);

    // Filter out obviously bad actions
    const validActions = actions.filter(action => {
        if (playerTotal >= 21 && action === 'hit') return false;
        if (playerTotal <= 11 && action === 'stand') return false;
        if (action === 'split' && !state.includes('-1-')) return false;
        return true;
    });

    if (Math.random() < epsilon) {
        // Smart exploration
        return validActions[Math.floor(Math.random() * validActions.length)];
    } else {
        // Exploit best action from valid ones
        return validActions.reduce((best, action) => 
            QTable[state][action] > QTable[state][best] ? action : best
        , validActions[0]);
    }
};

export const getQTable = () => QTable;

export const getExperienceMemorySize = () => experienceMemory.length;
