import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
    Star, 
    Send, 
    User, 
    Calendar, 
    Filter, 
    Search,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Award,
    TrendingUp,
    RefreshCw
} from 'lucide-react';

const Testimonials = () => {
    const navigate = useNavigate();
    const { doctorId } = useParams();
    const { backendUrl, token, doctors } = useContext(AppContext);
    
    const [activeTab, setActiveTab] = useState(doctorId ? 'write' : 'view'); // 'view' or 'write'
    const [testimonials, setTestimonials] = useState([]);
    const [myTestimonials, setMyTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(doctorId || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    
    // Form state
    const [formData, setFormData] = useState({
        doctorId: doctorId || '',
        content: '',
        rating: 5
    });
    const [submitting, setSubmitting] = useState(false);

    // Update form when doctorId from URL changes
    useEffect(() => {
        if (doctorId) {
            setFormData(prev => ({ ...prev, doctorId }));
            setSelectedDoctor(doctorId);
            setActiveTab('write');
        }
    }, [doctorId]);

    // Fetch testimonials for selected doctor
    const fetchTestimonials = async (page = 1) => {
        if (!selectedDoctor) return;
        
        try {
            setLoading(true);
            const { data } = await axios.get(
                `${backendUrl}/api/testimonials/doctor/${selectedDoctor}?page=${page}&limit=6`
            );
            
            if (data.success) {
                setTestimonials(data.data);
                setTotalPages(data.totalPages);
                setAverageRating(data.averageRating);
                setTotalReviews(data.totalReviews);
            }
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            toast.error('Failed to load testimonials');
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's own testimonials
    const fetchMyTestimonials = async () => {
        if (!token) {
            console.log('No token available for fetching testimonials');
            return;
        }
        
        try {
            console.log('Fetching user testimonials...');
            const { data } = await axios.get(
                `${backendUrl}/api/testimonials/user/my-testimonials`,
                { headers: { token } }
            );
            
            console.log('My testimonials response:', data);
            
            if (data.success) {
                setMyTestimonials(data.data || []);
                console.log('Loaded testimonials:', data.data?.length || 0);
            } else {
                console.error('Failed to fetch testimonials:', data.message);
                toast.error(data.message || 'Failed to load your reviews');
            }
        } catch (error) {
            console.error('Error fetching my testimonials:', error);
            toast.error('Failed to load your reviews');
        }
    };

    useEffect(() => {
        if (selectedDoctor) {
            fetchTestimonials(currentPage);
        }
    }, [selectedDoctor, currentPage]);

    useEffect(() => {
        if (token) {
            fetchMyTestimonials();
        }
    }, [token]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            toast.error('Please login to submit a review');
            navigate('/login');
            return;
        }

        if (!formData.doctorId) {
            toast.error('Please select a doctor');
            return;
        }

        if (formData.content.trim().length < 10) {
            toast.error('Review must be at least 10 characters long');
            return;
        }

        try {
            setSubmitting(true);
            const { data } = await axios.post(
                `${backendUrl}/api/testimonials/submit`,
                formData,
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Review submitted successfully! It will be visible after admin approval.');
                setFormData({
                    doctorId: '',
                    content: '',
                    rating: 5
                });
                // Refresh the user's testimonials list
                await fetchMyTestimonials();
                // Stay on write tab to show the new review in "My Reviews" section
                // User can see their review status immediately
            }
        } catch (error) {
            console.error('Error submitting testimonial:', error);
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    // Star rating component
    const StarRating = ({ rating, onRatingChange, readonly = false }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={24}
                        className={`${
                            star <= rating 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                        } ${!readonly && 'cursor-pointer hover:scale-110 transition-transform'}`}
                        onClick={() => !readonly && onRatingChange && onRatingChange(star)}
                    />
                ))}
            </div>
        );
    };

    // Filter doctors based on search
    const filteredDoctors = doctors?.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.speciality.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Get doctor info
    const getDoctorInfo = (docId) => {
        return doctors?.find(doc => doc._id === docId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Patient Testimonials
                    </h1>
                    <p className="text-lg text-gray-600">
                        Share your experience and help others make informed decisions
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
                        <button
                            onClick={() => setActiveTab('view')}
                            className={`px-6 py-3 rounded-md font-medium transition-all ${
                                activeTab === 'view'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <MessageSquare className="inline-block mr-2" size={20} />
                            View All Reviews
                        </button>
                        <button
                            onClick={() => setActiveTab('write')}
                            className={`px-6 py-3 rounded-md font-medium transition-all ${
                                activeTab === 'write'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Send className="inline-block mr-2" size={20} />
                            Write a Review
                        </button>
                    </div>
                </div>

                {/* View All Reviews Tab */}
                {activeTab === 'view' && (
                    <div className="space-y-8">
                        {/* Doctor Selection */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Doctor to View Reviews
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search doctors..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                            
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                {filteredDoctors.map((doctor) => (
                                    <div
                                        key={doctor._id}
                                        onClick={() => {
                                            setSelectedDoctor(doctor._id);
                                            setCurrentPage(1);
                                        }}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            selectedDoctor === doctor._id
                                                ? 'border-primary  #5f6FFF'
                                                : 'border-gray-200 hover:border-primary'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={doctor.image}
                                                alt={doctor.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-900">{doctor.name}</p>
                                                <p className="text-sm text-gray-600">{doctor.speciality}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Statistics */}
                        {selectedDoctor && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                                    <Award className="mx-auto mb-2 text-yellow-500" size={32} />
                                    <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
                                    <p className="text-gray-600">Average Rating</p>
                                </div>
                                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                                    <MessageSquare className="mx-auto mb-2 text-primary" size={32} />
                                    <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
                                    <p className="text-gray-600">Total Reviews</p>
                                </div>
                                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                                    <TrendingUp className="mx-auto mb-2 text-green-500" size={32} />
                                    <p className="text-3xl font-bold text-gray-900">
                                        {totalReviews > 0 ? '100%' : '0%'}
                                    </p>
                                    <p className="text-gray-600">Verified Patients</p>
                                </div>
                            </div>
                        )}

                        {/* Testimonials Grid */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading reviews...</p>
                            </div>
                        ) : testimonials.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {testimonials.map((testimonial) => (
                                        <div
                                            key={testimonial._id}
                                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                                    {testimonial.patientName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {testimonial.patientName}
                                                    </p>
                                                    <StarRating rating={testimonial.rating} readonly />
                                                </div>
                                            </div>
                                            <p className="text-gray-700 mb-4 line-clamp-4">
                                                {testimonial.content}
                                            </p>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar size={16} className="mr-1" />
                                                {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-4 mt-8">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <span className="text-gray-700">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-lg shadow-md">
                                <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">
                                    {selectedDoctor 
                                        ? 'No reviews yet for this doctor. Be the first to write one!' 
                                        : 'Please select a doctor to view reviews'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Write Review Tab */}
                {activeTab === 'write' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Share Your Experience
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Doctor Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Doctor <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.doctorId}
                                        onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    >
                                        <option value="">Choose a doctor...</option>
                                        {doctors?.map((doctor) => (
                                            <option key={doctor._id} value={doctor._id}>
                                                {doctor.name} - {doctor.speciality}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Rating */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rating <span className="text-red-500">*</span>
                                    </label>
                                    <StarRating
                                        rating={formData.rating}
                                        onRatingChange={(rating) => setFormData({ ...formData, rating })}
                                    />
                                </div>

                                {/* Review Content */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Review <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Share your experience with this doctor..."
                                        rows="6"
                                        maxLength="1000"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {formData.content.length}/1000 characters
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Submit Review
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* My Testimonials - Always Show */}
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        My Reviews ({myTestimonials.length})
                                    </h3>
                                    <button
                                        onClick={fetchMyTestimonials}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                                        title="Refresh reviews"
                                    >
                                        <RefreshCw size={16} />
                                        Refresh
                                    </button>
                                </div>
                                
                                {myTestimonials.length > 0 ? (
                                    <div className="space-y-4">
                                        {myTestimonials.map((testimonial) => {
                                            const doctor = getDoctorInfo(testimonial.doctor);
                                            return (
                                                <div
                                                    key={testimonial._id}
                                                    className="p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {doctor && (
                                                                <img
                                                                    src={doctor.image}
                                                                    alt={doctor.name}
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                />
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-gray-900">
                                                                    {doctor?.name || 'Doctor'}
                                                                </p>
                                                                <StarRating rating={testimonial.rating} readonly />
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            testimonial.status === 'approved' 
                                                                ? 'bg-green-100 text-green-800'
                                                                : testimonial.status === 'rejected'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {testimonial.status.charAt(0).toUpperCase() + testimonial.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm">
                                                        {testimonial.content}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Submitted: {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                        <MessageSquare size={48} className="mx-auto text-gray-400 mb-3" />
                                        <p className="text-gray-600 font-medium">No reviews yet</p>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Submit your first review using the form above
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Testimonials;
