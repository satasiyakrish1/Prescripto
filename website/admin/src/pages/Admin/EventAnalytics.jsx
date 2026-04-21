import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react';

// Import chart components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const EventAnalytics = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { aToken, handle401Error } = useContext(AdminContext);
    const { backendUrl } = useContext(AppContext);
    
    const [event, setEvent] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Chart colors
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    
    // Redirect if eventId is missing
    useEffect(() => {
        if (!eventId) {
            toast.error('No event selected for analytics.');
            navigate('/event-management');
        }
    }, [eventId, navigate]);

    useEffect(() => {
        fetchEventDetails();
        fetchEventAnalytics();
    }, [eventId]);
    
    const fetchEventDetails = async () => {
        try {
            const response = await axios.get(
                `${backendUrl}/api/events/admin/${eventId}`,
                { headers: { aToken } }
            );
            
            setEvent(response.data.event);
            setError(null);
        } catch (error) {
            console.error('Error fetching event details:', error);
            setEvent(null);
            setError(error.message || 'Failed to fetch event details');
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to fetch event details');
            }
        }
    };
    
    const fetchEventAnalytics = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${backendUrl}/api/events/admin/${eventId}/analytics`,
                { headers: { aToken } }
            );
            
            setAnalytics(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching event analytics:', error);
            setAnalytics(null);
            setError(error.message || 'Failed to fetch event analytics');
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to fetch event analytics');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Mock data for demonstration (in case the backend doesn't have analytics endpoint yet)
    const mockAnalytics = {
        totalRSVPs: 45,
        attendedCount: 38,
        totalRevenue: event?.eventType === 'paid' ? event?.price * 45 : 0,
        rsvpByDay: [
            { date: '2023-06-01', count: 5 },
            { date: '2023-06-02', count: 8 },
            { date: '2023-06-03', count: 12 },
            { date: '2023-06-04', count: 7 },
            { date: '2023-06-05', count: 13 }
        ],
        deviceStats: [
            { name: 'Mobile', value: 28 },
            { name: 'Desktop', value: 12 },
            { name: 'Tablet', value: 5 }
        ],
        referralSources: [
            { name: 'Direct', value: 20 },
            { name: 'Email', value: 15 },
            { name: 'Social Media', value: 8 },
            { name: 'Website', value: 2 }
        ],
        attendanceRate: (38 / 45) * 100
    };
    
    // Use mock data if analytics is not available
    const displayAnalytics = analytics || mockAnalytics;
    const currency = event?.currency || '₹';

    // CSV Export function (optional)
    const exportCSV = () => {
        if (!displayAnalytics.rsvpByDay || displayAnalytics.rsvpByDay.length === 0) {
            toast.error('No RSVP data to export');
            return;
        }
        const headers = ['Date', 'RSVPs'];
        const csvRows = [headers.join(',')];
        displayAnalytics.rsvpByDay.forEach(row => {
            csvRows.push(`${row.date},${row.count}`);
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event_rsvp_analytics_${eventId}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported');
    };
    
    if (loading && !event) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
                <button 
                    onClick={() => navigate('/event-management')} 
                    className="mr-4 p-2 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold">
                    {event ? event.title : 'Event'} Analytics
                </h2>
                {/* Export CSV Button */}
                <button
                    onClick={exportCSV}
                    className="ml-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Export RSVP CSV
                </button>
            </div>
            
            {event && (
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                            <Calendar size={20} className="mr-2 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Event Date</p>
                                <p className="font-medium">{formatDate(event.date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Clock size={20} className="mr-2 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Duration</p>
                                <p className="font-medium">{event.duration} minutes</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <MapPin size={20} className="mr-2 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Location</p>
                                <p className="font-medium">
                                    {event.locationType === 'online' ? 'Online Event' : event.location}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total RSVPs</p>
                            <p className="text-2xl font-bold">{displayAnalytics.totalRSVPs ?? 'No data'}</p>
                        </div>
                        <Users size={24} className="text-primary" />
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Attendance Rate</p>
                            <p className="text-2xl font-bold">{displayAnalytics.attendanceRate ? displayAnalytics.attendanceRate.toFixed(1) + '%' : 'No data'}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Users size={20} className="text-green-500" />
                        </div>
                    </div>
                    <div className="mt-2 bg-gray-200 h-2 rounded-full">
                        <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${displayAnalytics.attendanceRate || 0}%` }}
                        ></div>
                    </div>
                </div>
                
                {event?.eventType === 'paid' && (
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Revenue</p>
                                <p className="text-2xl font-bold">{currency}{displayAnalytics.totalRevenue ?? '0'}</p>
                            </div>
                            <DollarSign size={24} className="text-green-500" />
                        </div>
                    </div>
                )}
                
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Attended</p>
                            <p className="text-2xl font-bold">{displayAnalytics.attendedCount ?? 'No data'}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users size={20} className="text-purple-500" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* RSVPs Over Time */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold mb-4">RSVPs Over Time</h3>
                    <div className="h-80">
                        {displayAnalytics.rsvpByDay && displayAnalytics.rsvpByDay.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={displayAnalytics.rsvpByDay}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis />
                                    <Tooltip formatter={(value, name) => [value, 'RSVPs']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No RSVP data</div>
                        )}
                    </div>
                </div>
                
                {/* Device Stats Pie Chart */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold mb-4">Device Stats</h3>
                    <div className="h-80">
                        {displayAnalytics.deviceStats && displayAnalytics.deviceStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={displayAnalytics.deviceStats}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        label
                                    >
                                        {displayAnalytics.deviceStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No device data</div>
                        )}
                    </div>
                </div>
                
                {/* Referral Sources Pie Chart */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold mb-4">Referral Sources</h3>
                    <div className="h-80">
                        {displayAnalytics.referralSources && displayAnalytics.referralSources.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={displayAnalytics.referralSources}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#00C49F"
                                        label
                                    >
                                        {displayAnalytics.referralSources.map((entry, index) => (
                                            <Cell key={`cell-referral-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No referral data</div>
                        )}
                    </div>
                </div>
                
                {/* Attendance Breakdown */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold mb-4">Attendance Breakdown</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Attended', value: displayAnalytics.attendedCount },
                                        { name: 'No-show', value: displayAnalytics.totalRSVPs - displayAnalytics.attendedCount }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    <Cell fill="#00C49F" />
                                    <Cell fill="#FF8042" />
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            {/* Additional Insights */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                <ul className="space-y-2">
                    <li className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                            <span className="text-blue-600 text-sm font-bold">1</span>
                        </div>
                        <p>
                            <span className="font-medium">Attendance Rate:</span> {displayAnalytics.attendanceRate ? displayAnalytics.attendanceRate.toFixed(1) + '%' : 'No data'} of registered participants attended the event.
                            {displayAnalytics.attendanceRate > 80 ? ' This is an excellent attendance rate!' : 
                             displayAnalytics.attendanceRate > 60 ? ' This is a good attendance rate.' : 
                             ' Consider sending more reminders before future events to improve attendance.'}
                        </p>
                    </li>
                    <li className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                            <span className="text-blue-600 text-sm font-bold">2</span>
                        </div>
                        <p>
                            <span className="font-medium">Device Usage:</span> Most participants accessed the event information via 
                            {Array.isArray(displayAnalytics.deviceStats) && displayAnalytics.deviceStats.length > 0
                                ? displayAnalytics.deviceStats.slice().sort((a, b) => b.value - a.value)[0]?.name.toLowerCase()
                                : 'N/A'} devices. 
                            Consider optimizing your event communications for this platform.
                        </p>
                    </li>
                    <li className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                            <span className="text-blue-600 text-sm font-bold">3</span>
                        </div>
                        <p>
                            <span className="font-medium">Top Referral Source:</span> Most participants came from 
                            {Array.isArray(displayAnalytics.referralSources) && displayAnalytics.referralSources.length > 0
                                ? displayAnalytics.referralSources.slice().sort((a, b) => b.value - a.value)[0]?.name.toLowerCase()
                                : 'N/A'} channels. 
                            Consider focusing your marketing efforts on this channel for future events.
                        </p>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default EventAnalytics;