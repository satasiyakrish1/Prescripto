import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import CreateFamily from '../components/CreateFamily';
import EntryIDCard from '../components/EntryIDCard';

const FamilyList = () => {
    const { token, backendUrl } = useContext(AppContext);
    const [family, setFamily] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    useEffect(() => {
        if (token) {
            fetchFamily();
        }
    }, [token]);

    const fetchFamily = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendUrl}/api/family/get-family`, {
                headers: { token }
            });

            if (data.success) {
                setFamily(data.family);
            } else {
                setFamily(null);
            }
        } catch (error) {
            console.log(error);
            if (error.response?.status !== 404) {
                toast.error('Failed to fetch family data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (memberData) => {
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/family/add-member`,
                { member: memberData },
                { headers: { token } }
            );

            if (data.success) {
                toast.success(`Member added! Entry ID: ${data.entryId}`);
                setShowAddMember(false);
                fetchFamily();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to add family member');
        }
    };

    const handleDeleteMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this family member?')) {
            return;
        }

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/family/delete-member`,
                { memberId },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Member removed successfully');
                fetchFamily();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to remove family member');
        }
    };

    const copyEntryId = (entryId) => {
        navigator.clipboard.writeText(entryId);
        toast.success('Entry ID copied to clipboard!');
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center min-h-screen'>
                <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'></div>
            </div>
        );
    }

    return (
        <div className='max-w-7xl mx-auto p-6 min-h-screen'>
            {/* Header */}
            <div className='bg-white rounded-xl shadow-md p-6 mb-6'>
                <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                    <div>
                        <h1 className='text-3xl font-bold text-gray-800'>Family Members</h1>
                        <p className='text-gray-600 mt-2'>Manage your family members and their health IDs</p>
                    </div>
                    <button
                        onClick={() => setShowAddMember(true)}
                        className='bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition flex items-center gap-2 shadow-md'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Family Member
                    </button>
                </div>
            </div>

            {/* Family Members Grid */}
            {family && family.members && family.members.length > 0 ? (
                <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {family.members.map((member) => (
                        <div key={member._id} className='bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300'>
                            {/* Member Header */}
                            <div className='bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b'>
                                <div className='flex items-center gap-4'>
                                    <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold'>
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className='flex-1'>
                                        <h3 className='text-xl font-bold text-gray-800'>{member.name}</h3>
                                        <p className='text-sm text-blue-600 font-medium'>{member.relation}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Member Details */}
                            <div className='p-4 space-y-3'>
                                {/* Entry ID Display */}
                                <div className='bg-gradient-to-r from-primary to-blue-600 rounded-lg p-3 text-white'>
                                    <p className='text-xs opacity-80 uppercase tracking-wider mb-1'>Health Entry ID</p>
                                    <div className='flex justify-between items-center'>
                                        <p className='text-2xl font-bold tracking-widest'>{member.entryId}</p>
                                        <button
                                            onClick={() => copyEntryId(member.entryId)}
                                            className='bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition'
                                            title='Copy Entry ID'
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className='grid grid-cols-2 gap-3 text-sm'>
                                    {member.gender !== 'Not Selected' && (
                                        <div>
                                            <p className='text-gray-500'>Gender</p>
                                            <p className='font-semibold text-gray-800'>{member.gender}</p>
                                        </div>
                                    )}
                                    {member.bloodGroup && (
                                        <div>
                                            <p className='text-gray-500'>Blood Group</p>
                                            <p className='font-semibold text-gray-800'>{member.bloodGroup}</p>
                                        </div>
                                    )}
                                    {member.dateOfBirth && (
                                        <div className='col-span-2'>
                                            <p className='text-gray-500'>Date of Birth</p>
                                            <p className='font-semibold text-gray-800'>
                                                {new Date(member.dateOfBirth).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                    {member.phone && (
                                        <div className='col-span-2'>
                                            <p className='text-gray-500'>Phone</p>
                                            <p className='font-semibold text-gray-800'>{member.phone}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Medical Info */}
                                {(member.medicalConditions?.length > 0 || member.allergies?.length > 0) && (
                                    <div className='border-t pt-3 space-y-2'>
                                        {member.medicalConditions?.length > 0 && (
                                            <div>
                                                <p className='text-xs text-gray-500 mb-1'>Medical Conditions</p>
                                                <div className='flex flex-wrap gap-1'>
                                                    {member.medicalConditions.map((condition, idx) => (
                                                        <span key={idx} className='bg-blue-100 text-primary-700 text-xs px-2 py-1 rounded-full'>
                                                            {condition}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {member.allergies?.length > 0 && (
                                            <div>
                                                <p className='text-xs text-gray-500 mb-1'>Allergies</p>
                                                <div className='flex flex-wrap gap-1'>
                                                    {member.allergies.map((allergy, idx) => (
                                                        <span key={idx} className='bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full'>
                                                            {allergy}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className='bg-gray-50 px-4 py-3 flex gap-2'>
                                <button
                                    onClick={() => setSelectedMember(member)}
                                    className='flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition text-sm font-medium'
                                >
                                    View ID Card
                                </button>
                                <button
                                    onClick={() => handleDeleteMember(member._id)}
                                    className='bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium'
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className='bg-white rounded-xl shadow-md p-12 text-center'>
                    <div className='w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className='text-2xl font-bold text-gray-800 mb-2'>No Family Members Yet</h3>
                    <p className='text-gray-600 mb-6'>Start by adding your first family member to manage their health IDs</p>
                    <button
                        onClick={() => setShowAddMember(true)}
                        className='bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition inline-flex items-center gap-2'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add First Member
                    </button>
                </div>
            )}

            {/* Modals */}
            {showAddMember && (
                <CreateFamily
                    onMemberAdded={handleAddMember}
                    onClose={() => setShowAddMember(false)}
                />
            )}

            {selectedMember && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6'>
                        <div className='flex justify-between items-center mb-6'>
                            <h3 className='text-xl font-bold text-gray-800'>Health ID Card</h3>
                            <button
                                onClick={() => setSelectedMember(null)}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <EntryIDCard member={selectedMember} showDetails={true} />
                        <button
                            onClick={() => setSelectedMember(null)}
                            className='w-full mt-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition'
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyList;
