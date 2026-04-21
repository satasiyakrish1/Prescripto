import contactModel from '../models/contactModel.js';
import validator from 'validator';

// Submit contact form
const submitContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message, userType, userId } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.json({ success: false, message: 'All required fields must be filled' });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' });
        }

        // Create contact submission
        const contactData = {
            name,
            email,
            phone: phone || '',
            subject,
            message,
            userType: userType || 'guest',
            status: 'pending'
        };

        // If user is logged in, save their ID
        if (userId) {
            contactData.userId = userId;
        }

        const newContact = new contactModel(contactData);
        await newContact.save();

        res.json({
            success: true,
            message: 'Your message has been submitted successfully. We will get back to you soon.',
            contactId: newContact._id
        });

    } catch (error) {
        console.error('Error submitting contact:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all contacts (Admin only)
const getAllContacts = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;

        let query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        const contacts = await contactModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await contactModel.countDocuments(query);

        res.json({
            success: true,
            contacts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });

    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get contact statistics
const getContactStats = async (req, res) => {
    try {
        const total = await contactModel.countDocuments();
        const pending = await contactModel.countDocuments({ status: 'pending' });
        const inProgress = await contactModel.countDocuments({ status: 'in-progress' });
        const resolved = await contactModel.countDocuments({ status: 'resolved' });
        const cancelled = await contactModel.countDocuments({ status: 'cancelled' });

        res.json({
            success: true,
            stats: {
                contactUs: {
                    total,
                    pending,
                    resolved,
                    cancelled
                },
                bugReports: {
                    total: 0,
                    pending: 0,
                    resolved: 0
                },
                featureRequests: {
                    total: 0,
                    pending: 0,
                    resolved: 0
                },
                generalInquiries: {
                    total: 0,
                    pending: 0,
                    resolved: 0
                }
            }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.json({ success: false, message: error.message });
    }
};

// Update contact status
const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, priority } = req.body;

        if (!['pending', 'in-progress', 'resolved', 'cancelled'].includes(status)) {
            return res.json({ success: false, message: 'Invalid status' });
        }

        const updateData = { status };

        if (notes) {
            updateData.notes = notes;
        }

        if (priority) {
            updateData.priority = priority;
        }

        // If resolving, add resolved timestamp
        if (status === 'resolved') {
            updateData.resolvedAt = new Date();
            updateData.resolvedBy = req.body.adminId; // From auth middleware
        }

        const contact = await contactModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!contact) {
            return res.json({ success: false, message: 'Contact not found' });
        }

        res.json({
            success: true,
            message: 'Contact status updated successfully',
            contact
        });

    } catch (error) {
        console.error('Error updating contact:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete contact
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await contactModel.findByIdAndDelete(id);

        if (!contact) {
            return res.json({ success: false, message: 'Contact not found' });
        }

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting contact:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get single contact details
const getContactById = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await contactModel.findById(id);

        if (!contact) {
            return res.json({ success: false, message: 'Contact not found' });
        }

        res.json({
            success: true,
            contact
        });

    } catch (error) {
        console.error('Error fetching contact:', error);
        res.json({ success: false, message: error.message });
    }
};

export {
    submitContact,
    getAllContacts,
    getContactStats,
    updateContactStatus,
    deleteContact,
    getContactById
};
