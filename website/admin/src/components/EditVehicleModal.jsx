import React, { useState, useEffect, useContext } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import axios from 'axios';
import { AdminContext } from '../context/AdminContext';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

// Form sections for better organization
const FORM_SECTIONS = {
  BASIC_INFO: 'Basic Information',
  FEATURES: 'Features & Capabilities',
  DRIVER_INFO: 'Driver Details',
  LOCATION: 'Location & Status'
};

const EditVehicleModal = ({ isOpen, onClose, vehicle, onVehicleUpdated }) => {
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [activeSection, setActiveSection] = useState(FORM_SECTIONS.BASIC_INFO);
  
  const initialFormState = {
    vehicleNumber: '',
    type: '',
    model: '',
    capacity: 1,
    features: [],
    status: '',
    fuelType: '',
    currentLocation: '',
    notes: '',
    currentDriver: {
      name: '',
      contactNumber: '',
      licenseNumber: '',
      isAvailable: true
    }
  };
  
  const [vehicleForm, setVehicleForm] = useState(initialFormState);

  useEffect(() => {
    if (vehicle) {
      setVehicleForm({
        ...vehicle,
        currentDriver: vehicle.currentDriver || {
          name: '',
          contactNumber: '',
          licenseNumber: '',
          isAvailable: true
        }
      });
    }
  }, [vehicle]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.put(
        `${backendUrl}/api/admin/vehicle/${vehicle._id}`,
        vehicleForm,
        { headers: { aToken } }
      );
      
      toast.success('Vehicle updated successfully');
      onVehicleUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error(error.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfoSection = () => (
    <div className="space-y-5">
      <h4 className="font-medium text-gray-700 text-base">Vehicle Details</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
          <input
            type="text"
            name="vehicleNumber"
            value={vehicleForm.vehicleNumber}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <input
            type="text"
            name="model"
            value={vehicleForm.model}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            name="type"
            value={vehicleForm.type}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            <option value="ambulance">Ambulance</option>
            <option value="patient_transport">Patient Transport</option>
            <option value="medical_supply">Medical Supply</option>
            <option value="staff_transport">Staff Transport</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
          <input
            type="number"
            name="capacity"
            value={vehicleForm.capacity}
            onChange={handleInputChange}
            min="1"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
          <select
            name="fuelType"
            value={vehicleForm.fuelType}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Fuel Type</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderFeaturesSection = () => (
    <div className="space-y-5">
      <h4 className="font-medium text-gray-700 text-base">Features & Equipment</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Add feature (e.g., Stretcher, Oxygen)"
          />
          <button
            type="button"
            onClick={handleAddFeature}
            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-600 flex items-center justify-center min-w-fit"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
        
        <div className="mt-3 bg-gray-50 p-3 rounded-md">
          {vehicleForm.features.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {vehicleForm.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No features added yet</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          value={vehicleForm.notes}
          onChange={handleInputChange}
          rows="3"
          placeholder="Additional information about vehicle capabilities, limitations, etc."
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderDriverInfoSection = () => (
    <div className="space-y-5">
      <h4 className="font-medium text-gray-700 text-base">Driver Information</h4>
      
      <div className="bg-gray-50 p-4 rounded-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
          <input
            type="text"
            name="currentDriver.name"
            value={vehicleForm.currentDriver.name}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              type="text"
              name="currentDriver.contactNumber"
              value={vehicleForm.currentDriver.contactNumber}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
            <input
              type="text"
              name="currentDriver.licenseNumber"
              value={vehicleForm.currentDriver.licenseNumber}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center pt-2">
          <input
            type="checkbox"
            id="driverAvailable"
            name="currentDriver.isAvailable"
            checked={vehicleForm.currentDriver?.isAvailable}
            onChange={(e) => {
              setVehicleForm(prev => ({
                ...prev,
                currentDriver: {
                  ...prev.currentDriver,
                  isAvailable: e.target.checked
                }
              }));
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="driverAvailable" className="ml-2 block text-sm text-gray-700">
            Driver is available for assignments
          </label>
        </div>
      </div>
    </div>
  );

  const renderLocationSection = () => (
    <div className="space-y-5">
      <h4 className="font-medium text-gray-700 text-base">Location & Status</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
          <input
            type="text"
            name="currentLocation"
            value={vehicleForm.currentLocation}
            onChange={handleInputChange}
            placeholder="e.g., Hospital Parking, Dispatch Center"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={vehicleForm.status}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </div>
      </div>
      
      {vehicleForm.status === 'maintenance' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Notes</label>
          <textarea
            name="maintenanceNotes"
            value={vehicleForm.maintenanceNotes || ''}
            onChange={handleInputChange}
            rows="2"
            placeholder="Describe maintenance issues or schedule"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}
      
      {vehicleForm.status === 'out_of_service' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Out of Service Reason</label>
          <textarea
            name="outOfServiceReason"
            value={vehicleForm.outOfServiceReason || ''}
            onChange={handleInputChange}
            rows="2"
            placeholder="Reason for being out of service"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );

  // Renders appropriate section based on active tab
  const renderFormSection = () => {
    switch (activeSection) {
      case FORM_SECTIONS.BASIC_INFO:
        return renderBasicInfoSection();
      case FORM_SECTIONS.FEATURES:
        return renderFeaturesSection();
      case FORM_SECTIONS.DRIVER_INFO:
        return renderDriverInfoSection();
      case FORM_SECTIONS.LOCATION:
        return renderLocationSection();
      default:
        return renderBasicInfoSection();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="bg-primary-600 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <Dialog.Title as="h3" className="text-lg font-medium text-white">
                      Edit Vehicle: {vehicleForm.vehicleNumber}
                    </Dialog.Title>
                    <button 
                      onClick={onClose}
                      className="text-white hover:text-blue-200 focus:outline-none"
                      aria-label="Close dialog"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="flex border-b border-gray-200">
                    {Object.values(FORM_SECTIONS).map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`px-4 py-3 text-sm font-medium ${
                          activeSection === section
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveSection(section)}
                      >
                        {section}
                      </button>
                    ))}
                  </div>

                  <div className="px-6 py-6">
                    {renderFormSection()}
                  </div>

                  <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditVehicleModal;