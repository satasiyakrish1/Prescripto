import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

const AppointmentStatusDistribution = ({ data = [] }) => {
    const { darkMode } = useTheme();

    const statusData = useMemo(() => {
        const statusCount = {
            completed: 0,
            cancelled: 0,
            pending: 0,
            upcoming: 0
        };

        data.forEach(appointment => {
            if (appointment.cancelled) {
                statusCount.cancelled++;
            } else if (appointment.isCompleted) {
                statusCount.completed++;
            } else {
                const appointmentDate = new Date(appointment.slotDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (appointmentDate >= today) {
                    statusCount.upcoming++;
                } else {
                    statusCount.pending++;
                }
            }
        });

        return [
            {
                name: 'Completed',
                value: statusCount.completed,
                color: darkMode ? '#34D399' : '#10B981',
                icon: CheckCircle
            },
            {
                name: 'Upcoming',
                value: statusCount.upcoming,
                color: darkMode ? '#60A5FA' : '#3B82F6',
                icon: Calendar
            },
            {
                name: 'Pending',
                value: statusCount.pending,
                color: darkMode ? '#FBBF24' : '#F59E0B',
                icon: Clock
            },
            {
                name: 'Cancelled',
                value: statusCount.cancelled,
                color: darkMode ? '#F87171' : '#EF4444',
                icon: XCircle
            }
        ].filter(item => item.value > 0);
    }, [data, darkMode]);

    const total = statusData.reduce((sum, item) => sum + item.value, 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percentage = ((data.value / total) * 100).toFixed(1);
            return (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-1`}>
                        {data.name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {data.value} appointments ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300`}
        >
            <div className={`flex items-center justify-between px-6 py-5 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
                <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Appointment Status
                    </h3>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Distribution overview
                    </p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    <p className="text-xs font-medium">Total: {total}</p>
                </div>
            </div>

            <div className="p-6">
                {statusData.length > 0 ? (
                    <>
                        <div className="h-[200px] mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={1000}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Status Legend */}
                        <div className="grid grid-cols-2 gap-3">
                            {statusData.map((item, index) => {
                                const Icon = item.icon;
                                const percentage = ((item.value / total) * 100).toFixed(1);
                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                                    >
                                        <div
                                            className="p-2 rounded-lg"
                                            style={{ backgroundColor: `${item.color}20` }}
                                        >
                                            <Icon
                                                size={16}
                                                style={{ color: item.color }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {item.name}
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {item.value}
                                                </p>
                                                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {percentage}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className={`py-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No appointment data available</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AppointmentStatusDistribution;
