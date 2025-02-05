// src/utils/qLearning.js

// The Q-table: stores states and actions with their corresponding Q-values
const QTable = {};

// Initialize Q-values for a given state and possible actions
export const initializeQ = (state, actions) => {
    if (!QTable[state]) {
        QTable[state] = {};
        for (let action of actions) {
            QTable[state][action] = 0; // Initialize with zero reward
        }
    }
};

// Q-learning update rule: updates the Q-value based on rewards and future state
const alpha = 0.1; // Learning rate
const gamma = 0.9; // Discount factor

const epsilon = 0.1;  // 10% chance to explore random actions

export const updateQValue = (state, action, reward, nextState) => {
    initializeQ(state, ['hit', 'stand', 'doubleDown', 'split']);  // Initialize current state
    initializeQ(nextState, ['hit', 'stand', 'doubleDown', 'split']);  // Initialize next state

    const maxQNextState = Math.max(...Object.values(QTable[nextState]));
    const oldQValue = QTable[state][action];

    // Update the Q-value using the Bellman equation
    QTable[state][action] = oldQValue + alpha * (reward + gamma * maxQNextState - oldQValue);
};

export const chooseAction = (state) => {
    initializeQ(state, ['hit', 'stand', 'doubleDown', 'split']);  // Ensure state is initialized

    if (Math.random() < epsilon) {
        // Explore: Choose a random action
        const actions = ['hit', 'stand', 'doubleDown', 'split'];
        return actions[Math.floor(Math.random() * actions.length)];
    } else {
        // Exploit: Choose action with the highest Q-value
        return Object.keys(QTable[state]).reduce((bestAction, action) => 
            QTable[state][action] > QTable[state][bestAction] ? action : bestAction
        );
    }
};

export const getQTable = () => QTable;  // For debugging, we can print the table to see values
