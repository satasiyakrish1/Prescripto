import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const CreateFamily = ({ onMemberAdded, onClose }) => {
    const { backendUrl, token } = useContext(AppContext);
    const [memberData, setMemberData] = useState({
        name: '',
        relation: '',
        dateOfBirth: '',
        gender: 'Not Selected',
        bloodGroup: '',
        phone: '',
        email: '',
        medicalConditions: [],
        allergies: []
    });

    const [conditionInput, setConditionInput] = useState('');
    const [allergyInput, setAllergyInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const relationOptions = [
        'Father', 'Mother', 'Spouse', 'Son', 'Daughter', 
        'Brother', 'Sister', 'Grandfather', 'Grandmother', 
        'Uncle', 'Aunt', 'Cousin', 'Other'
    ];

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    // Debounced search for existing users
    useEffect(() => {
        let timeoutId;
        const fetchUsers = async () => {
            try {
                setIsSearching(true);
                const { data } = await axios.get(`${backendUrl}/api/user/search`, {
                    headers: { token },
                    params: { q: searchQuery }
                });
                setSearchResults(data.success ? data.users : []);
            } catch (error) {
                console.log(error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        if (searchQuery && searchQuery.trim().length >= 2) {
            timeoutId = setTimeout(fetchUsers, 400);
        } else {
            setSearchResults([]);
        }

        return () => clearTimeout(timeoutId);
    }, [searchQuery, backendUrl, token]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setMemberData(prev => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
            gender: user.gender || prev.gender,
            dateOfBirth: user.dob || prev.dateOfBirth,
            // add hidden link id
            memberUserId: user._id
        }));
        setSearchQuery(user.name || user.email || '');
        setSearchResults([]);
    };

    const handleAddCondition = () => {
        if (conditionInput.trim()) {
            setMemberData({
                ...memberData,
                medicalConditions: [...memberData.medicalConditions, conditionInput.trim()]
            });
            setConditionInput('');
        }
    };

    const handleRemoveCondition = (index) => {
        const newConditions = [...memberData.medicalConditions];
        newConditions.splice(index, 1);
        setMemberData({
            ...memberData,
            medicalConditions: newConditions
        });
    };

    const handleAddAllergy = () => {
        if (allergyInput.trim()) {
            setMemberData({
                ...memberData,
                allergies: [...memberData.allergies, allergyInput.trim()]
            });
            setAllergyInput('');
        }
    };

    const handleRemoveAllergy = (index) => {
        const newAllergies = [...memberData.allergies];
        newAllergies.splice(index, 1);
        setMemberData({
            ...memberData,
            allergies: newAllergies
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Enforce selection of an existing Prescripto user
        if (!memberData.memberUserId) {
            return toast.error('Please select an existing Prescripto user to link.');
        }

        if (!memberData.name || !memberData.relation) {
            return toast.error('Please fill in name and relation');
        }

        onMemberAdded(memberData);
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto'>
            <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8'>
                <div className='bg-gradient-to-r from-primary to-blue-600 text-white p-6 rounded-t-xl'>
                    <div className='flex justify-between items-center'>
                        <h2 className='text-2xl font-bold'>Add Family Member</h2>
                        <button onClick={onClose} className='text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition'>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className='p-6 space-y-6 max-h-[70vh] overflow-y-auto'>
                    {/* Search existing Prescripto users (Required) */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Search Prescripto User (required)</label>
                        <div className='relative'>
                            <input
                                type='text'
                                placeholder='Search by name, email, or phone'
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isSearching && (
                                <div className='absolute right-3 top-2.5 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500'></div>
                            )}
                        </div>
                        {!memberData.memberUserId && (
                            <p className='mt-1 text-xs text-red-600'>You must link to an existing Prescripto user.</p>
                        )}
                        {searchResults.length > 0 && (
                            <div className='mt-2 border border-gray-200 rounded-lg max-h-56 overflow-y-auto shadow-sm'>
                                {searchResults.map(user => (
                                    <button
                                        type='button'
                                        key={user._id}
                                        onClick={() => handleSelectUser(user)}
                                        className='w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3'
                                    >
                                        <img src={user.image} alt={user.name} className='w-8 h-8 rounded-full object-cover' />
                                        <div>
                                            <p className='text-sm font-medium text-gray-800'>{user.name}</p>
                                            <p className='text-xs text-gray-500'>{user.email} {user.phone ? `• ${user.phone}` : ''}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedUser && (
                            <div className='mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md'>
                                <span className='font-medium'>Linked to:</span>
                                <img src={selectedUser.image} className='w-5 h-5 rounded-full' />
                                <span>{selectedUser.name}</span>
                                <button type='button' className='ml-auto text-green-700 hover:underline' onClick={() => { setSelectedUser(null); setMemberData(prev => ({...prev, memberUserId: undefined})); }}>Remove link</button>
                            </div>
                        )}
                    </div>
                    {/* Basic Information */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Name *</label>
                            <input
                                type='text'
                                required
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                value={memberData.name}
                                onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Relation *</label>
                            <select
                                required
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                value={memberData.relation}
                                onChange={(e) => setMemberData({ ...memberData, relation: e.target.value })}
                            >
                                <option value=''>Select Relation</option>
                                {relationOptions.map((rel) => (
                                    <option key={rel} value={rel}>{rel}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Date of Birth</label>
                            <input
                                type='date'
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                value={memberData.dateOfBirth}
                                onChange={(e) => setMemberData({ ...memberData, dateOfBirth: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Gender</label>
                            <select
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                value={memberData.gender}
                                onChange={(e) => setMemberData({ ...memberData, gender: e.target.value })}
                            >
                                <option value='Not Selected'>Select Gender</option>
                                <option value='Male'>Male</option>
                                <option value='Female'>Female</option>
                                <option value='Other'>Other</option>
                            </select>
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Blood Group</label>
                            <select
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                value={memberData.bloodGroup}
                                onChange={(e) => setMemberData({ ...memberData, bloodGroup: e.target.value })}
                            >
                                <option value=''>Select Blood Group</option>
                                {bloodGroups.map((bg) => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Phone</label>
                            <input
                                type='tel'
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                value={memberData.phone}
                                onChange={(e) => setMemberData({ ...memberData, phone: e.target.value })}
                            />
                        </div>

                        <div className='md:col-span-2'>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Email</label>
                            <input
                                type='email'
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                value={memberData.email}
                                onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Medical Conditions */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Medical Conditions</label>
                        <div className='flex gap-2 mb-2'>
                            <input
                                type='text'
                                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                placeholder='Add medical condition'
                                value={conditionInput}
                                onChange={(e) => setConditionInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                            />
                            <button
                                type='button'
                                onClick={handleAddCondition}
                                className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition'
                            >
                                Add
                            </button>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            {memberData.medicalConditions.map((condition, index) => (
                                <span key={index} className='bg-blue-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2'>
                                    {condition}
                                    <button type='button' onClick={() => handleRemoveCondition(index)} className='text-primary hover:text-primary-700'>
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Allergies */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Allergies</label>
                        <div className='flex gap-2 mb-2'>
                            <input
                                type='text'
                                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                placeholder='Add allergy'
                                value={allergyInput}
                                onChange={(e) => setAllergyInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                            />
                            <button
                                type='button'
                                onClick={handleAddAllergy}
                                className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition'
                            >
                                Add
                            </button>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            {memberData.allergies.map((allergy, index) => (
                                <span key={index} className='bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2'>
                                    {allergy}
                                    <button type='button' onClick={() => handleRemoveAllergy(index)} className='text-red-500 hover:text-red-700'>
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-4 justify-end pt-4 border-t'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition'
                        >
                            Add Member
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFamily;
