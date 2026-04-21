import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Clock, MapPin, Globe } from 'lucide-react';

const TIMEZONES = [
    { country: 'USA', city: 'New York', timezone: 'America/New_York', flag: '🇺🇸' },
    { country: 'Russia', city: 'Moscow', timezone: 'Europe/Moscow', flag: '🇷🇺' },
    { country: 'India', city: 'Mumbai', timezone: 'Asia/Kolkata', flag: '🇮🇳' },
    { country: 'UK', city: 'London', timezone: 'Europe/London', flag: '🇬🇧' },
    { country: 'Japan', city: 'Tokyo', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
    { country: 'Australia', city: 'Sydney', timezone: 'Australia/Sydney', flag: '🇦🇺' },
    { country: 'Germany', city: 'Berlin', timezone: 'Europe/Berlin', flag: '🇩🇪' },
    { country: 'China', city: 'Beijing', timezone: 'Asia/Shanghai', flag: '🇨🇳' },
    { country: 'Brazil', city: 'São Paulo', timezone: 'America/Sao_Paulo', flag: '🇧🇷' },
    { country: 'UAE', city: 'Dubai', timezone: 'Asia/Dubai', flag: '🇦🇪' },
    { country: 'Singapore', city: 'Singapore', timezone: 'Asia/Singapore', flag: '🇸🇬' },
    { country: 'Canada', city: 'Toronto', timezone: 'America/Toronto', flag: '🇨🇦' }
];

const WorldClock = () => {
    const { darkMode } = useTheme();
    const [selectedTimezones, setSelectedTimezones] = useState([
        TIMEZONES[0], // USA
        TIMEZONES[1], // Russia
        TIMEZONES[2]  // India
    ]);
    const [times, setTimes] = useState(['', '', '']);
    const [showSelector, setShowSelector] = useState(null);

    useEffect(() => {
        const updateTimes = () => {
            const newTimes = selectedTimezones.map(tz => {
                const date = new Date();
                return date.toLocaleTimeString('en-US', {
                    timeZone: tz.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
            });
            setTimes(newTimes);
        };

        updateTimes();
        const interval = setInterval(updateTimes, 1000);
        return () => clearInterval(interval);
    }, [selectedTimezones]);

    const handleTimezoneChange = (index, newTimezone) => {
        const newSelected = [...selectedTimezones];
        newSelected[index] = newTimezone;
        setSelectedTimezones(newSelected);
        setShowSelector(null);
    };

    const getDate = (timezone) => {
        const date = new Date();
        return date.toLocaleDateString('en-US', {
            timeZone: timezone,
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
        >
            <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                        <Globe className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            World Clock
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Live time across different zones
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedTimezones.map((tz, index) => (
                        <div
                            key={index}
                            className={`relative p-5 rounded-xl border ${darkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'} hover:shadow-md transition-all duration-300`}
                        >
                            {/* Country Selector */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setShowSelector(showSelector === index ? null : index)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-white'}`}
                                >
                                    <span className="text-2xl">{tz.flag}</span>
                                    <div className="text-left">
                                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {tz.country}
                                        </p>
                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                                            <MapPin size={10} />
                                            {tz.city}
                                        </p>
                                    </div>
                                </button>
                            </div>

                            {/* Dropdown Selector */}
                            {showSelector === index && (
                                <div className={`absolute top-16 left-0 right-0 mx-2 z-10 max-h-48 overflow-y-auto rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl`}>
                                    {TIMEZONES.map((timezone, tzIndex) => (
                                        <button
                                            key={tzIndex}
                                            onClick={() => handleTimezoneChange(index, timezone)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${selectedTimezones[index].country === timezone.country ? (darkMode ? 'bg-gray-700/50' : 'bg-indigo-50') : ''}`}
                                        >
                                            <span className="text-xl">{timezone.flag}</span>
                                            <div>
                                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                    {timezone.country}
                                                </p>
                                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {timezone.city}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Time Display */}
                            <div className="text-center">
                                <div className={`flex items-center justify-center gap-2 mb-2`}>
                                    <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {getDate(tz.timezone)}
                                    </p>
                                </div>
                                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} font-mono tracking-tight`}>
                                    {times[index] || '00:00:00'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default WorldClock;
