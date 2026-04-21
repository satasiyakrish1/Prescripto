import React, { useState } from 'react';

const PharmacyProfile = () => {
  // Mock profile data
  const [profile, setProfile] = useState({
    name: 'City Central Pharmacy',
    email: 'pharmacy@prescripto.com',
    phone: '+1 (555) 123-4567',
    address: '123 Medical Plaza, Healthcare District, City',
    licenseNumber: 'PHR-2023-78945',
    operatingHours: '8:00 AM - 9:00 PM',
    pharmacistName: 'Dr. Sarah Johnson',
    pharmacistLicense: 'PL-2022-45678',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cGhhcm1hY3l8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [showToast, setShowToast] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = () => {
    setProfile(formData);
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 md:p-8">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-in-out">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Profile updated successfully!</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Pharmacy Profile</h1>
                  <p className="text-blue-100">Manage your pharmacy information and settings</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <button
                    onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                      isEditing 
                        ? 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg' 
                        : 'bg-white bg-opacity-20 text-white border-2 border-white border-opacity-30 hover:bg-opacity-30 backdrop-blur-sm'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancel</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Profile</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {isEditing ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pharmacy Image Section */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                      <div className="text-center">
                        <img
                          src={formData.image}
                          alt="Pharmacy"
                          className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-lg"
                          onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='14'%3EPharmacy Image%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pharmacy Image URL</label>
                        <input
                          type="url"
                          name="image"
                          value={formData.image}
                          onChange={handleChange}
                          className="w-full max-w-md mx-auto px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter image URL..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  {[
                    { name: 'name', label: 'Pharmacy Name', type: 'text', icon: '🏥' },
                    { name: 'email', label: 'Email Address', type: 'email', icon: '📧' },
                    { name: 'phone', label: 'Phone Number', type: 'tel', icon: '📞' },
                    { name: 'address', label: 'Address', type: 'text', icon: '📍' },
                    { name: 'licenseNumber', label: 'License Number', type: 'text', icon: '📋' },
                    { name: 'operatingHours', label: 'Operating Hours', type: 'text', icon: '🕒' },
                    { name: 'pharmacistName', label: 'Pharmacist Name', type: 'text', icon: '👨‍⚕️' },
                    { name: 'pharmacistLicense', label: 'Pharmacist License', type: 'text', icon: '🏆' }
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <span className="text-lg">{field.icon}</span>
                        <span>{field.label}</span>
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Profile Display */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Image Section */}
                  <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 text-center border border-gray-100">
                      <img
                        src={profile.image}
                        alt="Pharmacy"
                        className="w-40 h-40 rounded-2xl mx-auto mb-4 object-cover shadow-lg"
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='14'%3EPharmacy Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
                      <p className="text-gray-600 mt-1">Licensed Pharmacy</p>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'Email Address', value: profile.email, icon: '📧', color: 'from-primary to-blue-600' },
                        { label: 'Phone Number', value: profile.phone, icon: '📞', color: 'from-green-500 to-green-600' },
                        { label: 'Address', value: profile.address, icon: '📍', color: 'from-purple-500 to-purple-600' },
                        { label: 'License Number', value: profile.licenseNumber, icon: '📋', color: 'from-orange-500 to-orange-600' },
                        { label: 'Operating Hours', value: profile.operatingHours, icon: '🕒', color: 'from-teal-500 to-teal-600' },
                        { label: 'Pharmacist Name', value: profile.pharmacistName, icon: '👨‍⚕️', color: 'from-indigo-500 to-indigo-600' },
                        { label: 'Pharmacist License', value: profile.pharmacistLicense, icon: '🏆', color: 'from-pink-500 to-pink-600' }
                      ].map((item, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-200">
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center text-white text-lg font-medium shadow-md`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-500 mb-1">{item.label}</h3>
                              <p className="text-lg text-gray-900 font-medium break-words">{item.value}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-medium">Active Status</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-blue-800 font-medium">Verified License</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-800 font-medium">Premium Member</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyProfile;