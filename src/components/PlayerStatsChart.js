import React from 'react';
import { Chart as ChartJS } from 'chart.js/auto';
import { Pie } from 'react-chartjs-2';

const PlayerStatsChart = ({ stats }) => {
    // Early return with message if stats are invalid or all zeros
    if (!stats || (stats.handsWon === 0 && stats.handsLost === 0)) {
        return <p>Play some games to see your statistics!</p>;
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

    // Only render charts if there's actual data
    return (
        <div className="charts-container" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '20px',
            width: '100%',
            maxWidth: '1000px',
            margin: '0 auto'
        }}>
            <div className="stats-summary" style={{
                textAlign: 'center',
                marginBottom: '20px'
            }}>
                <p>Games Played: {stats.gamesPlayed}</p>
                <p>Win Rate: {((stats.handsWon / (stats.handsWon + stats.handsLost)) * 100 || 0).toFixed(1)}%</p>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '40px',
                flexWrap: 'wrap'
            }}>
                <div className="chart-item" style={{ flex: '1', minWidth: '300px', maxWidth: '450px' }}>
                    <h3 style={{ textAlign: 'center' }}>Win/Loss Ratio</h3>
                    <div style={{ height: '300px', position: 'relative' }}>
                        <Pie data={winRateData} options={options} />
                    </div>
                </div>
                <div className="chart-item" style={{ flex: '1', minWidth: '300px', maxWidth: '450px' }}>
                    <h3 style={{ textAlign: 'center' }}>Money Won vs Lost</h3>
                    <div style={{ height: '300px', position: 'relative' }}>
                        <Pie data={moneyData} options={options} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerStatsChart;
