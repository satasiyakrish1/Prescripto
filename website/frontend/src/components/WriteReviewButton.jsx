import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';

const WriteReviewButton = ({ appointment }) => {
    const navigate = useNavigate();

    // Only show for completed appointments
    if (!appointment.isCompleted || appointment.cancelled) {
        return null;
    }

    const handleWriteReview = () => {
        navigate(`/testimonials/${appointment.docData._id}`);
    };

    return (
        <button
            onClick={handleWriteReview}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
        >
            <Star size={16} />
            Write Review
        </button>
    );
};

export default WriteReviewButton;
