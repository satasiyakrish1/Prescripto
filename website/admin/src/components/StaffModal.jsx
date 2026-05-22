import React, { useContext, useState, useRef, useEffect } from 'react'
import { StaffContext } from '../context/StaffContext'
import { assets } from '../assets/assets'

const StaffModal = ({ isOpen, onClose, editData = null }) => {
  const { addStaff, updateStaff } = useContext(StaffContext)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'custom',
    customRole: '',
    department: '',
    contactNumber: '',
    address: '',
    status: 'active',
    avatar: null
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        email: editData.email || '',
        password: undefined,
        role: editData.role || 'custom',
        customRole: editData.customRole || '',
        department: editData.department || '',
        contactNumber: editData.contactNumber || '',
        address: editData.address || '',
        status: editData.status || 'active',
        // Do not set avatar with existing URL; keep null so we only upload if changed
        avatar: null
      })
      setAvatarPreview(editData.image || null)
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'custom',
        customRole: '',
        department: '',
        contactNumber: '',
        address: '',
        status: 'active',
        avatar: null
      })
      setAvatarPreview(null)
    }
  }, [editData, isOpen])
  
  const fileInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(editData?.image || null)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, avatar: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current.click()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Create a copy of the form data to ensure we don't modify the state directly
    const submissionData = {...formData}
    
    // Validate required fields
    if (!submissionData.name || !submissionData.department) {
      toast.error('Please fill all required fields')
      return
    }
    
    // Ensure contact number is properly formatted if provided
    if (submissionData.contactNumber && !/^\d+$/.test(submissionData.contactNumber)) {
      toast.error('Contact number should contain only digits')
      return
    }
    
    // Ensure status is lowercase for backend compatibility
    submissionData.status = submissionData.status.toLowerCase()
    
    if (editData) {
      await updateStaff(editData._id, submissionData)
    } else {
      await addStaff(submissionData)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto'>
      <div className='bg-white rounded-lg p-5 sm:p-6 w-full max-w-xl shadow-lg max-h-[92vh] overflow-y-auto relative'>
        <button onClick={onClose} className='absolute top-3 right-3 text-gray-500 hover:text-gray-700 rounded-md p-1 hover:bg-gray-100' aria-label='Close'>
          <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
        <div className='mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>{editData ? 'Edit Staff' : 'Add Staff'}</h2>
          <p className='text-gray-500 mt-1 text-sm'>Enter the staff member's information below</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='mb-5 flex flex-col items-center'>
            <button type='button' onClick={handleAvatarClick} className='relative h-24 w-24 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center' aria-label='Change Photo'>
              {avatarPreview ? <img src={avatarPreview} alt='Staff avatar' className='h-full w-full object-cover' /> : <img src={assets.people_icon} alt='Default avatar' className='h-10 w-10 opacity-50' />}
              <span className='absolute bottom-0 inset-x-0 bg-white/90 text-gray-700 text-xs py-1 text-center'>Upload</span>
            </button>
            <input type='file' ref={fileInputRef} onChange={handleAvatarChange} accept='image/*' className='hidden' />
          </div>
          
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='form-group'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Full Name</label>
              <div className='relative'>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='block w-full rounded-md border border-gray-300 pl-9 pr-3 py-2.5 focus:border-black focus:ring-2 focus:ring-black/10 text-gray-800 placeholder-gray-400'
                  placeholder='Enter full name'
                  required
                />
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                  </svg>
                </div>
              </div>
            </div>

            <div className='form-group'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Role</label>
              <div className='relative'>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData({
                      ...formData,
                      role: newRole,
                      customRole: newRole === 'custom' ? '' : undefined
                    });
                  }}
                  className='block w-full rounded-md border border-gray-300 pl-9 pr-8 py-2.5 focus:border-black focus:ring-2 focus:ring-black/10 bg-white text-gray-800 appearance-none cursor-pointer'
                  required
                >
                  <option value='security'>Security</option>
                  <option value='operation_management'>Operation Management</option>
                  <option value='fo'>Front Office</option>
                  <option value='cco'>CCO</option>
                  <option value='hospital_staff'>Hospital Staff</option>
                  <option value='custom'>Custom</option>
                </select>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-7 4h8M7 8h10M5 6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6z' />
                  </svg>
                </div>
              </div>
            </div>
            
            {formData.role === 'custom' && (
              <div className='form-group'>
                <label className='block text-xs font-medium text-gray-600 mb-1'>Custom Role</label>
                <div className='relative'>
                  <input
                    type='text'
                    value={formData.customRole || ''}
                    onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
                    className='block w-full rounded-md border border-gray-300 pl-9 pr-3 py-2.5 focus:border-black focus:ring-2 focus:ring-black/10 text-gray-800 placeholder-gray-400'
                    placeholder='Enter custom role name'
                    required={formData.role === 'custom'}
                  />
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21v-2a4 4 0 00-3-3.874M5 21v-2a4 4 0 013-3.874' />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div className='form-group'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Department</label>
              <div className='relative'>
                <input
                  type='text'
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className='block w-full rounded-md border border-gray-300 pl-9 pr-3 py-2.5 focus:border-black focus:ring-2 focus:ring-black/10 text-gray-800 placeholder-gray-400'
                  placeholder='Enter department'
                  required
                />
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a2 2 0 002 2h3V5H5a2 2 0 00-2 2zM13 5v14h6a2 2 0 002-2V7a2 2 0 00-2-2h-6z' />
                  </svg>
                </div>
              </div>
            </div>

            {!editData && (
              <>
                <div className='form-group'>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>Email</label>
                  <div className='relative'>
                    <input
                      type='email'
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className='block w-full rounded-md border border-gray-300 pl-9 pr-3 py-2.5 focus:border-black focus:ring-2 focus:ring-black/10 text-gray-800 placeholder-gray-400'
                      placeholder='Enter email address'
                      required
                    />
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className='form-group'>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>Password</label>
                  <div className='relative'>
                    <input
                      type='password'
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className='block w-full rounded-md border border-gray-300 pl-9 pr-3 py-2.5 focus:border-black focus:ring-2 focus:ring-black/10 text-gray-800 placeholder-gray-400'
                      placeholder='Enter password'
                      required
                    />
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className='form-group'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Contact Number</label>
              <div className='relative'>
                <input
                  type='text'
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className='block w-full rounded-md border border-gray-300 pl-9 pr-3 py-2.5 focus:border-black focus:ring-2 focus:ring-black/10 text-gray-800 placeholder-gray-400'
                  placeholder='Enter contact number'
                  required
                />
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                  </svg>
                </div>
              </div>
            </div>

            <div className='form-group md:col-span-2'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Address</label>
              <div className='relative'>
                <input
                  type='text'
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className='block w-full rounded-md border border-gray-300 pl-9 pr-3 py-2.5 focus:border-black focus:ring-2 focus:ring-black/10 text-gray-800 placeholder-gray-400'
                  placeholder='Enter full address'
                  required
                />
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                  </svg>
                </div>
              </div>
            </div>

            <div className='form-group'>
              <label className='block text-xs font-medium text-gray-600 mb-1'>Status</label>
              <div className='relative'>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className='block w-full rounded-md border border-gray-300 pl-9 pr-8 py-2.5 focus:border-black focus:ring-2 focus:ring-black/10 bg-white text-gray-800 appearance-none cursor-pointer'
                >
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                </select>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-6 flex justify-end gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-md'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-4 py-2 text-sm font-medium text-white bg-black hover:bg-black/90 rounded-md'
            >
              {editData ? 'Update Staff' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StaffModal
