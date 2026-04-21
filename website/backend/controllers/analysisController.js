import mongoose from 'mongoose';
import Medicine from '../models/medicineModel.js';
import Inventory from '../models/inventoryModel.js';

// Helper function to parse date range filter
const getDateRangeFilter = (dateRange) => {
    const today = new Date();
    let startDate;
    
    switch(dateRange) {
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'quarter':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 3);
            break;
        case 'year':
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        default:
            // Default to all time (no filter)
            return {};
    }
    
    return { created_at: { $gte: startDate } };
};

// Helper function to build filters based on query parameters
const buildFilters = (req) => {
    const filters = {};
    
    // Date range filter
    if (req.query.dateRange && req.query.dateRange !== 'all') {
        Object.assign(filters, getDateRangeFilter(req.query.dateRange));
    }
    
    // Category filter
    if (req.query.category && req.query.category !== 'all') {
        filters.category = req.query.category;
    }
    
    // Stock status filter
    if (req.query.stockStatus && req.query.stockStatus !== 'all') {
        filters.status = req.query.stockStatus;
    }
    
    return filters;
};

// Get overview statistics
export const getOverview = async (req, res) => {
    try {
        const pharmacyId = req.pharmacy._id;
        const filters = buildFilters(req);
        
        // Get total inventory value and count
        const inventoryAggregation = await Inventory.aggregate([
            { $match: { ...filters } },
            { 
                $group: {
                    _id: null,
                    totalInventoryValue: { $sum: { $multiply: ["$price", "$quantity"] } },
                    totalMedicines: { $sum: 1 },
                    inStockCount: {
                        $sum: { $cond: [{ $eq: ["$status", "In Stock"] }, 1, 0] }
                    },
                    lowStockCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] }
                    },
                    expiredCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Expired"] }, 1, 0] }
                    }
                }
            }
        ]);
        
        // Get unique categories count
        const categoriesCount = await Inventory.distinct('category', filters).then(categories => categories.length);
        
        // Get unique manufacturers count
        const manufacturersCount = await Inventory.distinct('manufacturer', filters).then(manufacturers => manufacturers.length);
        
        // Get top category
        const topCategoryAgg = await Inventory.aggregate([
            { $match: { ...filters } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        
        // Get top manufacturer
        const topManufacturerAgg = await Inventory.aggregate([
            { $match: { ...filters } },
            { $group: { _id: "$manufacturer", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        
        // Calculate previous period for comparison
        let previousPeriodFilters = {};
        if (req.query.dateRange && req.query.dateRange !== 'all') {
            const today = new Date();
            let currentPeriodStart, previousPeriodStart, previousPeriodEnd;
            
            switch(req.query.dateRange) {
                case 'week':
                    currentPeriodStart = new Date(today);
                    currentPeriodStart.setDate(today.getDate() - 7);
                    previousPeriodStart = new Date(currentPeriodStart);
                    previousPeriodStart.setDate(currentPeriodStart.getDate() - 7);
                    break;
                case 'month':
                    currentPeriodStart = new Date(today);
                    currentPeriodStart.setMonth(today.getMonth() - 1);
                    previousPeriodStart = new Date(currentPeriodStart);
                    previousPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
                    break;
                case 'quarter':
                    currentPeriodStart = new Date(today);
                    currentPeriodStart.setMonth(today.getMonth() - 3);
                    previousPeriodStart = new Date(currentPeriodStart);
                    previousPeriodStart.setMonth(currentPeriodStart.getMonth() - 3);
                    break;
                case 'year':
                    currentPeriodStart = new Date(today);
                    currentPeriodStart.setFullYear(today.getFullYear() - 1);
                    previousPeriodStart = new Date(currentPeriodStart);
                    previousPeriodStart.setFullYear(currentPeriodStart.getFullYear() - 1);
                    break;
            }
            
            previousPeriodEnd = new Date(currentPeriodStart);
            previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
            
            previousPeriodFilters = {
                created_at: { 
                    $gte: previousPeriodStart,
                    $lte: previousPeriodEnd
                }
            };
            
            if (req.query.category && req.query.category !== 'all') {
                previousPeriodFilters.category = req.query.category;
            }
            
            if (req.query.stockStatus && req.query.stockStatus !== 'all') {
                previousPeriodFilters.status = req.query.stockStatus;
            }
        }
        
        // Get previous period inventory value
        let previousInventoryValue = 0;
        if (Object.keys(previousPeriodFilters).length > 0) {
            const previousPeriodAgg = await Inventory.aggregate([
                { $match: previousPeriodFilters },
                { 
                    $group: {
                        _id: null,
                        totalInventoryValue: { $sum: { $multiply: ["$price", "$quantity"] } }
                    }
                }
            ]);
            
            if (previousPeriodAgg.length > 0) {
                previousInventoryValue = previousPeriodAgg[0].totalInventoryValue;
            }
        }
        
        // Calculate value change percentage
        let valueChangePercent = 0;
        const currentValue = inventoryAggregation.length > 0 ? inventoryAggregation[0].totalInventoryValue : 0;
        
        if (previousInventoryValue > 0 && currentValue > 0) {
            valueChangePercent = ((currentValue - previousInventoryValue) / previousInventoryValue) * 100;
        }
        
        // Mock data for profit/loss estimation (in a real app, this would come from sales data)
        const totalRevenue = currentValue * 1.3; // Assuming 30% markup
        const totalCost = currentValue * 0.7;   // Assuming 70% of inventory value is cost
        const profit = totalRevenue - totalCost;
        const profitMargin = (profit / totalRevenue) * 100;
        
        // Prepare response
        const overview = {
            totalInventoryValue: inventoryAggregation.length > 0 ? inventoryAggregation[0].totalInventoryValue : 0,
            totalMedicines: inventoryAggregation.length > 0 ? inventoryAggregation[0].totalMedicines : 0,
            inStockCount: inventoryAggregation.length > 0 ? inventoryAggregation[0].inStockCount : 0,
            lowStockCount: inventoryAggregation.length > 0 ? inventoryAggregation[0].lowStockCount : 0,
            expiredCount: inventoryAggregation.length > 0 ? inventoryAggregation[0].expiredCount : 0,
            categoriesCount,
            manufacturersCount,
            topCategory: topCategoryAgg.length > 0 ? topCategoryAgg[0]._id : null,
            topManufacturer: topManufacturerAgg.length > 0 ? topManufacturerAgg[0]._id : null,
            valueChangePercent,
            totalRevenue,
            totalCost,
            profit,
            profitMargin
        };
        
        return res.json(overview);
    } catch (error) {
        console.error('Error fetching overview data:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error fetching overview data",
            error: error.message
        });
    }
};

// Get category statistics
export const getCategoryStats = async (req, res) => {
    try {
        const filters = buildFilters(req);
        
        const categoryStats = await Inventory.aggregate([
            { $match: { ...filters } },
            { 
                $group: {
                    _id: "$category",
                    value: { $sum: "$quantity" }
                }
            },
            { $project: { _id: 0, name: "$_id", value: 1 } },
            { $sort: { value: -1 } }
        ]);
        
        return res.json(categoryStats);
    } catch (error) {
        console.error('Error fetching category statistics:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error fetching category statistics",
            error: error.message
        });
    }
};

// Get stock status statistics
export const getStockStatus = async (req, res) => {
    try {
        const filters = buildFilters(req);
        
        const stockStatusAgg = await Inventory.aggregate([
            { $match: { ...filters } },
            { 
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Convert to expected format
        const stockStatus = {
            inStock: 0,
            lowStock: 0,
            expired: 0
        };
        
        stockStatusAgg.forEach(status => {
            if (status._id === 'In Stock') stockStatus.inStock = status.count;
            if (status._id === 'Low Stock') stockStatus.lowStock = status.count;
            if (status._id === 'Expired') stockStatus.expired = status.count;
        });
        
        return res.json(stockStatus);
    } catch (error) {
        console.error('Error fetching stock status:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error fetching stock status",
            error: error.message
        });
    }
};

// Get monthly report data
export const getMonthlyReport = async (req, res) => {
    try {
        // For demo purposes, generate mock monthly data
        // In a real app, this would come from actual sales/inventory data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        
        const monthlyReport = [];
        
        // Generate data for the last 6 months
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12; // Handle wrapping around to previous year
            
            monthlyReport.push({
                month: months[monthIndex],
                sales: Math.floor(Math.random() * 10000) + 5000, // Random sales between $5000-$15000
                quantity: Math.floor(Math.random() * 100) + 50    // Random quantity between 50-150
            });
        }
        
        return res.json(monthlyReport);
    } catch (error) {
        console.error('Error generating monthly report:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error generating monthly report",
            error: error.message
        });
    }
};

// Get top medicines (most and least stocked)
export const getTopMedicines = async (req, res) => {
    try {
        const filters = buildFilters(req);
        
        // Get top 5 most stocked medicines
        const mostStocked = await Inventory.aggregate([
            { $match: { ...filters } },
            { 
                $project: {
                    name: "$medicine_name",
                    category: 1,
                    stock: "$quantity",
                    value: { $multiply: ["$price", "$quantity"] }
                }
            },
            { $sort: { stock: -1 } },
            { $limit: 5 }
        ]);
        
        // Get top 5 least stocked medicines
        const leastStocked = await Inventory.aggregate([
            { $match: { ...filters, status: { $in: ['Low Stock', 'Expired'] } } },
            { 
                $project: {
                    name: "$medicine_name",
                    category: 1,
                    stock: "$quantity",
                    status: 1
                }
            },
            { $sort: { stock: 1 } },
            { $limit: 5 }
        ]);
        
        return res.json({
            mostStocked,
            leastStocked
        });
    } catch (error) {
        console.error('Error fetching top medicines:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error fetching top medicines",
            error: error.message
        });
    }
};

// Get sales by time of day
export const getSalesByTime = async (req, res) => {
    try {
        // For demo purposes, generate mock sales by time data
        // In a real app, this would come from actual sales data
        const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
        const salesByTime = timeSlots.map(time => ({
            name: time,
            value: Math.floor(Math.random() * 5000) + 1000 // Random sales between $1000-$6000
        }));
        
        return res.json(salesByTime);
    } catch (error) {
        console.error('Error fetching sales by time:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error fetching sales by time data",
            error: error.message
        });
    }
};

// Get profit margins by category
export const getProfitMargins = async (req, res) => {
    try {
        const filters = buildFilters(req);
        
        // For demo purposes, generate mock profit margin data
        // In a real app, this would come from actual sales/cost data
        const categories = await Inventory.distinct('category', filters);
        const profitMargins = categories.map(category => ({
            name: category,
            margin: Math.floor(Math.random() * 40) + 10 // Random margin between 10%-50%
        }));
        
        return res.json(profitMargins);
    } catch (error) {
        console.error('Error fetching profit margins:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Error fetching profit margin data",
            error: error.message
        });
    }
};