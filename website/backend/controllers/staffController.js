import bcrypt from 'bcrypt';
import Staff from '../models/staffModel.js';
import { v2 as cloudinary } from 'cloudinary';
import { generateStaffExcel, generateStaffPDF } from '../utils/staffExporter.js';

// Add new staff member
const addStaff = async (req, res) => {
    try {
        const { name, email, password, role, customRole, department, contactNumber, address } = req.body;
        const imageFile = req.file;

        // Check for required fields
        if (!name || !email || !password || !role || !department) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if email already exists
        const existingStaff = await Staff.findOne({ email });
        if (existingStaff) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        // Validate custom role if role is 'custom'
        if (role === 'custom' && !customRole) {
            return res.status(400).json({ success: false, message: 'Custom role name is required' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let imageUrl = '';
        if (imageFile) {
            // Upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            imageUrl = imageUpload.secure_url;
        }

        const staffData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            customRole: role === 'custom' ? customRole : undefined,
            department,
            contactNumber,
            address,
            image: imageUrl
        };

        const newStaff = new Staff(staffData);
        const savedStaff = await newStaff.save();

        res.status(201).json({
            success: true,
            message: 'Staff member added successfully',
            staff: savedStaff
        });
    } catch (error) {
        console.error('Add staff error:', error);
        res.status(500).json({ success: false, message: 'Failed to add staff member' });
    }
};

// Get all staff members
const getAllStaff = async (req, res) => {
    try {
        const staffList = await Staff.find({}).select('-password');
        res.status(200).json({ success: true, staffList });
    } catch (error) {
        console.error('Get staff list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff list' });
    }
};

// Get staff by ID
const getStaffById = async (req, res) => {
    try {
        const { staffId } = req.params;
        const staff = await Staff.findById(staffId).select('-password');
        
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        res.status(200).json({ success: true, staff });
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff member' });
    }
};

// Update staff member
const updateStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { name, role, customRole, department, contactNumber, address, status } = req.body;
        const imageFile = req.file;

        if (!name || !role || !department) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const updateData = {
            name,
            role,
            department,
            contactNumber,
            address,
            status
        };

        // Validate custom role if role is 'custom'
        if (role === 'custom') {
            if (!customRole) {
                return res.status(400).json({ success: false, message: 'Custom role name is required' });
            }
            updateData.customRole = customRole;
        }

        if (imageFile) {
            // Upload new image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            updateData.image = imageUpload.secure_url;
        }

        const updatedStaff = await Staff.findByIdAndUpdate(
            staffId,
            updateData,
            { new: true }
        ).select('-password');

        if (!updatedStaff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        res.status(200).json({ success: true, message: 'Staff member updated successfully', staff: updatedStaff });
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ success: false, message: 'Failed to update staff member' });
    }
};

// Delete staff member
const deleteStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const deletedStaff = await Staff.findByIdAndDelete(staffId);

        if (!deletedStaff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        res.status(200).json({ success: true, message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete staff member' });
    }
};

// Get staff by role
const getStaffByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const staffList = await Staff.find({ role }).select('-password');
        res.status(200).json({ success: true, staffList });
    } catch (error) {
        console.error('Get staff by role error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff by role' });
    }
};

// Export staff list in Excel format
const exportStaffExcel = async (req, res) => {
    try {
        const { status, role, department } = req.query;
        let query = {};

        if (status && status !== 'all') query.status = status;
        if (role && role !== 'all') query.role = role;
        if (department && department !== 'all') query.department = department;

        const staffList = await Staff.find(query).select('-password');
        const buffer = await generateStaffExcel(staffList);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=staff-list.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Export staff Excel error:', error);
        res.status(500).json({ success: false, message: 'Failed to export staff list' });
    }
};

// Export staff list in PDF format
const exportStaffPDF = async (req, res) => {
    try {
        const { status, role, department } = req.query;
        let query = {};

        if (status && status !== 'all') query.status = status;
        if (role && role !== 'all') query.role = role;
        if (department && department !== 'all') query.department = department;

        const staffList = await Staff.find(query).select('-password');
        const buffer = await generateStaffPDF(staffList);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=staff-list.pdf');
        res.send(buffer);
    } catch (error) {
        console.error('Export staff PDF error:', error);
        res.status(500).json({ success: false, message: 'Failed to export staff list' });
    }
};

// Get reception staff
const getReceptionStaff = async (req, res) => {
    try {
        const receptionStaff = await Staff.find({ role: 'reception' }).select('-password');
        res.status(200).json({ success: true, receptionStaff });
    } catch (error) {
        console.error('Get reception staff error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reception staff' });
    }
};

// Get reception staff by department
const getReceptionStaffByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const receptionStaff = await Staff.find({ role: 'reception', department }).select('-password');
        res.status(200).json({ success: true, receptionStaff });
    } catch (error) {
        console.error('Get reception staff by department error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reception staff' });
    }
};

export { 
    addStaff, 
    getAllStaff, 
    getStaffById, 
    updateStaff, 
    deleteStaff, 
    getStaffByRole, 
    exportStaffExcel, 
    exportStaffPDF,
    getReceptionStaff,
    getReceptionStaffByDepartment
};