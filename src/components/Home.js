import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <h1>Casino Blackjack</h1>
            <div className="button-container">
                <button onClick={() => navigate('/game')} className="start-button">
                    Start Game
                </button>
            </div>
        </div>
    );
};

export default Home;
