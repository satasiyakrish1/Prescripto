import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/constants';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';

const TestimonialManagement = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalTestimonials, setTotalTestimonials] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        rating: '',
        sort: '-createdAt'
    });
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
                sort: filters.sort,
                ...filters.search && { search: filters.search },
                ...filters.status && { status: filters.status },
                ...filters.rating && { rating: filters.rating }
            });

            const response = await axios.get(`${API_URL}/api/testimonials/all?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('aToken')}`
                }
            });

            setTestimonials(response.data.data);
            setTotalTestimonials(response.data.total);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            toast.error('Failed to fetch testimonials');
            setLoading(false);
        }
    };

    const debouncedFetch = debounce(fetchTestimonials, 300);

    useEffect(() => {
        debouncedFetch();
        return () => debouncedFetch.cancel();
    }, [currentPage, filters]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalTestimonials / itemsPerPage);

    const handleStatusUpdate = async (testimonialId, status) => {
        try {
            await axios.put(
                `${API_URL}/api/testimonials/${testimonialId}/status`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('aToken')}`
                    }
                }
            );
            toast.success(`Testimonial ${status} successfully`);
            fetchTestimonials();
        } catch (error) {
            console.error('Error updating testimonial status:', error);
            toast.error('Failed to update testimonial status');
        }
    };

    const handleDelete = async (testimonialId) => {
        if (!window.confirm('Are you sure you want to delete this testimonial?')) return;

        try {
            await axios.delete(`${API_URL}/api/testimonials/${testimonialId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('aToken')}`
                }
            });
            toast.success('Testimonial deleted successfully');
            fetchTestimonials();
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            toast.error('Failed to delete testimonial');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Testimonial Management</h2>
            
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Search testimonials..."
                    className="border rounded-md p-2"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                />
                <select
                    className="border rounded-md p-2"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
                <select
                    className="border rounded-md p-2"
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                >
                    <option value="">All Ratings</option>
                    {[5, 4, 3, 2, 1].map(rating => (
                        <option key={rating} value={rating}>{rating} Stars</option>
                    ))}
                </select>
                <select
                    className="border rounded-md p-2"
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                    <option value="-createdAt">Newest First</option>
                    <option value="createdAt">Oldest First</option>
                    <option value="-rating">Highest Rating</option>
                    <option value="rating">Lowest Rating</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {testimonials.map((testimonial) => (
                            <tr key={testimonial._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{testimonial.patientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{testimonial.doctor?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{testimonial.rating} ⭐</td>
                                <td className="px-6 py-4">
                                    <div className="max-w-xs overflow-hidden text-ellipsis">{testimonial.content}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        testimonial.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        testimonial.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {testimonial.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {testimonial.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(testimonial._id, 'approved')}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(testimonial._id, 'rejected')}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(testimonial._id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Showing {testimonials.length} of {totalTestimonials} testimonials
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-200' : 'bg-primary text-white hover:bg-primary-600'}`}
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-200' : 'bg-primary text-white hover:bg-primary-600'}`}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestimonialManagement;