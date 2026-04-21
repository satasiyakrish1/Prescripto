import React, { useContext, useState, useEffect } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const BookingSettings = () => {
  const { dToken, profileData, getProfileData } = useContext(DoctorContext);
  const { currency, backendUrl } = useContext(AppContext);
  
  const [bookingMode, setBookingMode] = useState('default');
  const [normalFee, setNormalFee] = useState(0);
  const [customSlots, setCustomSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  
  const [slotForm, setSlotForm] = useState({
    startTime: '',
    endTime: '',
    price: 0,
    isPaymentRequired: true
  });

  useEffect(() => {
    if (profileData) {
      setBookingMode(profileData.bookingMode || 'default');
      setNormalFee(profileData.fees || 0);
      setCustomSlots(profileData.customSlots || []);
    }
  }, [profileData]);

  const calculateEmergencyFee = () => Math.round(normalFee * 1.5);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        bookingMode,
        fees: normalFee,
        customSlots: bookingMode === 'custom' ? customSlots : [],
        instantBookingSettings: {
          enabled: bookingMode === 'instant',
          normalFee: normalFee,
          emergencyFeeMultiplier: 1.5
        }
      };

      const { data } = await axios.post(
        backendUrl + '/api/doctor/booking-settings', 
        updateData, 
        { headers: { dToken } }
      );

      if (data.success) {
        toast.success(data.message || 'Booking settings updated successfully');
        await getProfileData();
      } else {
        toast.error(data.message || 'Failed to update booking settings');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomSlot = () => {
    if (!slotForm.startTime || !slotForm.endTime || slotForm.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newSlot = {
      id: editingSlot ? editingSlot.id : Date.now(),
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      price: slotForm.price,
      isPaymentRequired: slotForm.isPaymentRequired
    };

    if (editingSlot) {
      setCustomSlots(prev => prev.map(slot => 
        slot.id === editingSlot.id ? newSlot : slot
      ));
      setEditingSlot(null);
    } else {
      setCustomSlots(prev => [...prev, newSlot]);
    }

    setSlotForm({ startTime: '', endTime: '', price: 0, isPaymentRequired: true });
    setShowSlotForm(false);
    toast.success(editingSlot ? 'Slot updated successfully' : 'Slot added successfully');
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotForm({
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: slot.price,
      isPaymentRequired: slot.isPaymentRequired
    });
    setShowSlotForm(true);
  };

  const handleDeleteSlot = (slotId) => {
    setCustomSlots(prev => prev.filter(slot => slot.id !== slotId));
    toast.success('Slot deleted successfully');
  };

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Settings</h1>
              <p className="text-gray-600 mt-1">Configure how patients can book appointments with you</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Booking Mode Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mode 1: Instant Booking */}
              <div 
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  bookingMode === 'instant' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => setBookingMode('instant')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    bookingMode === 'instant' ? 'bg-primary text-white' : 'bg-gray-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Instant Booking</h3>
                    <p className="text-sm text-gray-500">With Emergency Option</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Patients can book the next available slot instantly. Emergency bookings available at 1.5x fee.
                </p>
              </div>

              {/* Mode 2: Custom Slots */}
              <div 
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  bookingMode === 'custom' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => setBookingMode('custom')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    bookingMode === 'custom' ? 'bg-primary text-white' : 'bg-gray-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Custom Slots</h3>
                    <p className="text-sm text-gray-500">Manual Time Slots</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Create custom time slots with specific prices. Full control over availability.
                </p>
              </div>

              {/* Mode 3: Default Fixed Slots */}
              <div 
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  bookingMode === 'default' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => setBookingMode('default')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    bookingMode === 'default' ? 'bg-primary text-white' : 'bg-gray-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Default Slots</h3>
                    <p className="text-sm text-gray-500">Fixed Time System</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Traditional fixed time slots. 30-minute intervals from 10 AM to 9 PM.
                </p>
              </div>
            </div>
          </div>

          {/* Mode-specific Settings */}
          {bookingMode === 'instant' && (
            <div className="mb-8 p-6  #5f6FFF rounded-xl border border-primary-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instant Booking Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Normal Consultation Fee ({currency})
                  </label>
                  <input
                    type="number"
                    value={normalFee}
                    onChange={(e) => setNormalFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter consultation fee"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Fee (Auto-calculated)
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                    <span className="text-lg font-semibold text-red-600">
                      {currency} {calculateEmergencyFee()}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">(1.5x normal fee)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {bookingMode === 'custom' && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Custom Time Slots</h3>
                <button
                  onClick={() => setShowSlotForm(true)}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Slot
                </button>
              </div>

              {showSlotForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">
                    {editingSlot ? 'Edit Slot' : 'Add New Slot'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        value={slotForm.startTime}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="time"
                        value={slotForm.endTime}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price ({currency})</label>
                      <input
                        type="number"
                        value={slotForm.price}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleAddCustomSlot}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {editingSlot ? 'Update Slot' : 'Add Slot'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSlotForm(false);
                        setEditingSlot(null);
                        setSlotForm({ startTime: '', endTime: '', price: 0, isPaymentRequired: true });
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {customSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No custom slots created yet</p>
                    <p className="text-sm">Click "Add Slot" to create your first custom time slot</p>
                  </div>
                ) : (
                  customSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          <p className="text-sm text-gray-500">
                            {currency} {slot.price}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSlot(slot)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {bookingMode === 'default' && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Slot Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Fee ({currency})
                  </label>
                  <input
                    type="number"
                    value={normalFee}
                    onChange={(e) => setNormalFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter consultation fee"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSettings;