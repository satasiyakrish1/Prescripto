import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const DoctorProfile = () => {
    const { dToken, profileData, setProfileData, getProfileData } = useContext(DoctorContext)
    const { currency, backendUrl } = useContext(AppContext)
    const [isEdit, setIsEdit] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const validateForm = () => {
        const newErrors = {}

        if (!profileData.about?.trim()) {
            newErrors.about = 'About section is required'
        }

        if (!profileData.fees || profileData.fees < 0) {
            newErrors.fees = 'Valid appointment fee is required'
        }

        if (!profileData.address?.line1?.trim()) {
            newErrors.address = 'Address is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const updateProfile = async () => {
        if (!validateForm()) {
            toast.error('Please fill in all required fields correctly')
            return
        }

        setIsLoading(true)
        try {
            const updateData = {
                address: profileData.address,
                fees: profileData.fees,
                about: profileData.about,
                available: profileData.available
            }

            const { data } = await axios.post(
                backendUrl + '/api/doctor/update-profile',
                updateData,
                { headers: { dToken } }
            )

            if (data.success) {
                toast.success(data.message || 'Profile updated successfully')
                setIsEdit(false)
                setErrors({})
                await getProfileData()
            } else {
                toast.error(data.message || 'Failed to update profile')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'An error occurred while updating profile')
            console.error('Profile update error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const changeAvailability = async () => {
        try {
            const newAvailability = !profileData.available
            setProfileData(prev => ({ ...prev, available: newAvailability }))

            const { data } = await axios.post(
                backendUrl + '/api/doctor/change-availability',
                { docId: profileData._id },
                { headers: { dToken } }
            )

            if (data.success) {
                toast.success(data.message || 'Availability updated')
            } else {
                toast.error(data.message || 'Failed to update availability')
                setProfileData(prev => ({ ...prev, available: !newAvailability }))
            }
        } catch (error) {
            console.error(error)
            setProfileData(prev => ({ ...prev, available: !profileData.available }))
            toast.error('Could not update availability')
        }
    }

    const handleCancel = () => {
        setIsEdit(false)
        setErrors({})
        getProfileData()
    }

    useEffect(() => {
        if (dToken) {
            getProfileData()
        }
    }, [dToken])

    if (!profileData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    // N/A Helper
    const displayValue = (value) => {
        return value || 'N/A'
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-4">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Profile & Settings</h1>
                    <p className="text-sm text-gray-500 mt-1 font-light">Manage your public profile and clinic details.</p>
                </div>
                {isEdit ? (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all focus:ring-2 focus:ring-gray-100 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={updateProfile}
                            disabled={isLoading}
                            className="px-5 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 transition-all shadow-sm focus:ring-2 focus:ring-gray-200 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEdit(true)}
                        className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar: Avatar & Status */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center text-center shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                        <div className="relative mb-5 group">
                            <div className="w-32 h-32 rounded-full p-1 bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                                <img
                                    className="w-full h-full rounded-full object-cover"
                                    src={profileData.image}
                                    alt=""
                                />
                            </div>
                            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-white ${profileData.available ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                            {displayValue(profileData.name)}
                        </h2>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                {displayValue(profileData.speciality)}
                            </span>
                        </div>

                        <div className="w-full pt-6 border-t border-gray-100 flex justify-around">
                            <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Exp.</p>
                                <p className="text-gray-900 font-semibold">{displayValue(profileData.experience)}</p>
                            </div>
                            <div className="w-px bg-gray-100 h-10"></div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Degree</p>
                                <p className="text-gray-900 font-semibold">{displayValue(profileData.degree)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Availability</h3>
                            <div className={`h-2 w-2 rounded-full ${profileData.available ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm text-gray-600 font-medium">Online Booking</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={profileData.available}
                                    onChange={changeAvailability}
                                />
                                <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-100 transition-colors duration-200 ease-in-out cursor-pointer ${profileData.available ? 'bg-emerald-500' : 'bg-gray-300'} peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all`}></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Main Content: editable details */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            About & Bio
                        </h3>

                        {isEdit ? (
                            <div className="space-y-2">
                                <textarea
                                    onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))}
                                    className={`w-full p-4 text-sm text-gray-700 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300 ${errors.about ? 'border-red-500' : 'border-gray-200'}`}
                                    rows={6}
                                    value={profileData.about}
                                    placeholder="Write a short professional biography..."
                                />
                                {errors.about && <p className="text-red-500 text-xs pl-1">{errors.about}</p>}
                            </div>
                        ) : (
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                {displayValue(profileData.about)}
                            </p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Practice Details</h3>
                            <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fees</span>
                                <span className="ml-2 text-sm font-bold text-gray-900">
                                    {isEdit ? '' : `${currency} ${displayValue(profileData.fees)}`}
                                </span>
                                {isEdit && (
                                    <input
                                        type="number"
                                        onChange={(e) => setProfileData(prev => ({ ...prev, fees: e.target.value }))}
                                        value={profileData.fees}
                                        className="w-16 ml-1 bg-transparent border-b border-gray-300 focus:border-indigo-500 text-right font-bold text-gray-900 outline-none p-0 text-sm"
                                        placeholder="0"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Address Line 1</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        onChange={(e) => setProfileData(prev => ({
                                            ...prev,
                                            address: { ...prev.address, line1: e.target.value }
                                        }))}
                                        value={profileData.address?.line1 || ''}
                                        className={`w-full p-2.5 text-sm bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none ${errors.address ? 'border-red-500' : 'border-gray-200'}`}
                                        placeholder="Street Address"
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-gray-700">{displayValue(profileData.address?.line1)}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Address Line 2</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        onChange={(e) => setProfileData(prev => ({
                                            ...prev,
                                            address: { ...prev.address, line2: e.target.value }
                                        }))}
                                        value={profileData.address?.line2 || ''}
                                        className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                        placeholder="City, Region, Postal Code"
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-gray-700">{displayValue(profileData.address?.line2)}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DoctorProfile