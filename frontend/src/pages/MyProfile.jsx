import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {
    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)
    const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)

    const updateUserProfileData = async () => {
        try {
            const formData = new FormData();
            formData.append('name', userData.name)
            formData.append('phone', userData.phone)
            formData.append('address', JSON.stringify(userData.address))
            formData.append('gender', userData.gender)
            formData.append('dob', userData.dob)
            image && formData.append('image', image)

            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    return userData ? (
        <div className='max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg'>
            <header className='text-center mb-10'>
                <h1 className='text-2xl font-bold text-gray-800'>My Profile</h1>
            </header>
            <div className='space-y-6'>
                <div className='flex items-center space-x-4'>
                    <label htmlFor='image' className='relative cursor-pointer'>
                        <img className='w-24 h-24 rounded-full object-cover' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
                        {isEdit && <img className='w-6 h-6 absolute bottom-0 right-0' src={assets.upload_icon} alt="" />}
                    </label>
                    <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                    <div>
                        {isEdit
                            ? <input className='text-xl font-medium border-b-2 border-gray-300 focus:outline-none' type="text" onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))} value={userData.name} />
                            : <p className='text-xl font-medium'>{userData.name}</p>
                        }
                    </div>
                </div>
                <div>
                    <h3 className='text-lg font-medium text-gray-600'>Contact Information</h3>
                    <div className='mt-2 space-y-2'>
                        <p className='text-gray-500'>Email: <span className='text-gray-700'>{userData.email}</span></p>
                        <p className='text-gray-500'>Phone:
                            {isEdit
                                ? <input className='ml-2 border-b-2 border-gray-300 focus:outline-none' type="text" onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))} value={userData.phone} />
                                : <span className='ml-2 text-gray-700'>{userData.phone}</span>
                            }
                        </p>
                        <p className='text-gray-500'>Address:
                            {isEdit
                                ? <div className='ml-2 space-y-1'>
                                    <input className='block border-b-2 border-gray-300 focus:outline-none' type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} value={userData.address.line1} />
                                    <input className='block border-b-2 border-gray-300 focus:outline-none' type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} value={userData.address.line2} />
                                </div>
                                : <span className='ml-2 text-gray-700'>{userData.address.line1} <br /> {userData.address.line2}</span>
                            }
                        </p>
                    </div>
                </div>
                <div>
                    <h3 className='text-lg font-medium text-gray-600'>Basic Information</h3>
                    <div className='mt-2 space-y-2'>
                        <p className='text-gray-500'>Gender:
                            {isEdit
                                ? <select className='ml-2 border-b-2 border-gray-300 focus:outline-none' onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))} value={userData.gender}>
                                    <option value="Not Selected">Not Selected</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                : <span className='ml-2 text-gray-700'>{userData.gender}</span>
                            }
                        </p>
                        <p className='text-gray-500'>Birthday:
                            {isEdit
                                ? <input className='ml-2 border-b-2 border-gray-300 focus:outline-none' type='date' onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))} value={userData.dob} />
                                : <span className='ml-2 text-gray-700'>{userData.dob}</span>
                            }
                        </p>
                        <div className='flex justify-end mb-4'>
                            <button onClick={() => setIsEdit(!isEdit)} className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition'>
                                {isEdit ? 'Cancel' : 'Edit'}
                            </button>
                        </div>
                    </div>
                </div>
                {isEdit && (
                    <div className='flex justify-end'>
                        <button onClick={updateUserProfileData} className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition'>
                            Save
                        </button>
                    </div>
                )}
            </div>
        </div>
    ) : null
}

export default MyProfile
