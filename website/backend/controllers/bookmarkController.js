import userModel from "../models/userModel.js";

// API to toggle bookmark medicine
const toggleBookmarkMedicine = async (req, res) => {
    try {
        const { userId } = req.body;
        const { medicineId } = req.body;

        if (!medicineId) {
            return res.status(400).json({ success: false, message: 'Medicine ID is required' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const bookmarkedMedicines = user.bookmarkedMedicines || [];
        const isBookmarked = bookmarkedMedicines.includes(medicineId);

        if (isBookmarked) {
            // Remove bookmark
            await userModel.findByIdAndUpdate(userId, {
                $pull: { bookmarkedMedicines: medicineId }
            });
            res.json({ success: true, message: 'Bookmark removed', isBookmarked: false });
        } else {
            // Add bookmark
            await userModel.findByIdAndUpdate(userId, {
                $addToSet: { bookmarkedMedicines: medicineId }
            });
            res.json({ success: true, message: 'Medicine bookmarked', isBookmarked: true });
        }
    } catch (error) {
        console.error('Toggle bookmark error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to get user's bookmarked medicines
const getBookmarkedMedicines = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId).select('bookmarkedMedicines');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            bookmarkedMedicines: user.bookmarkedMedicines || []
        });
    } catch (error) {
        console.error('Get bookmarked medicines error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    toggleBookmarkMedicine,
    getBookmarkedMedicines
};
