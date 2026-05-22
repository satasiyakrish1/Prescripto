import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { ChevronDown, Globe2 } from 'lucide-react';

const TIMEZONES = [
    { country: 'USA', city: 'New York', timezone: 'America/New_York', code: 'US' },
    { country: 'Russia', city: 'Moscow', timezone: 'Europe/Moscow', code: 'RU' },
    { country: 'India', city: 'Mumbai', timezone: 'Asia/Kolkata', code: 'IN' },
    { country: 'UK', city: 'London', timezone: 'Europe/London', code: 'GB' },
    { country: 'Japan', city: 'Tokyo', timezone: 'Asia/Tokyo', code: 'JP' },
    { country: 'Australia', city: 'Sydney', timezone: 'Australia/Sydney', code: 'AU' },
    { country: 'Germany', city: 'Berlin', timezone: 'Europe/Berlin', code: 'DE' },
    { country: 'China', city: 'Beijing', timezone: 'Asia/Shanghai', code: 'CN' },
    { country: 'Brazil', city: 'São Paulo', timezone: 'America/Sao_Paulo', code: 'BR' },
    { country: 'UAE', city: 'Dubai', timezone: 'Asia/Dubai', code: 'AE' },
    { country: 'Singapore', city: 'Singapore', timezone: 'Asia/Singapore', code: 'SG' },
    { country: 'Canada', city: 'Toronto', timezone: 'America/Toronto', code: 'CA' }
];

const WorldClockPage = () => {
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
                    hour12: false
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

    // Premium dotted background
    const dottedPattern = darkMode
        ? 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 1px, transparent 1px)'
        : 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 1px, transparent 1px)';

    return (
        <div className="relative w-full" style={{ height: 'calc(100vh - 80px)' }}>
            <div
                className={`absolute inset-0 ${darkMode ? 'bg-gray-950' : 'bg-white'} overflow-hidden flex items-center justify-center`}
                style={{
                    backgroundImage: dottedPattern,
                    backgroundSize: '32px 32px'
                }}
            >
                <div className="w-full max-w-3xl px-4">

                    {/* Compact Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center mb-2"
                    >
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <div className={`p-1 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} backdrop-blur-sm`}>
                                <Globe2 className={`w-3.5 h-3.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} strokeWidth={1.5} />
                            </div>
                        </div>
                        <h1 className={`text-base font-light tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>
                            Welcome Back
                        </h1>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-light`}>
                            Track time across global locations
                        </p>
                    </motion.div>

                    {/* Compact Clock Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {selectedTimezones.map((tz, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.6,
                                    delay: index * 0.1,
                                    ease: [0.22, 1, 0.36, 1]
                                }}
                                className="relative group"
                            >
                                {/* Compact Card */}
                                <div className={`
                  ${darkMode ? 'bg-gray-900/50' : 'bg-white'} 
                  backdrop-blur-xl 
                  rounded-lg 
                  p-2.5 
                  border 
                  ${darkMode ? 'border-gray-800/50' : 'border-gray-200/80'}
                  shadow-lg
                  hover:shadow-xl
                  transition-all 
                  duration-500
                  ${darkMode ? 'hover:border-indigo-500/30' : 'hover:border-indigo-300/50'}
                `}>

                                    {/* Country Selector */}
                                    <button
                                        onClick={() => setShowSelector(showSelector === index ? null : index)}
                                        className="w-full flex items-center justify-between mb-2 group/btn"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="relative">
                                                <img
                                                    src={`https://flagcdn.com/w80/${tz.code.toLowerCase()}.png`}
                                                    alt={tz.country}
                                                    className="w-6 h-4 object-cover rounded shadow-sm"
                                                />
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {tz.country}
                                                </p>
                                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-light`}>
                                                    {tz.city}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            size={12}
                                            className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} group-hover/btn:text-indigo-500 transition-all duration-300 ${showSelector === index ? 'rotate-180' : ''}`}
                                            strokeWidth={1.5}
                                        />
                                    </button>

                                    {/* Premium Dropdown */}
                                    {showSelector === index && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={`
                        absolute top-11 left-0 right-0 z-50 
                        max-h-40 overflow-y-auto 
                        rounded-lg 
                        border 
                        ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
                        shadow-2xl
                        backdrop-blur-xl
                      `}
                                        >
                                            {TIMEZONES.map((timezone, tzIndex) => (
                                                <button
                                                    key={tzIndex}
                                                    onClick={() => handleTimezoneChange(index, timezone)}
                                                    className={`
                            w-full flex items-center gap-1.5 px-2 py-1 text-left 
                            transition-all duration-200
                            ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}
                            ${selectedTimezones[index].country === timezone.country
                                                            ? (darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50')
                                                            : ''
                                                        }
                          `}
                                                >
                                                    <img
                                                        src={`https://flagcdn.com/w40/${timezone.code.toLowerCase()}.png`}
                                                        alt={timezone.country}
                                                        className="w-5 h-3.5 object-cover rounded shadow-sm"
                                                    />
                                                    <div>
                                                        <p className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                            {timezone.country}
                                                        </p>
                                                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {timezone.city}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* Date */}
                                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1.5 font-light`}>
                                        {getDate(tz.timezone)}
                                    </div>

                                    {/* Compact Time Display */}
                                    <div className="relative">
                                        <div className={`text-lg font-light ${darkMode ? 'text-white' : 'text-gray-900'} font-mono tracking-tight tabular-nums`}>
                                            {times[index] || '00:00:00'}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Compact Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mt-2 text-center"
                    >
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} font-light`}>
                            Click any location to change timezone
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default WorldClockPage;
