import React, { createContext, useState, useContext } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [volume, setVolume] = useState(50);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
    const updateVolume = (newVolume) => setVolume(newVolume);

    return (
        <SettingsContext.Provider value={{ volume, isDarkMode, toggleDarkMode, updateVolume }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
