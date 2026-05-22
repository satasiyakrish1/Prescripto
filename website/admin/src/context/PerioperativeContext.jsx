import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AppContext } from './AppContext';
import { AdminContext } from './AdminContext';

export const PerioperativeContext = createContext();

export const PerioperativeProvider = ({ children }) => {
  const { backendUrl } = useContext(AppContext);
  const { adminToken, handle401Error } = useContext(AdminContext);
  
  const [loading, setLoading] = useState(false);
  const [upcomingProcedures, setUpcomingProcedures] = useState([]);
  const [patientChecklists, setPatientChecklists] = useState([]);
  const [currentChecklist, setCurrentChecklist] = useState(null);
  
  // Create a new perioperative checklist
  const createChecklist = async (checklistData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/perioperative-checklist`,
        checklistData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      
      toast.success('Perioperative checklist created successfully');
      return response.data.checklist;
    } catch (error) {
      handle401Error(error);
      toast.error(error.response?.data?.message || 'Failed to create checklist');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Get a perioperative checklist by ID
  const getChecklist = async (checklistId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/api/perioperative-checklist/${checklistId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      
      setCurrentChecklist(response.data.checklist);
      return response.data.checklist;
    } catch (error) {
      handle401Error(error);
      toast.error(error.response?.data?.message || 'Failed to fetch checklist');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Update a perioperative checklist
  const updateChecklist = async (checklistId, updateData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${backendUrl}/api/perioperative-checklist/${checklistId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      
      toast.success('Checklist updated successfully');
      setCurrentChecklist(response.data.checklist);
      return response.data.checklist;
    } catch (error) {
      handle401Error(error);
      toast.error(error.response?.data?.message || 'Failed to update checklist');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Get all checklists for a patient
  const getPatientChecklists = async (patientId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/api/perioperative-checklist/patient/${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      
      setPatientChecklists(response.data.checklists);
      return response.data.checklists;
    } catch (error) {
      handle401Error(error);
      toast.error(error.response?.data?.message || 'Failed to fetch patient checklists');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Get all upcoming surgeries/procedures
  const getUpcomingProcedures = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/api/perioperative-checklist/upcoming`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      
      setUpcomingProcedures(response.data.procedures);
      return response.data.procedures;
    } catch (error) {
      handle401Error(error);
      toast.error(error.response?.data?.message || 'Failed to fetch upcoming procedures');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Update checklist status
  const updateStatus = async (checklistId, statusData) => {
    setLoading(true);
    try {
      const response = await axios.patch(
        `${backendUrl}/api/perioperative-checklist/${checklistId}/status`,
        statusData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      
      toast.success('Checklist status updated successfully');
      setCurrentChecklist(response.data.checklist);
      return response.data.checklist;
    } catch (error) {
      handle401Error(error);
      toast.error(error.response?.data?.message || 'Failed to update checklist status');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a perioperative checklist
  const deleteChecklist = async (checklistId) => {
    setLoading(true);
    try {
      await axios.delete(
        `${backendUrl}/api/perioperative-checklist/${checklistId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      
      toast.success('Checklist deleted successfully');
      setCurrentChecklist(null);
      return true;
    } catch (error) {
      handle401Error(error);
      toast.error(error.response?.data?.message || 'Failed to delete checklist');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Clear current checklist
  const clearCurrentChecklist = () => {
    setCurrentChecklist(null);
  };
  
  return (
    <PerioperativeContext.Provider
      value={{
        loading,
        upcomingProcedures,
        patientChecklists,
        currentChecklist,
        createChecklist,
        getChecklist,
        updateChecklist,
        getPatientChecklists,
        getUpcomingProcedures,
        updateStatus,
        deleteChecklist,
        clearCurrentChecklist,
      }}
    >
      {children}
    </PerioperativeContext.Provider>
  );
};