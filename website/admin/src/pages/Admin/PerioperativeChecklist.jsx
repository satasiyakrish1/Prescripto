import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { ThemeContext } from '../../context/ThemeContext';
import { PerioperativeContext } from '../../context/PerioperativeContext';
import { WardContext } from '../../context/WardContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  Clipboard,
  CheckSquare,
  AlertTriangle,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  FileText,
  Activity,
  Layers,
  Thermometer,
  Heart,
  Droplet,
  Zap,
  Briefcase,
  Scissors,
  Eye,
  Bookmark,
  AlertCircle,
  RefreshCw
} from 'react-feather';

const PerioperativeChecklist = () => {
  const { adminToken } = useContext(AdminContext);
  const { darkMode } = useContext(ThemeContext);
  const {
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
    clearCurrentChecklist
  } = useContext(PerioperativeContext);
  const { searchPatients: searchPatientsApi } = useContext(WardContext);

  // State variables
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showNewChecklistModal, setShowNewChecklistModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState(null);
  const [activeSection, setActiveSection] = useState('preOperative');
  const [newChecklist, setNewChecklist] = useState({
    patientId: '',
    appointmentId: '',
    surgeryType: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    surgeon: '',
    anesthesiologist: '',
    operatingRoom: '',
    notes: ''
  });

  // Fetch upcoming procedures on component mount
  useEffect(() => {
    if (adminToken) {
      getUpcomingProcedures();
    }
  }, [adminToken]);

  // Search patients
  const searchPatients = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const patients = await searchPatientsApi(searchTerm, adminToken);
      setSearchResults(patients);
    } catch (error) {
      toast.error('Failed to search patients');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle patient selection
  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchTerm('');
    await getPatientChecklists(patient._id);
    setActiveTab('patient');
  };

  // Handle new checklist form change
  const handleNewChecklistChange = (e) => {
    const { name, value } = e.target;
    setNewChecklist(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle create new checklist
  const handleCreateChecklist = async (e) => {
    e.preventDefault();
    
    if (!newChecklist.patientId || !newChecklist.surgeryType || !newChecklist.scheduledDate || !newChecklist.surgeon) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await createChecklist(newChecklist);
      setShowNewChecklistModal(false);
      setNewChecklist({
        patientId: '',
        appointmentId: '',
        surgeryType: '',
        scheduledDate: format(new Date(), 'yyyy-MM-dd'),
        surgeon: '',
        anesthesiologist: '',
        operatingRoom: '',
        notes: ''
      });
      
      // Refresh the lists
      getUpcomingProcedures();
      if (selectedPatient) {
        getPatientChecklists(selectedPatient._id);
      }
    } catch (error) {
      toast.error('Failed to create checklist');
    }
  };

  // Handle view checklist
  const handleViewChecklist = async (checklistId) => {
    try {
      await getChecklist(checklistId);
      setShowChecklistModal(true);
    } catch (error) {
      toast.error('Failed to fetch checklist details');
    }
  };

  // Handle update checklist status
  const handleUpdateStatus = async (status, stage) => {
    if (!currentChecklist) return;
    
    try {
      await updateStatus(currentChecklist._id, { status, stage });
      toast.success(`Status updated to ${status}`);
      getUpcomingProcedures();
      if (selectedPatient) {
        getPatientChecklists(selectedPatient._id);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Handle delete checklist
  const handleDeleteChecklist = async () => {
    if (!checklistToDelete) return;
    
    try {
      await deleteChecklist(checklistToDelete);
      setShowDeleteConfirmation(false);
      setChecklistToDelete(null);
      setShowChecklistModal(false);
      
      // Refresh the lists
      getUpcomingProcedures();
      if (selectedPatient) {
        getPatientChecklists(selectedPatient._id);
      }
    } catch (error) {
      toast.error('Failed to delete checklist');
    }
  };

  // Handle update checklist section
  const handleUpdateChecklistSection = async (section, data) => {
    if (!currentChecklist) return;
    
    const updateData = {
      [section]: {
        ...currentChecklist[section],
        ...data
      }
    };
    
    try {
      await updateChecklist(currentChecklist._id, updateData);
      toast.success('Checklist updated successfully');
    } catch (error) {
      toast.error('Failed to update checklist');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pre-op-completed':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'post-op-completed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Calendar size={16} />;
      case 'pre-op-completed':
        return <CheckSquare size={16} />;
      case 'in-progress':
        return <Activity size={16} />;
      case 'post-op-completed':
        return <CheckSquare size={16} />;
      case 'completed':
        return <Check size={16} />;
      case 'cancelled':
        return <X size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Perioperative Care Management</h1>
        <button
          onClick={() => {
            setNewChecklist(prev => ({
              ...prev,
              patientId: selectedPatient?._id || ''
            }));
            setShowNewChecklistModal(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Procedure
        </button>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-t-lg ${activeTab === 'upcoming' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-200 text-gray-700'}`}
          >
            Upcoming Procedures
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            className={`px-4 py-2 rounded-t-lg ${activeTab === 'patient' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-gray-200 text-gray-700'}`}
          >
            Patient Search
          </button>
        </div>

        <div className={`p-4 bg-white rounded-b-lg rounded-tr-lg shadow-md ${darkMode ? 'bg-gray-800' : ''}`}>
          {activeTab === 'upcoming' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming Surgical Procedures</h2>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : upcomingProcedures.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle size={32} className="mx-auto mb-2" />
                  <p>No upcoming procedures found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surgeon</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {upcomingProcedures.map((procedure) => (
                        <tr key={procedure._id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium">{procedure.patientId?.name || 'N/A'}</div>
                                <div className="text-sm text-gray-500">{procedure.patientId?.contactNumber || 'N/A'}</div>
                              </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={currentChecklist.intraOperative?.anesthesia?.notes || ''}
                            onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                              anesthesia: {
                                ...currentChecklist.intraOperative?.anesthesia,
                                notes: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">{procedure.surgeryType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">{formatDate(procedure.scheduledDate)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">{procedure.surgeon?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{procedure.surgeon?.speciality || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(procedure.status)}`}>
                              {getStatusIcon(procedure.status)}
                              <span className="ml-1">{procedure.status.replace(/-/g, ' ')}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewChecklist(procedure._id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'patient' && (
            <div>
              <div className="mb-4">
                <div className="flex items-center">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Search patients by name or contact number"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {isSearching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <Search size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={searchPatients}
                    className="ml-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Search
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className={`mt-2 border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <ul className="divide-y divide-gray-200">
                      {searchResults.map((patient) => (
                        <li
                          key={patient._id}
                          onClick={() => handlePatientSelect(patient)}
                          className={`px-4 py-3 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-gray-500">{patient.contactNumber}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              <p>Age: {patient.age}</p>
                              <p>Gender: {patient.gender}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {selectedPatient ? (
                <div>
                  <div className={`p-4 mb-4 rounded-lg ${darkMode ? 'bg-gray-700' : ' #5f6FFF'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedPatient.name}</h3>
                        <p className="text-sm">
                          <span className="mr-3">{selectedPatient.age} years</span>
                          <span className="mr-3">{selectedPatient.gender}</span>
                          <span>{selectedPatient.contactNumber}</span>
                        </p>
                        {selectedPatient.diagnosis && (
                          <p className="mt-1 text-sm">
                            <span className="font-medium">Diagnosis:</span> {selectedPatient.diagnosis}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setNewChecklist(prev => ({
                            ...prev,
                            patientId: selectedPatient._id
                          }));
                          setShowNewChecklistModal(true);
                        }}
                        className="px-3 py-1 bg-primary-600 text-white rounded-lg flex items-center gap-1 hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Plus size={14} />
                        New Procedure
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-3">Surgical Procedures</h3>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : patientChecklists.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border rounded-lg">
                      <Clipboard size={32} className="mx-auto mb-2" />
                      <p>No procedures found for this patient</p>
                      <button
                        onClick={() => {
                          setNewChecklist(prev => ({
                            ...prev,
                            patientId: selectedPatient._id
                          }));
                          setShowNewChecklistModal(true);
                        }}
                        className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                        Add Procedure
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surgeon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {patientChecklists.map((checklist) => (
                            <tr key={checklist._id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium">{checklist.surgeryType}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">{formatDate(checklist.scheduledDate)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">{checklist.surgeon?.name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{checklist.surgeon?.speciality || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(checklist.status)}`}>
                                  {getStatusIcon(checklist.status)}
                                  <span className="ml-1">{checklist.status.replace(/-/g, ' ')}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleViewChecklist(checklist._id)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border rounded-lg">
                  <User size={32} className="mx-auto mb-2" />
                  <p>Search for a patient to view their surgical procedures</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Checklist Modal */}
      {showNewChecklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">New Surgical Procedure</h3>
              <button
                onClick={() => setShowNewChecklistModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateChecklist} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID*</label>
                  <input
                    type="text"
                    name="patientId"
                    value={newChecklist.patientId}
                    onChange={handleNewChecklistChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    readOnly={!!selectedPatient}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment ID (optional)</label>
                  <input
                    type="text"
                    name="appointmentId"
                    value={newChecklist.appointmentId}
                    onChange={handleNewChecklistChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Surgery Type*</label>
                  <input
                    type="text"
                    name="surgeryType"
                    value={newChecklist.surgeryType}
                    onChange={handleNewChecklistChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date*</label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={newChecklist.scheduledDate}
                    onChange={handleNewChecklistChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Surgeon ID*</label>
                  <input
                    type="text"
                    name="surgeon"
                    value={newChecklist.surgeon}
                    onChange={handleNewChecklistChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anesthesiologist ID (optional)</label>
                  <input
                    type="text"
                    name="anesthesiologist"
                    value={newChecklist.anesthesiologist}
                    onChange={handleNewChecklistChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating Room (optional)</label>
                <input
                  type="text"
                  name="operatingRoom"
                  value={newChecklist.operatingRoom}
                  onChange={handleNewChecklistChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={newChecklist.notes}
                  onChange={handleNewChecklistChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewChecklistModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Checklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checklist View Modal */}
      {showChecklistModal && currentChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-semibold">{currentChecklist.surgeryType}</h3>
                <p className="text-sm text-gray-500">
                  {formatDate(currentChecklist.scheduledDate)} • 
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(currentChecklist.status)}`}>
                    {getStatusIcon(currentChecklist.status)}
                    <span className="ml-1">{currentChecklist.status.replace(/-/g, ' ')}</span>
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setChecklistToDelete(currentChecklist._id);
                    setShowDeleteConfirmation(true);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => setShowChecklistModal(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Patient Information</h4>
                  <p className="font-medium">{currentChecklist.patientId?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">
                    {currentChecklist.patientId?.age && `${currentChecklist.patientId.age} years • `}
                    {currentChecklist.patientId?.gender && `${currentChecklist.patientId.gender} • `}
                    {currentChecklist.patientId?.contactNumber || 'No contact'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Surgical Team</h4>
                  <p>
                    <span className="font-medium">Surgeon:</span> {currentChecklist.surgeon?.name || 'N/A'}
                    {currentChecklist.surgeon?.speciality && ` (${currentChecklist.surgeon.speciality})`}
                  </p>
                  <p>
                    <span className="font-medium">Anesthesiologist:</span> {currentChecklist.anesthesiologist?.name || 'Not assigned'}
                  </p>
                  <p>
                    <span className="font-medium">Operating Room:</span> {currentChecklist.operatingRoom || 'Not assigned'}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveSection('preOperative')}
                    className={`px-4 py-2 font-medium ${activeSection === 'preOperative' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  >
                    Pre-operative
                  </button>
                  <button
                    onClick={() => setActiveSection('intraOperative')}
                    className={`px-4 py-2 font-medium ${activeSection === 'intraOperative' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  >
                    Intra-operative
                  </button>
                  <button
                    onClick={() => setActiveSection('postOperative')}
                    className={`px-4 py-2 font-medium ${activeSection === 'postOperative' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  >
                    Post-operative
                  </button>
                </div>
                
                {activeSection === 'preOperative' && (
                  <div className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-3">
                          <FileText size={16} />
                          Patient Consent
                        </h5>
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id="consentObtained"
                            checked={currentChecklist.preOperative?.patientConsent?.obtained || false}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              patientConsent: {
                                ...currentChecklist.preOperative?.patientConsent,
                                obtained: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="consentObtained" className="ml-2 block text-sm text-gray-900">
                            Consent obtained
                          </label>
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={currentChecklist.preOperative?.patientConsent?.date ? format(new Date(currentChecklist.preOperative.patientConsent.date), 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              patientConsent: {
                                ...currentChecklist.preOperative?.patientConsent,
                                date: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={currentChecklist.preOperative?.patientConsent?.notes || ''}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              patientConsent: {
                                ...currentChecklist.preOperative?.patientConsent,
                                notes: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-3">
                          <Clipboard size={16} />
                          Medical History
                        </h5>
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id="historyReviewed"
                            checked={currentChecklist.preOperative?.medicalHistory?.reviewed || false}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              medicalHistory: {
                                ...currentChecklist.preOperative?.medicalHistory,
                                reviewed: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="historyReviewed" className="ml-2 block text-sm text-gray-900">
                            Medical history reviewed
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={currentChecklist.preOperative?.medicalHistory?.notes || ''}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              medicalHistory: {
                                ...currentChecklist.preOperative?.medicalHistory,
                                notes: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-3">
                          <AlertCircle size={16} />
                          Allergies
                        </h5>
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id="allergiesChecked"
                            checked={currentChecklist.preOperative?.allergies?.checked || false}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              allergies: {
                                ...currentChecklist.preOperative?.allergies,
                                checked: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="allergiesChecked" className="ml-2 block text-sm text-gray-900">
                            Allergies checked
                          </label>
                        </div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">List of allergies</label>
                          <input
                            type="text"
                            value={(currentChecklist.preOperative?.allergies?.list || []).join(', ')}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              allergies: {
                                ...currentChecklist.preOperative?.allergies,
                                list: e.target.value.split(',').map(item => item.trim())
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Separate with commas"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={currentChecklist.preOperative?.allergies?.notes || ''}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              allergies: {
                                ...currentChecklist.preOperative?.allergies,
                                notes: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-3">
                          <Briefcase size={16} />
                          Medications
                        </h5>
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id="medicationsReviewed"
                            checked={currentChecklist.preOperative?.medications?.reviewed || false}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              medications: {
                                ...currentChecklist.preOperative?.medications,
                                reviewed: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="medicationsReviewed" className="ml-2 block text-sm text-gray-900">
                            Medications reviewed
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={currentChecklist.preOperative?.medications?.notes || ''}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              medications: {
                                ...currentChecklist.preOperative?.medications,
                                notes: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-3">
                          <Activity size={16} />
                          Lab Tests
                        </h5>
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id="labTestsCompleted"
                            checked={currentChecklist.preOperative?.labTests?.completed || false}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              labTests: {
                                ...currentChecklist.preOperative?.labTests,
                                completed: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="labTestsCompleted" className="ml-2 block text-sm text-gray-900">
                            Lab tests completed
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={currentChecklist.preOperative?.labTests?.notes || ''}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              labTests: {
                                ...currentChecklist.preOperative?.labTests,
                                notes: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-3">
                          <Eye size={16} />
                          Imaging
                        </h5>
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id="imagingCompleted"
                            checked={currentChecklist.preOperative?.imaging?.completed || false}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              imaging: {
                                ...currentChecklist.preOperative?.imaging,
                                completed: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="imagingCompleted" className="ml-2 block text-sm text-gray-900">
                            Imaging completed
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={currentChecklist.preOperative?.imaging?.notes || ''}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              imaging: {
                                ...currentChecklist.preOperative?.imaging,
                                notes: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h5 className="font-medium mb-3">Patient Instructions</h5>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            id="instructionsProvided"
                            checked={currentChecklist.preOperative?.patientInstructions?.provided || false}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              patientInstructions: {
                                ...currentChecklist.preOperative?.patientInstructions,
                                provided: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="instructionsProvided" className="ml-2 block text-sm text-gray-900">
                            Pre-operative instructions provided to patient
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fasting Instructions</label>
                            <textarea
                              value={currentChecklist.preOperative?.patientInstructions?.fastingInstructions || ''}
                              onChange={(e) => handleUpdateChecklistSection('preOperative', {
                                patientInstructions: {
                                  ...currentChecklist.preOperative?.patientInstructions,
                                  fastingInstructions: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="2"
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medication Instructions</label>
                            <textarea
                              value={currentChecklist.preOperative?.patientInstructions?.medicationInstructions || ''}
                              onChange={(e) => handleUpdateChecklistSection('preOperative', {
                                patientInstructions: {
                                  ...currentChecklist.preOperative?.patientInstructions,
                                  medicationInstructions: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="2"
                            ></textarea>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={currentChecklist.intraOperative?.anesthesia?.notes || ''}
                            onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                              anesthesia: {
                                ...currentChecklist.intraOperative?.anesthesia,
                                notes: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={currentChecklist.intraOperative?.anesthesia?.notes || ''}
                            onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                              anesthesia: {
                                ...currentChecklist.intraOperative?.anesthesia,
                                notes: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Instructions</label>
                          <textarea
                            value={currentChecklist.preOperative?.patientInstructions?.additionalInstructions || ''}
                            onChange={(e) => handleUpdateChecklistSection('preOperative', {
                              patientInstructions: {
                                ...currentChecklist.preOperative?.patientInstructions,
                                additionalInstructions: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => handleUpdateStatus('pre-op-completed', 'pre-op')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <CheckSquare size={16} />
                        Mark Pre-op Complete
                      </button>
                    </div>
                  </div>
                )}
                
                {activeSection === 'intraOperative' && (
                  <div className="mt-4">
                    <div className="border rounded-lg p-4 mb-4">
                      <h5 className="font-medium flex items-center gap-2 mb-3">
                        <CheckSquare size={16} />
                        Time Out
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id="timeOutCompleted"
                              checked={currentChecklist.intraOperative?.timeOut?.completed || false}
                              onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                                timeOut: {
                                  ...currentChecklist.intraOperative?.timeOut,
                                  completed: e.target.checked
                                }
                              })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="timeOutCompleted" className="ml-2 block text-sm text-gray-900">
                              Time out completed
                            </label>
                          </div>
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id="verifiedPatient"
                              checked={currentChecklist.intraOperative?.timeOut?.verifiedPatient || false}
                              onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                                timeOut: {
                                  ...currentChecklist.intraOperative?.timeOut,
                                  verifiedPatient: e.target.checked
                                }
                              })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="verifiedPatient" className="ml-2 block text-sm text-gray-900">
                              Patient identity verified
                            </label>
                          </div>
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id="verifiedProcedure"
                              checked={currentChecklist.intraOperative?.timeOut?.verifiedProcedure || false}
                              onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                                timeOut: {
                                  ...currentChecklist.intraOperative?.timeOut,
                                  verifiedProcedure: e.target.checked
                                }
                              })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="verifiedProcedure" className="ml-2 block text-sm text-gray-900">
                              Procedure verified
                            </label>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id="verifiedSite"
                              checked={currentChecklist.intraOperative?.timeOut?.verifiedSite || false}
                              onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                                timeOut: {
                                  ...currentChecklist.intraOperative?.timeOut,
                                  verifiedSite: e.target.checked
                                }
                              })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="verifiedSite" className="ml-2 block text-sm text-gray-900">
                              Surgical site verified
                            </label>
                          </div>
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id="verifiedEquipment"
                              checked={currentChecklist.intraOperative?.timeOut?.verifiedEquipment || false}
                              onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                                timeOut: {
                                  ...currentChecklist.intraOperative?.timeOut,
                                  verifiedEquipment: e.target.checked
                                }
                              })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="verifiedEquipment" className="ml-2 block text-sm text-gray-900">
                              Equipment verified
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                              value={currentChecklist.intraOperative?.timeOut?.notes || ''}
                              onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                                timeOut: {
                                  ...currentChecklist.intraOperative?.timeOut,
                                  notes: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="2"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-3">
                          <Zap size={16} />
                          Anesthesia
                        </h5>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={currentChecklist.intraOperative?.anesthesia?.type || ''}
                            onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                              anesthesia: {
                                ...currentChecklist.intraOperative?.anesthesia,
                                type: e.target.value
                              }
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select type</option>
                            <option value="General">General</option>
                            <option value="Regional">Regional</option>
                            <option value="Local">Local</option>
                            <option value="Sedation">Sedation</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={currentChecklist.intraOperative?.anesthesia?.startTime || ''}
                              onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                                anesthesia: {
                                  ...currentChecklist.intraOperative?.anesthesia,
                                  startTime: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                              type="time"
                              value={currentChecklist.intraOperative?.anesthesia?.endTime || ''}
                              onChange={(e) => handleUpdateChecklistSection('intraOperative', {
                                anesthesia: {
                                  ...currentChecklist.intraOperative?.anesthesia,
                                  endTime: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>