import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  Edit3,
  Trash2,
  Eye,
  Download,
  CalendarDays
} from 'lucide-react';

const EventManagement = () => {
    const { aToken, handle401Error } = useContext(AdminContext);
    const { backendUrl } = useContext(AppContext);
    const { darkMode } = useTheme();
    
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchEvents();
    }, [statusFilter]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${backendUrl}/api/events/admin${statusFilter ? `?status=${statusFilter}` : ''}`,
                { headers: { aToken } }
            );
            setEvents(response.data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            if (!handle401Error(error)) {
                toast.error('Failed to fetch events');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        
        try {
            await axios.delete(`${backendUrl}/api/events/admin/${eventId}`, { headers: { aToken } });
            toast.success('Event deleted successfully');
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            if (!handle401Error(error)) {
                toast.error('Failed to delete event');
            }
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming':
                return darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800';
            case 'ongoing':
                return darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800';
            case 'completed':
                return darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-800';
            case 'cancelled':
                return darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800';
            default:
                return darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-800';
        }
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
            {/* Minimalistic Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-lg`}>
                            <CalendarDays className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <div>
                            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Event Management
                            </h1>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Create and manage hospital events
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => toast.info('Create event feature coming soon')}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Event</span>
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                            darkMode 
                                ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                    />
                </div>
                <div className="relative">
                    <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`pl-10 pr-8 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
                            darkMode 
                                ? 'bg-gray-800 border-gray-600 text-gray-200' 
                                : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    >
                        <option value="">All Events</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} p-12 text-center`}>
                    <CalendarDays className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        No events found
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {searchTerm ? 'Try adjusting your search criteria' : 'Create your first event to get started'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                        <div key={event._id} className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} p-6 hover:shadow-lg transition-all duration-200`}>
                            {/* Event Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className={`font-semibold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {event.title}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Event Details */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center space-x-2 text-sm">
                                    <Calendar className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        {formatDate(event.date)}
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-sm">
                                    <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        {event.duration} minutes
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-sm">
                                    <MapPin className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        {event.locationType === 'online' ? 'Online Event' : event.location}
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-sm">
                                    <Users className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        {event.rsvpCount || 0} / {event.rsvpLimit > 0 ? event.rsvpLimit : '∞'} attendees
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-sm">
                                    <DollarSign className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        {event.eventType === 'paid' ? `₹${event.price}` : 'Free'}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {event.description}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => toast.info('Edit feature coming soon')}
                                    className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                        darkMode 
                                            ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' 
                                            : ' #5f6FFF text-blue-600 hover:bg-blue-100'
                                    }`}
                                >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => toast.info('View participants feature coming soon')}
                                    className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                        darkMode 
                                            ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' 
                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                    }`}
                                >
                                    <Eye className="w-3 h-3" />
                                    <span>View</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(event._id)}
                                    className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                        darkMode 
                                            ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' 
                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventManagement;