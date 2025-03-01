const Settings = () => {
    const { volume, updateVolume } = useSettings();

    const handleVolumeChange = (e) => {
        const newVolume = parseInt(e.target.value);
        updateVolume(newVolume);
        
        // Update any active audio elements
        const gameAudio = document.querySelector('.casino-table audio');
        if (gameAudio) {
            gameAudio.volume = newVolume / 100;
        }
    };

    return (
        <div className="settings-content">
            <div className="setting-item">
                <label>Music Volume</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                />
                <span>{volume}%</span>
            </div>
            {/* ...rest of settings... */}
        </div>
    );
};
