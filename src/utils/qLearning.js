// src/utils/qLearning.js

const QTable = {};
let epsilon = 0.9;
const epsilonDecay = 0.995;
const minEpsilon = 0.1;
const alpha = 0.05;  // Learning rate
const gamma = 0.95;  // Discount factor
const maxMemory = 10000;
let replayMemory = [];

export const initializeQ = (state, actions) => {
    if (!QTable[state]) {
        QTable[state] = {};
        for (let action of actions) {
            QTable[state][action] = 0;
        }
    }
};

const addToReplayMemory = (experience) => {
    replayMemory.push(experience);
    if (replayMemory.length > maxMemory) {
        replayMemory.shift();
    }
};

const sampleReplayMemory = (batchSize = 32) => {
    if (replayMemory.length < batchSize) return replayMemory;
    const samples = [];
    for (let i = 0; i < batchSize; i++) {
        const index = Math.floor(Math.random() * replayMemory.length);
        samples.push(replayMemory[index]);
    }
    return samples;
};

export const updateQValue = (state, action, reward, nextState) => {
    initializeQ(state, ['hit', 'stand', 'doubleDown', 'split']);
    initializeQ(nextState, ['hit', 'stand', 'doubleDown', 'split']);

    // Add experience to replay memory
    addToReplayMemory({ state, action, reward, nextState });

    // Update Q-value using replay memory
    const samples = sampleReplayMemory();
    samples.forEach(exp => {
        const maxQNextState = Math.max(...Object.values(QTable[exp.nextState]));
        const oldQValue = QTable[exp.state][exp.action];
        QTable[exp.state][exp.action] = oldQValue + alpha * (exp.reward + gamma * maxQNextState - oldQValue);
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
