import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// src/utils/qLearning.js

let QTable = {};
let epsilon = 0.9;
const epsilonDecay = 0.995;
const minEpsilon = 0.1;
const alpha = 0.05;  // Learning rate
const gamma = 0.95;  // Discount factor
const maxMemory = 10000;
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

export const loadQTable = async () => {
    try {
        const db = getFirestore();
        const docSnap = await getDoc(doc(db, 'ai_training', 'q_table'));
        if (docSnap.exists()) {
            QTable = docSnap.data().QTable;
            console.log('Q-table loaded successfully!');
            // Adjust learning parameters after loading
            epsilon = 0.5; // Reduce exploration
            alpha = 0.02; // Fine-tune learning
        }
    } catch (error) {
        console.error('Error loading Q-table:', error);
    }
};

export const saveQTable = async () => {
    try {
        const db = getFirestore();
        await setDoc(doc(db, 'ai_training', 'q_table'), { 
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
