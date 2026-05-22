import express from 'express';
import {
    getAllDepartments,
    getBedsByDepartment,
    getBedsByStatus,
    getDoctorsByDepartment,
    searchPatients,
    allocateBed,
    getAllAdmissions,
    getAdmissionById,
    getBedAllocationStats,
    getOccupancySummary,
    getFloorDistribution,
    updateBedStatus,
    dischargePatient,
    createBed,
    updateBedDetails,
    deleteBed
} from '../controllers/bedAllocationController.js';
import authAdmin from '../middleware/authAdmin.js';

const bedAllocationRouter = express.Router();

bedAllocationRouter.get('/departments', authAdmin, getAllDepartments);
bedAllocationRouter.get('/beds/department/:department', authAdmin, getBedsByDepartment);
bedAllocationRouter.get('/beds/status/:status', authAdmin, getBedsByStatus);
bedAllocationRouter.get('/doctors/department/:department', authAdmin, getDoctorsByDepartment);
bedAllocationRouter.get('/patients/search', authAdmin, searchPatients);

bedAllocationRouter.post('/allocate', authAdmin, allocateBed);
bedAllocationRouter.post('/discharge', authAdmin, dischargePatient);
bedAllocationRouter.put('/beds/:wardId/:bedId/status', authAdmin, updateBedStatus);
bedAllocationRouter.post('/beds/:wardId', authAdmin, createBed);
bedAllocationRouter.put('/beds/:wardId/:bedId', authAdmin, updateBedDetails);
bedAllocationRouter.delete('/beds/:wardId/:bedId', authAdmin, deleteBed);
bedAllocationRouter.get('/admissions', authAdmin, getAllAdmissions);
bedAllocationRouter.get('/admissions/:id', authAdmin, getAdmissionById);

bedAllocationRouter.get('/stats', authAdmin, getBedAllocationStats);
bedAllocationRouter.get('/occupancy-summary', authAdmin, getOccupancySummary);
bedAllocationRouter.get('/floors', authAdmin, getFloorDistribution);

export default bedAllocationRouter;
