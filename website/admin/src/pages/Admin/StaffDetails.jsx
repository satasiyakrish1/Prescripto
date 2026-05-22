import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StaffContext } from '../../context/StaffContext'
import { API_URL } from '../../utils/constants'

const StaffDetails = () => {
  const { staffId } = useParams()
  const navigate = useNavigate()
  const { staffData, getStaffList } = useContext(StaffContext)
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fromContext = useMemo(() => {
    return staffData?.find(s => s._id === staffId) || null
  }, [staffData, staffId])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Prefer context if available
        if (fromContext) {
          setStaff(fromContext)
          return
        }
        // Attempt GET by id; if not available, fallback to list
        const aToken = localStorage.getItem('aToken')
        let res = await fetch(`${API_URL}/api/admin/staff/${staffId}`, {
          headers: { 'aToken': aToken }
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.staff) {
            setStaff(data.staff)
            return
          }
        }
        // Fallback: fetch all and find
        await getStaffList()
      } catch (e) {
        setError('Failed to load staff details')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [staffId, fromContext, getStaffList])

  useEffect(() => {
    if (!staff && fromContext) {
      setStaff(fromContext)
    }
  }, [fromContext, staff])

  if (loading && !staff) {
    return (
      <div className='p-6'>
        <div className='h-6 w-40 bg-gray-200 rounded mb-6 animate-pulse' />
        <div className='flex items-center gap-4 mb-6'>
          <div className='h-20 w-20 rounded-full bg-gray-200 animate-pulse' />
          <div>
            <div className='h-4 w-48 bg-gray-200 rounded mb-2 animate-pulse' />
            <div className='h-3 w-32 bg-gray-100 rounded animate-pulse' />
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {[...Array(6)].map((_, i) => <div key={i} className='h-20 bg-gray-100 rounded animate-pulse' />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='p-6'>
        <button onClick={() => navigate(-1)} className='text-sm text-gray-600 hover:underline mb-4'>Back</button>
        <div className='text-red-600'>{error}</div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className='p-6'>
        <button onClick={() => navigate(-1)} className='text-sm text-gray-600 hover:underline mb-4'>Back</button>
        <div className='text-gray-600'>Staff not found.</div>
      </div>
    )
  }

  const displayRole = staff.role === 'custom' ? staff.customRole : staff.role
  const initials = (staff.name || '').split(' ').map(p => p[0]).filter(Boolean).slice(0,2).join('').toUpperCase()

  return (
    <div className='w-full p-5'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <button onClick={() => navigate(-1)} className='px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-sm'>Back</button>
          <h1 className='text-xl font-semibold text-gray-800'>Staff Details</h1>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => navigate('/staff-list')}
            className='px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-sm'
          >
            Staff List
          </button>
        </div>
      </div>

      <div className='bg-white rounded-lg p-5 shadow-sm'>
        <div className='flex items-start gap-5 mb-6'>
          <div className='h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-600 text-lg'>
            {staff.image
              ? <img src={staff.image} alt={staff.name} className='h-20 w-20 object-cover' />
              : initials || '?'}
          </div>
          <div className='flex-1'>
            <div className='flex items-center gap-3 flex-wrap'>
              <h2 className='text-lg font-semibold text-gray-900'>{staff.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${String(staff.status).toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {String(staff.status).charAt(0).toUpperCase() + String(staff.status).slice(1).toLowerCase()}
              </span>
            </div>
            <div className='text-sm text-gray-600 mt-1'>{displayRole} • {staff.department}</div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='p-4 border border-gray-100 rounded-lg'>
            <div className='text-xs text-gray-500 mb-1'>Email</div>
            <a href={`mailto:${staff.email}`} className='text-sm text-gray-900 hover:underline break-all'>{staff.email || '-'}</a>
          </div>
          <div className='p-4 border border-gray-100 rounded-lg'>
            <div className='text-xs text-gray-500 mb-1'>Contact Number</div>
            <a href={`tel:${staff.contactNumber}`} className='text-sm text-gray-900 hover:underline'>{staff.contactNumber || '-'}</a>
          </div>
          <div className='p-4 border border-gray-100 rounded-lg'>
            <div className='text-xs text-gray-500 mb-1'>Department</div>
            <div className='text-sm text-gray-900'>{staff.department || '-'}</div>
          </div>
          <div className='p-4 border border-gray-100 rounded-lg'>
            <div className='text-xs text-gray-500 mb-1'>Role</div>
            <div className='text-sm text-gray-900'>{displayRole || '-'}</div>
          </div>
          <div className='md:col-span-2 p-4 border border-gray-100 rounded-lg'>
            <div className='text-xs text-gray-500 mb-1'>Address</div>
            <div className='text-sm text-gray-900 break-words'>{staff.address || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDetails
