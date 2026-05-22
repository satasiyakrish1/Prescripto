import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Mail, Download, X, Check } from 'lucide-react';

const EventParticipants = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { aToken, handle401Error } = useContext(AdminContext);
    const { backendUrl } = useContext(AppContext);
    
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    useEffect(() => {
        fetchEventDetails();
        fetchParticipants();
    }, [eventId, pagination.page]);
    
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
    
    const fetchParticipants = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${backendUrl}/api/events/admin/${eventId}/participants?page=${pagination.page}&limit=${pagination.limit}`,
                { headers: { aToken } }
            );
            
            setParticipants(response.data.participants || []);
            setPagination(response.data.pagination || {
                page: 1,
                limit: 20,
                total: 0,
                pages: 0
            });
            setError(null);
        } catch (error) {
            console.error('Error fetching participants:', error);
            setParticipants([]);
            setError(error.message || 'Failed to fetch participants');
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to fetch participants');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${backendUrl}/api/events/admin/${eventId}/export`,
                { 
                    headers: { aToken },
                    responseType: 'blob'
                }
            );
            
            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `event-participants-${eventId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Participants exported successfully');
        } catch (error) {
            console.error('Error exporting participants:', error);
            if (!handle401Error(error)) {
                toast.error('Failed to export participants');
            }
        }
    };
    
    const handleSendEmail = async () => {
        const participantIds = selectedParticipants.length > 0 
            ? selectedParticipants 
            : participants.map(p => p._id);
            
        if (participantIds.length === 0) {
            toast.error('No participants selected');
            return;
        }
        
        try {
            await axios.post(
                `${backendUrl}/api/events/admin/${eventId}/email`,
                { participantIds },
                { headers: { aToken } }
            );
            
            toast.success('Email sent successfully');
            setSelectedParticipants([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Error sending email:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to send email');
            }
        }
    };
    
    const handleToggleSelectAll = () => {
        if (selectAll) {
            setSelectedParticipants([]);
        } else {
            setSelectedParticipants(participants.map(p => p._id));
        }
        setSelectAll(!selectAll);
    };
    
    const handleToggleSelect = (participantId) => {
        if (selectedParticipants.includes(participantId)) {
            setSelectedParticipants(selectedParticipants.filter(id => id !== participantId));
        } else {
            setSelectedParticipants([...selectedParticipants, participantId]);
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
    
    const handleUpdateAttendance = async (participantId, attended) => {
        try {
            await axios.put(
                `${backendUrl}/api/events/admin/${eventId}/participants/${participantId}`,
                { attended },
                { headers: { aToken } }
            );
            
            // Update local state
            setParticipants(participants.map(p => 
                p._id === participantId ? { ...p, attended } : p
            ));
            
            toast.success(`Attendance ${attended ? 'confirmed' : 'removed'} successfully`);
        } catch (error) {
            console.error('Error updating attendance:', error);
            if (!handle401Error(error)) {
                toast.error('Failed to update attendance');
            }
        }
    };
    
    // Filtered participants based on search
    const filteredParticipants = participants.filter(p =>
        p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (loading && !event) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button 
                        onClick={() => navigate('/event-management')} 
                        className="mr-4 p-2 rounded-full hover:bg-gray-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-bold">
                        {event ? event.title : 'Event'} Participants
                    </h2>
                </div>
                
                <div className="flex space-x-2">
                    <button
                        onClick={handleSendEmail}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center gap-2"
                        disabled={loading}
                    >
                        <Mail size={16} />
                        Send Email
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                        disabled={loading}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>
            
            {event && (
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Event Date</p>
                            <p className="font-medium">{formatDate(event.date)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">
                                {event.locationType === 'online' ? 'Online Event' : event.location}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">RSVPs</p>
                            <p className="font-medium">
                                {event.rsvpCount || 0} / {event.rsvpLimit > 0 ? event.rsvpLimit : '∞'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="mb-4 flex justify-end">
                <input
                    type="text"
                    placeholder="Search participant name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Participants</h3>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="selectAll"
                            checked={selectAll}
                            onChange={handleToggleSelectAll}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                            Select All
                        </label>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                    <span className="sr-only">Select</span>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    RSVP Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Attended
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredParticipants.length > 0 ? (
                                filteredParticipants.map((participant) => (
                                    <tr key={participant._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedParticipants.includes(participant._id)}
                                                onChange={() => handleToggleSelect(participant._id)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {participant.name || 'Anonymous'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {participant.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {formatDate(participant.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {event?.eventType === 'paid' ? (
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${participant.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {participant.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    N/A
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${participant.attended ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {participant.attended ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {participant.attended ? (
                                                    <button
                                                        onClick={() => handleUpdateAttendance(participant._id, false)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Mark as Not Attended"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateAttendance(participant._id, true)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Mark as Attended"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                        {error ? `Error: ${error}` : 'No participants found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                                disabled={pagination.page === 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.pages) }))}
                                disabled={pagination.page === pagination.pages}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === pagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                                    <span className="font-medium">{pagination.total}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                                        disabled={pagination.page === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <span className="sr-only">First</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                            <path fillRule="evenodd" d="M7.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L3.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                                        disabled={pagination.page === 1}
                                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    
                                    {/* Page numbers */}
                                    {[...Array(pagination.pages)].map((_, i) => {
                                        const pageNumber = i + 1;
                                        // Show current page, first, last, and pages around current
                                        if (
                                            pageNumber === 1 ||
                                            pageNumber === pagination.pages ||
                                            (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                                                    className={`relative inline-flex items-center px-4 py-2 border ${pagination.page === pageNumber ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} text-sm font-medium`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        } else if (
                                            pageNumber === pagination.page - 2 ||
                                            pageNumber === pagination.page + 2
                                        ) {
                                            return (
                                                <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                    ...
                                                </span>
                                            );
                                        }
                                        return null;
                                    })}
                                    
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.pages) }))}
                                        disabled={pagination.page === pagination.pages}
                                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${pagination.page === pagination.pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.pages }))}
                                        disabled={pagination.page === pagination.pages}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${pagination.page === pagination.pages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <span className="sr-only">Last</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
                                            <path fillRule="evenodd" d="M12.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L16.586 10l-4.293 4.293a1 1 0 000 1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventParticipants;