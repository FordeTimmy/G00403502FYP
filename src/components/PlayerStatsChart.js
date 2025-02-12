import React from 'react';
import { Chart as ChartJS } from 'chart.js/auto';
import { Pie } from 'react-chartjs-2';

const PlayerStatsChart = ({ stats }) => {
    if (!stats || !stats.gamesPlayed) {
        return <p>Not enough data to generate charts.</p>;
    }

    const winRateData = {
        labels: ['Wins', 'Losses'],
        datasets: [{
            data: [stats.handsWon || 0, stats.handsLost || 0],
            backgroundColor: ['#4CAF50', '#f44336']
        }]
    };

    const moneyData = {
        labels: ['Won', 'Lost'],
        datasets: [{
            data: [stats.totalAmountWon || 0, stats.totalAmountLost || 0],
            backgroundColor: ['#2196F3', '#FF9800']
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: 'white'
                }
            }
        }
    };

    return (
        <div className="charts-container">
            <div className="chart-item">
                <h3>Win/Loss Ratio</h3>
                <div style={{ height: '300px', position: 'relative' }}>
                    <Pie data={winRateData} options={options} />
                </div>
            </div>
            <div className="chart-item">
                <h3>Money Won vs Lost</h3>
                <div style={{ height: '300px', position: 'relative' }}>
                    <Pie data={moneyData} options={options} />
                </div>
            </div>
        </div>
    );
};

export default PlayerStatsChart;
