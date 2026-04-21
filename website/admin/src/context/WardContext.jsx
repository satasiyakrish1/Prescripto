import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Define types for bed status and ward types
const BED_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance'
};

const WARD_TYPES = {
  ICU: 'icu',
  OPERATION_THEATER: 'operation_theater',
  GENERAL: 'general'
};

export const WardContext = createContext();

const WardContextProvider = ({ children }) => {
  const [emergencyCases, setEmergencyCases] = useState([]);
  const [stats, setStats] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval] = useState(30000); // 30 seconds refresh
  
  // Bed Allocation System states
  const [departments, setDepartments] = useState([]);
  const [bedsByDepartment, setBedsByDepartment] = useState({});
  const [doctorsByDepartment, setDoctorsByDepartment] = useState({});
  const [admissions, setAdmissions] = useState([]);
  const [bedAllocationStats, setBedAllocationStats] = useState(null);
  const [occupancySummary, setOccupancySummary] = useState(null);
  const [floorDistribution, setFloorDistribution] = useState([]);

  const fetchEmergencyCases = async () => {
    try {
      const response = await axios.get('/api/ward/emergency/cases');
      setEmergencyCases(response.data);
    } catch (error) {
      console.error('Error fetching emergency cases:', error);
      setError('Failed to fetch emergency cases');
    }
  };

  const fetchWards = async () => {
    try {
      const response = await axios.get('/api/ward/all');
      setWards(response.data);
    } catch (error) {
      console.error('Error fetching wards:', error);
      setError('Failed to fetch wards');
    }
  };

  const updateBedStatus = async (wardId, bedId, newStatus) => {
    try {
      await axios.patch(`/api/ward/${wardId}/bed/${bedId}`, { status: newStatus });
      await fetchWards(); // Refresh ward data
    } catch (error) {
      console.error('Error updating bed status:', error);
      setError('Failed to update bed status');
    }
  };

  const updateEmergencyCase = async (emergencyId, updates) => {
    try {
      await axios.patch(`/api/ward/emergency/${emergencyId}`, updates);
      await fetchEmergencyCases();
    } catch (error) {
      console.error('Error updating emergency case:', error);
      setError('Failed to update emergency case');
    }
  };

  const fetchWardStats = async () => {
    try {
      const response = await axios.get('/api/ward/stats');
      if (response.data && Array.isArray(response.data)) {
        setStats(response.data.map(stat => ({
          ...stat,
          type: stat.type || 'unknown',
          totalBeds: stat.totalBeds || 0,
          availableBeds: stat.availableBeds || 0,
          occupancyRate: stat.occupancyRate || 0
        })));
      } else {
        setStats([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ward stats:', error);
      setError(error.message);
      setStats([]);
      setLoading(false);
    }
  };

  // Bed Allocation System methods
  const fetchDepartments = async (adminToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/departments`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setDepartments(response.data.departments);
      return response.data.departments;
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
      return [];
    }
  };

  const fetchBedsByDepartment = async (department, adminToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/beds/${department}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setBedsByDepartment(prev => ({
        ...prev,
        [department]: response.data.beds
      }));
      return response.data.beds;
    } catch (error) {
      console.error('Error fetching beds by department:', error);
      toast.error('Failed to fetch beds');
      return [];
    }
  };

  const fetchBedsByStatus = async (status, adminToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/beds/status/${status}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      return response.data.beds;
    } catch (error) {
      console.error('Error fetching beds by status:', error);
      toast.error('Failed to fetch beds');
      return [];
    }
  };

  const fetchDoctorsByDepartment = async (department, adminToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/doctors/${department}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setDoctorsByDepartment(prev => ({
        ...prev,
        [department]: response.data.doctors
      }));
      return response.data.doctors;
    } catch (error) {
      console.error('Error fetching doctors by department:', error);
      toast.error('Failed to fetch doctors');
      return [];
    }
  };

  const searchPatients = async (query, adminToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/patients/search?query=${query}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      return response.data.patients || [];
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Failed to search patients');
      return [];
    }
  };

  const createPatient = async (patientData, adminToken) => {
    try {
      // Ensure we're sending data in the format expected by the MongoDB schema
      const formattedPatientData = {
        ...patientData,
        // Make sure these fields match the MongoDB schema
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        contactNumber: patientData.contactNumber,
        diagnosis: patientData.diagnosis,
        // Optional fields with proper handling
        bloodGroup: patientData.bloodGroup || undefined,
        allergies: Array.isArray(patientData.allergies) ? patientData.allergies : [],
        notes: patientData.notes || undefined,
        address: patientData.address || {},
        emergencyContact: patientData.emergencyContact || undefined,
        medicalHistory: Array.isArray(patientData.medicalHistory) ? patientData.medicalHistory : []
      };
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/patients`,
        formattedPatientData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success('Patient added successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error(error.response?.data?.message || 'Failed to add patient');
      throw error;
    }
  };

  const allocateBed = async (allocationData, adminToken) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/allocate`,
        allocationData,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success('Bed allocated successfully');
      return response.data;
    } catch (error) {
      console.error('Error allocating bed:', error);
      toast.error(error.response?.data?.message || 'Failed to allocate bed');
      throw error;
    }
  };

  const fetchAdmissions = async (adminToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/admissions`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setAdmissions(response.data.admissions);
      return response.data.admissions;
    } catch (error) {
      console.error('Error fetching admissions:', error);
      toast.error('Failed to fetch admissions');
      return [];
    }
  };

  const fetchBedAllocationStats = async (adminToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/stats`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setBedAllocationStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching bed allocation stats:', error);
      toast.error('Failed to fetch statistics');
      return null;
    }
  };

  const fetchOccupancySummary = async (adminToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/occupancy-summary`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setOccupancySummary(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching occupancy summary:', error);
      toast.error('Failed to fetch occupancy summary');
      return null;
    }
  };

  const fetchFloorDistribution = async (adminToken) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/bed-allocation/floors`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setFloorDistribution(response.data.floors || []);
      return response.data.floors || [];
    } catch (error) {
      console.error('Error fetching floor distribution:', error);
      toast.error('Failed to fetch floor distribution');
      return [];
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchEmergencyCases(),
        fetchWardStats(),
        fetchWards()
      ]);
      setLoading(false);
    };

    fetchAllData();

    const intervalId = setInterval(fetchAllData, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return (
    <WardContext.Provider value={{
      emergencyCases,
      stats,
      wards,
      loading,
      error,
      selectedWard,
      setSelectedWard,
      updateBedStatus,
      updateEmergencyCase,
      BED_STATUS,
      WARD_TYPES,
      // Bed Allocation System
      departments,
      bedsByDepartment,
      doctorsByDepartment,
      admissions,
      bedAllocationStats,
      occupancySummary,
      floorDistribution,
      fetchDepartments,
      fetchBedsByDepartment,
      fetchBedsByStatus,
      fetchDoctorsByDepartment,
      searchPatients,
      createPatient,
      allocateBed,
      fetchAdmissions,
      fetchBedAllocationStats,
      fetchOccupancySummary,
      fetchFloorDistribution
    }}>
      {children}
    </WardContext.Provider>
  );
};

export default WardContextProvider;
