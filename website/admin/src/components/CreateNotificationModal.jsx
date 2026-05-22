import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AdminContext } from '../context/AdminContext';
import { AppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

const CreateNotificationModal = ({ isOpen, onClose, onSuccess }) => {
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    recipientModel: 'Doctor',
    recipients: [],
    sendToAll: false
  });

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Fetch doctors when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setFetchError(null);
      
      console.log('=== FETCHING DOCTORS DEBUG ===');
      console.log('Backend URL:', backendUrl);
      console.log('Admin Token:', aToken ? 'Present' : 'Missing');
      console.log('Full URL:', `${backendUrl}/api/doctors/list`);
      
      // Try multiple possible endpoints
      const possibleEndpoints = [
        '/api/doctors/list',
        '/api/admin/doctors',
        '/api/admin/all-doctors',
        '/api/doctor/list',
        '/api/doctors'
      ];

      let response = null;
      let workingEndpoint = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${backendUrl}${endpoint}`);
          
          const testResponse = await axios.get(`${backendUrl}${endpoint}`, {
            headers: {
              Authorization: `Bearer ${aToken}`,
              aToken: aToken, // Some APIs use this format
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`Success with ${endpoint}:`, testResponse.data);
          response = testResponse;
          workingEndpoint = endpoint;
          break;
        } catch (error) {
          console.log(`Failed with ${endpoint}:`, error.response?.status, error.response?.data);
          continue;
        }
      }

      if (!response) {
        throw new Error('No working endpoint found for fetching doctors');
      }

      console.log('Working endpoint:', workingEndpoint);
      console.log('Response data structure:', response.data);
      
      if (response.data.success) {
        // Handle different response structures
        let doctorsList = [];
        
        if (response.data.doctors) {
          doctorsList = response.data.doctors;
        } else if (response.data.data) {
          doctorsList = response.data.data;
        } else if (Array.isArray(response.data)) {
          doctorsList = response.data;
        }

        console.log('Raw doctors list:', doctorsList);
        
        // Map the response data to match the expected format
        const formattedDoctors = doctorsList.map(doctor => {
          console.log('Processing doctor:', doctor);
          return {
            _id: doctor._id || doctor.id,
            name: doctor.name || doctor.doctorName || 'Unknown Name',
            specialization: doctor.speciality || doctor.specialization || doctor.specialty || 'General'
          };
        });
        
        console.log('Formatted doctors:', formattedDoctors);
        setDoctors(formattedDoctors);
        
        if (formattedDoctors.length === 0) {
          setFetchError('No doctors found in the database. Please add some doctors first.');
        }
      } else {
        console.error('API returned success:false', response.data);
        setFetchError(response.data.message || 'Failed to fetch doctors list');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      
      let errorMessage = 'Error fetching doctors';
      
      if (error.response) {
        console.error('Error response:', error.response);
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        console.error('Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      setFetchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const response = await axios.get(`${backendUrl}/api/health`, {
        headers: {
          Authorization: `Bearer ${aToken}`,
          aToken: aToken
        }
      });
      console.log('Health check response:', response.data);
      toast.success('Database connection test completed - check console');
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Health check failed - check console');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.sendToAll && formData.recipients.length === 0) {
      toast.error('Please select at least one recipient or choose "All Doctors"');
      return;
    }

    const notificationData = {
      ...formData,
      recipients: formData.sendToAll ? doctors.map(doctor => doctor._id) : formData.recipients
    };

    setLoading(true);
    try {
      console.log('Sending notification:', notificationData);
      const response = await axios.post(`${backendUrl}/api/notifications/create`, notificationData, {
        headers: {
          Authorization: `Bearer ${aToken}`,
          aToken: aToken,
          'Content-Type': 'application/json'
        }
      });
      console.log('Notification response:', response.data);

      if (response.data.success) {
        toast.success('Notification sent successfully');
        onSuccess(response.data.notification);
        onClose();
        setFormData({
          title: '',
          message: '',
          type: 'info',
          recipientModel: 'Doctor',
          recipients: [],
          sendToAll: false
        });
      } else {
        toast.error(response.data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.message || 'Error sending notification');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    setFormData({
      ...formData,
      sendToAll: e.target.checked,
      recipients: e.target.checked ? [] : formData.recipients
    });
  };

  const handleRecipientSelect = (doctorId) => {
    if (formData.sendToAll) {
      setFormData({
        ...formData,
        sendToAll: false
      });
    }

    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.includes(doctorId)
        ? prev.recipients.filter(id => id !== doctorId)
        : [...prev.recipients, doctorId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Notification</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          

          <form onSubmit={handleSubmit}>
            {/* Title Input */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notification title"
                required
              />
            </div>

            {/* Message Input */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                placeholder="Enter notification message"
                required
              />
            </div>

            {/* Type Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Recipients Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Recipients *
              </label>
              {loadingDoctors ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading doctors...</span>
                </div>
              ) : fetchError ? (
                <div className="text-center py-4 text-red-500 border border-red-200 rounded-md bg-red-50">
                  <p className="font-medium">Failed to load doctors</p>
                  <p className="text-sm mt-1">{fetchError}</p>
                  <button
                    type="button"
                    onClick={fetchDoctors}
                    className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Retry
                  </button>
                </div>
              ) : doctors.length > 0 ? (
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                  <div className="mb-2 pb-2 border-b border-gray-200">
                    <label className="flex items-center text-sm text-gray-600 font-medium">
                      <input
                        type="checkbox"
                        checked={formData.sendToAll}
                        onChange={handleSelectAll}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      All Doctors ({doctors.length})
                    </label>
                  </div>
                  {!formData.sendToAll && doctors.map((doctor) => (
                    <label key={doctor._id} className="flex items-center py-1.5 text-sm text-gray-600 hover:bg-gray-50 px-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.recipients.includes(doctor._id)}
                        onChange={() => handleRecipientSelect(doctor._id)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="font-medium">{doctor.name}</span>
                        <span className="text-gray-500 ml-1">({doctor.specialization})</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-md">
                  <p className="font-medium">No doctors found in the database.</p>
                  <p className="text-sm mt-1">Please add some doctors first using the Add Doctor form.</p>
                  <p className="text-xs mt-2 text-gray-400">
                    If you've already added doctors, check the console for API errors.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingDoctors || doctors.length === 0}
                className={`px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  (loading || loadingDoctors || doctors.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateNotificationModal;