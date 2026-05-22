import React, { useState, useEffect, useContext } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import EditVehicleModal from '../../components/EditVehicleModal';
import { 
  Plus, 
  MapPin, 
  Settings, 
  Trash2, 
  Edit3, 
  Activity,
  Truck,
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react';

const VehicleManagement = () => {
    const { aToken, handle401Error } = useContext(AdminContext);
    const { backendUrl } = useContext(AppContext);
    const { darkMode } = useTheme();
    
    const [vehicles, setVehicles] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({
        vehicleNumber: '',
        type: 'ambulance',
        model: '',
        capacity: 1,
        features: [],
        status: 'available',
        currentDriver: {
            name: '',
            contactNumber: '',
            licenseNumber: '',
            isAvailable: true
        },
        fuelType: '',
        currentLocation: '',
        notes: ''
    });
    const [maintenanceForm, setMaintenanceForm] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        cost: 0,
        performedBy: ''
    });
    const [featureInput, setFeatureInput] = useState('');
    const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds refresh
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState(null);

    useEffect(() => {
        fetchVehicleData();
        fetchVehicleStats();

        // Set up real-time updates
        const intervalId = setInterval(() => {
            fetchVehicleData();
            fetchVehicleStats();
        }, refreshInterval);

        return () => clearInterval(intervalId);
    }, [refreshInterval, aToken]);

    const fetchVehicleData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/admin/vehicle/all`, { headers: { aToken } });
            setVehicles(response.data || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching vehicle data:', error);
            setVehicles([]);
            setError(error.message || 'Failed to fetch vehicles');
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to fetch vehicles');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicleStats = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/admin/vehicle/stats`, { headers: { aToken } });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching vehicle stats:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to fetch vehicle statistics');
            }
            setStats(null);
        }
    };

    const handleStatusChange = async (vehicleId, newStatus) => {
        try {
            await axios.patch(
                `${backendUrl}/api/admin/vehicle/${vehicleId}/status`,
                { status: newStatus },
                { headers: { aToken } }
            );
            toast.success(`Vehicle status updated to ${newStatus}`);
            fetchVehicleData(); // Refresh vehicle data
        } catch (error) {
            console.error('Error updating vehicle status:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to update vehicle status');
            }
        }
    };

    const handleAddFeature = () => {
        if (featureInput.trim()) {
            setVehicleForm(prev => ({
                ...prev,
                features: [...prev.features, featureInput.trim()]
            }));
            setFeatureInput('');
        }
    };

    const handleRemoveFeature = (index) => {
        setVehicleForm(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            // Handle nested properties (e.g., currentDriver.name)
            const [parent, child] = name.split('.');
            setVehicleForm(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else if (name === 'capacity') {
            setVehicleForm(prev => ({
                ...prev,
                [name]: parseInt(value) || 1
            }));
        } else {
            setVehicleForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleMaintenanceInputChange = (e) => {
        const { name, value } = e.target;
        setMaintenanceForm(prev => ({
            ...prev,
            [name]: name === 'cost' ? (parseFloat(value) || 0) : value
        }));
    };

    const handleSubmitVehicle = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `${backendUrl}/api/admin/vehicle/create`,
                vehicleForm,
                { headers: { aToken } }
            );
            
            toast.success('Vehicle added successfully');
            setIsModalOpen(false);
            setVehicleForm({
                vehicleNumber: '',
                type: 'ambulance',
                model: '',
                capacity: 1,
                features: [],
                status: 'available',
                currentDriver: {
                    name: '',
                    contactNumber: '',
                    licenseNumber: '',
                    isAvailable: true
                },
                fuelType: '',
                currentLocation: '',
                notes: ''
            });
            
            fetchVehicleData();
            fetchVehicleStats();
        } catch (error) {
            console.error('Error creating vehicle:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to add vehicle');
            }
        }
    };

    const handleSubmitMaintenance = async (e) => {
        e.preventDefault();
        try {
            if (!selectedVehicle) return;
            
            await axios.post(
                `${backendUrl}/api/admin/vehicle/${selectedVehicle._id}/maintenance`,
                maintenanceForm,
                { headers: { aToken } }
            );
            
            toast.success('Maintenance record added');
            setIsMaintenanceModalOpen(false);
        } catch (error) {
            console.error('Error adding maintenance record:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to add maintenance record');
            }
        }
    };

    const handleEditClick = (vehicle) => {
        setSelectedVehicleForEdit(vehicle);
        setIsEditModalOpen(true);
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
            return;
        }
        try {
            await axios.delete(
                `${backendUrl}/api/admin/vehicle/${vehicleId}`,
                { headers: { aToken } }
            );
            toast.success('Vehicle deleted successfully');
            fetchVehicleData();
            fetchVehicleStats();
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            if (!handle401Error(error)) {
                toast.error(error.response?.data?.message || 'Failed to delete vehicle');
            }
        }
    };

    const openMaintenanceModal = (vehicle) => {
        setSelectedVehicle(vehicle);
        setIsMaintenanceModalOpen(true);
    };

    const getStatusColor = (status) => {
        const baseClasses = darkMode ? 'dark:' : '';
        switch (status) {
            case 'available': 
                return darkMode 
                    ? 'bg-green-900/20 text-green-400' 
                    : 'bg-green-100 text-green-800';
            case 'in_use': 
                return darkMode 
                    ? 'bg-blue-900/20 text-blue-400' 
                    : 'bg-blue-100 text-blue-800';
            case 'maintenance': 
                return darkMode 
                    ? 'bg-amber-900/20 text-amber-400' 
                    : 'bg-yellow-100 text-yellow-800';
            case 'out_of_service': 
                return darkMode 
                    ? 'bg-red-900/20 text-red-400' 
                    : 'bg-red-100 text-red-800';
            default: 
                return darkMode 
                    ? 'bg-gray-700/50 text-gray-300' 
                    : 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading && vehicles.length === 0) {
        return (
            <div className={`flex justify-center items-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className={`p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
            {/* Minimalistic Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg`}>
                            <Truck className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div>
                            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Vehicle Management
                            </h1>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Manage hospital fleet and track vehicle status
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:opacity-90 transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Vehicle</span>
                    </button>
                </div>
            </div>
            
            {/* Minimalistic Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Total</p>
                                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalVehicles}</p>
                            </div>
                            <div className={`p-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg`}>
                                <Truck className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                        </div>
                    </div>
                    
                    <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Available</p>
                                <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.byStatus.available}</p>
                            </div>
                            <div className={`p-2 ${darkMode ? 'bg-green-900/20' : 'bg-green-50'} rounded-lg`}>
                                <Activity className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                            </div>
                        </div>
                    </div>
                    
                    <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>In Use</p>
                                <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.byStatus.inUse}</p>
                            </div>
                            <div className={`p-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg`}>
                                <Users className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                        </div>
                    </div>
                    
                    <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} p-4 rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Maintenance</p>
                                <p className={`text-2xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{stats.byStatus.maintenance}</p>
                            </div>
                            <div className={`p-2 ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} rounded-lg`}>
                                <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Minimalistic Vehicle Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                        <div key={vehicle._id} className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'} p-4 hover:shadow-lg transition-all duration-200`}>
                            {/* Vehicle Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg`}>
                                        <Truck className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.vehicleNumber}
                                        </h3>
                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {vehicle.model}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status)}`}>
                                    {vehicle.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Vehicle Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type</span>
                                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {vehicle.type.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Capacity</span>
                                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {vehicle.capacity} persons
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Driver</span>
                                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {vehicle.currentDriver?.name || 'Not assigned'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Location</span>
                                    <div className="flex items-center space-x-1">
                                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {vehicle.currentLocation || 'Unknown'}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (navigator.geolocation) {
                                                    navigator.geolocation.getCurrentPosition(
                                                        async (position) => {
                                                            try {
                                                                const { latitude, longitude } = position.coords;
                                                                await axios.patch(
                                                                    `${backendUrl}/api/admin/vehicle/${vehicle._id}/location`,
                                                                    { latitude, longitude },
                                                                    { headers: { aToken } }
                                                                );
                                                                toast.success('Location updated successfully');
                                                                fetchVehicleData();
                                                            } catch (error) {
                                                                console.error('Error updating location:', error);
                                                                toast.error('Failed to update location');
                                                            }
                                                        },
                                                        (error) => {
                                                            console.error('Error getting location:', error);
                                                            toast.error('Failed to get current location');
                                                        }
                                                    );
                                                } else {
                                                    toast.error('Geolocation is not supported by this browser');
                                                }
                                            }}
                                            className={`p-1 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} rounded transition-colors`}
                                            title="Update GPS Location"
                                        >
                                            <MapPin className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Next Maintenance</span>
                                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {formatDate(vehicle.maintenanceSchedule?.nextMaintenance)}
                                    </span>
                                </div>
                            </div>

                            {/* Status Selector */}
                            <div className="mb-3">
                                <select
                                    className={`w-full text-xs border rounded-lg p-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                    value={vehicle.status}
                                    onChange={(e) => handleStatusChange(vehicle._id, e.target.value)}
                                >
                                    <option value="available">Available</option>
                                    <option value="in_use">In Use</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="out_of_service">Out of Service</option>
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(vehicle)}
                                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => openMaintenanceModal(vehicle)}
                                    className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'bg-amber-900/20 text-amber-400 hover:bg-amber-900/30' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                >
                                    <Settings className="w-3 h-3" />
                                    <span>Maintain</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteVehicle(vehicle._id)}
                                    className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No vehicles found</p>
                        <p className="text-sm">{error ? `Error: ${error}` : 'Add your first vehicle to get started'}</p>
                    </div>
                )}
            </div>
            
            {/* Add Maintenance Modal */}
            <Transition appear show={isMaintenanceModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => setIsMaintenanceModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 text-left align-middle shadow-xl transition-all`}>
                                    <Dialog.Title
                                        as="h3"
                                        className={`text-lg font-medium leading-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}
                                    >
                                        Add Maintenance Record
                                    </Dialog.Title>
                                    
                                    <form onSubmit={handleSubmitMaintenance}>
                                        <div className="grid grid-cols-1 gap-4 mb-4">
                                            <div>
                                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={maintenanceForm.date}
                                                    onChange={handleMaintenanceInputChange}
                                                    className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                                    Description
                                                </label>
                                                <textarea
                                                    name="description"
                                                    value={maintenanceForm.description}
                                                    onChange={handleMaintenanceInputChange}
                                                    className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                    rows="3"
                                                    required
                                                ></textarea>
                                            </div>
                                            
                                            <div>
                                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                                    Cost
                                                </label>
                                                <input
                                                    type="number"
                                                    name="cost"
                                                    value={maintenanceForm.cost}
                                                    onChange={handleMaintenanceInputChange}
                                                    className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                                    Performed By
                                                </label>
                                                <input
                                                    type="text"
                                                    name="performedBy"
                                                    value={maintenanceForm.performedBy}
                                                    onChange={handleMaintenanceInputChange}
                                                    className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                                                onClick={() => setIsMaintenanceModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Save Record
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            
            {/* Add Vehicle Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className={`w-full max-w-2xl transform overflow-hidden rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 text-left align-middle shadow-xl transition-all`}>
                                    <Dialog.Title
                                        as="h3"
                                        className={`text-lg font-medium leading-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}
                                    >
                                        Add New Vehicle
                                    </Dialog.Title>
                                    
                                    <form onSubmit={handleSubmitVehicle}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Vehicle Number
                                                </label>
                                                <input
                                                    type="text"
                                                    name="vehicleNumber"
                                                    value={vehicleForm.vehicleNumber}
                                                    onChange={handleInputChange}
                                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Type
                                                </label>
                                                <select
                                                    name="type"
                                                    value={vehicleForm.type}
                                                    onChange={handleInputChange}
                                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                >
                                                    <option value="ambulance">Ambulance</option>
                                                    <option value="mobile_clinic">Mobile Clinic</option>
                                                    <option value="transport_van">Transport Van</option>
                                                    <option value="emergency_response">Emergency Response</option>
                                                    <option value="utility_vehicle">Utility Vehicle</option>
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Model
                                                </label>
                                                <input
                                                    type="text"
                                                    name="model"
                                                    value={vehicleForm.model}
                                                    onChange={handleInputChange}
                                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Capacity
                                                </label>
                                                <input
                                                    type="number"
                                                    name="capacity"
                                                    value={vehicleForm.capacity}
                                                    onChange={handleInputChange}
                                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                    min="1"
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Fuel Type
                                                </label>
                                                <input
                                                    type="text"
                                                    name="fuelType"
                                                    value={vehicleForm.fuelType}
                                                    onChange={handleInputChange}
                                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Current Location
                                                </label>
                                                <input
                                                    type="text"
                                                    name="currentLocation"
                                                    value={vehicleForm.currentLocation}
                                                    onChange={handleInputChange}
                                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                />
                                            </div>
                                            
                                            <div className="md:col-span-2">
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Features
                                                </label>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={featureInput}
                                                        onChange={(e) => setFeatureInput(e.target.value)}
                                                        className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                        placeholder="Add a feature"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddFeature}
                                                        className="px-3 py-2 bg-black text-white rounded-lg hover:opacity-90"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {vehicleForm.features.map((feature, index) => (
                                                        <div key={index} className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-full flex items-center`}>
                                                            <span className="text-xs">{feature}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveFeature(index)}
                                                                className="ml-2 text-gray-500 hover:text-red-500 text-sm"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="md:col-span-2">
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Notes
                                                </label>
                                                <textarea
                                                    name="notes"
                                                    value={vehicleForm.notes}
                                                    onChange={handleInputChange}
                                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                    rows="3"
                                                ></textarea>
                                            </div>
                                            
                                            <div className="md:col-span-2">
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Driver Information
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                                    <input
                                                        type="text"
                                                        name="currentDriver.name"
                                                        value={vehicleForm.currentDriver.name}
                                                        onChange={handleInputChange}
                                                        className={`md:col-span-4 border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                        placeholder="Driver Name"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="currentDriver.contactNumber"
                                                        value={vehicleForm.currentDriver.contactNumber}
                                                        onChange={handleInputChange}
                                                        className={`md:col-span-4 border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                        placeholder="Contact Number"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="currentDriver.licenseNumber"
                                                        value={vehicleForm.currentDriver.licenseNumber}
                                                        onChange={handleInputChange}
                                                        className={`md:col-span-4 border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                                                        placeholder="License Number"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                className={`px-4 py-2 text-sm border rounded-lg ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                                onClick={() => setIsModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:opacity-90"
                                            >
                                                Add Vehicle
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Edit Vehicle Modal */}
            <EditVehicleModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                vehicle={selectedVehicleForEdit}
                onVehicleUpdated={() => {
                    fetchVehicleData();
                    fetchVehicleStats();
                    setIsEditModalOpen(false);
                }}
            />
        </div>
    );
};

export default VehicleManagement;
