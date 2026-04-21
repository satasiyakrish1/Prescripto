/**
 * Statistics Controller
 * 
 * This controller provides endpoints to retrieve various statistics about the application
 * including real-time analytics, ward occupancy, staff management, and inventory monitoring.
 */

import User from '../models/userModel.js';
import Doctor from '../models/doctorModel.js';
import Appointment from '../models/appointmentModel.js';
import Ward from '../models/wardModel.js';
import Emergency from '../models/emergencyModel.js';
import Staff from '../models/staffModel.js';
import Medicine from '../models/medicineModel.js';
import mongoose from 'mongoose';

/**
 * Get application statistics
 * @route GET /api/statistics
 * @access Public
 */
const getStatistics = async (req, res) => {
  try {
    // Get count of verified doctors
    const doctorCount = await Doctor.countDocuments({ 
      isVerified: true,
      status: 'active',
      available: true  // Only count available doctors
    });
    
    // Get count of appointments
    const appointmentCount = await Appointment.countDocuments();
    
    // Calculate page views based on appointments and doctors
    const pageViews = appointmentCount * 10 + doctorCount * 50;
    
    // Prepare statistics data in the same format as the frontend expects
    const statistics = [
      { id: 1, title: 'Total Page Views', value: pageViews, icon: '👁️' },
      { id: 2, title: 'Trusted Doctors', value: doctorCount, icon: '👨‍⚕️' },
      { id: 3, title: 'Appointments Booked', value: appointmentCount, icon: '📅' },
    ];
    
    console.log('Statistics data:', {
      doctorCount,
      appointmentCount,
      pageViews,
      query: { isVerified: true, status: 'active', available: true }
    });
    
    return res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Get specialty distribution statistics
 * @route GET /api/statistics/specialty-distribution
 * @access Public
 */
const getSpecialtyDistribution = async (req, res) => {
  try {
    // Get all appointments with doctor data
    const appointments = await Appointment.find()
      .populate('docId', 'department')
      .lean();

    // Calculate specialty distribution
    const specialtyData = appointments.reduce((acc, appointment) => {
      const specialty = appointment.docId?.department || 'Other';
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {});

    // Convert to array format
    const distribution = Object.entries(specialtyData).map(([name, value]) => ({
      name,
      value
    }));

    return res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Error fetching specialty distribution:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch specialty distribution',
      error: error.message
    });
  }
};

/**
 * Get ward occupancy statistics
 * @route GET /api/statistics/ward-occupancy
 * @access Private (Admin)
 */
const getWardOccupancyStats = async (req, res) => {
    try {
        const wards = await Ward.find().select('name totalBeds beds');
        const wardStats = wards.map(ward => ({
            wardName: ward.name,
            totalBeds: ward.totalBeds,
            occupiedBeds: ward.beds.filter(bed => bed.status === 'occupied').length,
            emergencyBeds: ward.beds.filter(bed => bed.isEmergency).length,
            availableBeds: ward.beds.filter(bed => bed.status === 'available').length,
            occupancyRate: (ward.beds.filter(bed => bed.status === 'occupied').length / ward.totalBeds) * 100
        }));

        return res.status(200).json({
            success: true,
            data: wardStats
        });
    } catch (error) {
        console.error('Error fetching ward statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch ward statistics',
            error: error.message
        });
    }
};

/**
 * Get staff attendance and shift statistics
 * @route GET /api/statistics/staff
 * @access Private (Admin)
 */
const getStaffStats = async (req, res) => {
    try {
        const staff = await Staff.find();
        
        const staffStats = {
            totalStaff: staff.length,
            onDuty: staff.filter(s => s.isOnDuty).length,
            offDuty: staff.filter(s => !s.isOnDuty).length,
            departmentWise: staff.reduce((acc, curr) => {
                acc[curr.department] = (acc[curr.department] || 0) + 1;
                return acc;
            }, {}),
            shiftDistribution: staff.reduce((acc, curr) => {
                acc[curr.currentShift] = (acc[curr.currentShift] || 0) + 1;
                return acc;
            }, {})
        };

        return res.status(200).json({
            success: true,
            data: staffStats
        });
    } catch (error) {
        console.error('Error fetching staff statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch staff statistics',
            error: error.message
        });
    }
};

/**
 * Get medicine inventory status
 * @route GET /api/statistics/inventory
 * @access Private (Admin)
 */
const getMedicineInventoryStats = async (req, res) => {
    try {
        const medicines = await Medicine.find();
        
        const inventoryStats = {
            totalMedicines: medicines.length,
            lowStock: medicines.filter(m => m.quantity <= m.minStockLevel).length,
            outOfStock: medicines.filter(m => m.quantity === 0).length,
            categoryWise: medicines.reduce((acc, curr) => {
                acc[curr.category] = (acc[curr.category] || 0) + 1;
                return acc;
            }, {}),
            lowStockItems: medicines
                .filter(m => m.quantity <= m.minStockLevel)
                .map(m => ({
                    name: m.name,
                    currentStock: m.quantity,
                    minRequired: m.minStockLevel
                }))
        };

        return res.status(200).json({
            success: true,
            data: inventoryStats
        });
    } catch (error) {
        console.error('Error fetching inventory statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory statistics',
            error: error.message
        });
    }
};

/**
 * Get appointment trends data
 * @route GET /api/statistics/appointment-trends
 * @access Private (Admin)
 */
const getAppointmentTrends = async (req, res) => {
    try {
        // Get appointments for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Aggregate appointments by date
        const appointments = await Appointment.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    appointments: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    appointments: 1
                }
            },
            { $sort: { date: 1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: appointments
        });
    } catch (error) {
        console.error('Error fetching appointment trends:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch appointment trends',
            error: error.message
        });
    }
};

export { 
    getStatistics, 
    getSpecialtyDistribution,
    getWardOccupancyStats,
    getStaffStats,
    getMedicineInventoryStats,
    getAppointmentTrends 
};