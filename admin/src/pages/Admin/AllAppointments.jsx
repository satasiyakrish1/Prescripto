import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {

  const { aToken, filteredAppointments, cancelAppointment, getAllAppointments, downloadAppointmentsCSV, doctors, filters, updateFilters, getAllDoctors } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
      getAllDoctors()
    }
  }, [aToken])

  return (
    <div className='w-full max-w-6xl m-5 '>

      <div className='flex flex-col sm:flex-row justify-between items-center mb-3 gap-2'>        
        <p className='text-lg font-medium'>All Appointments</p>
        <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm flex items-center gap-1 w-full sm:w-auto justify-center'
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className='font-medium'>Filter</span>
          </button>
          <button 
            onClick={downloadAppointmentsCSV}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-1 w-full sm:w-auto justify-center'
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className='font-medium'>Download CSV</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className='bg-white border rounded p-4 mb-4 text-sm'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <label className='block text-gray-700 mb-1'>Status</label>
              <select 
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className='w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className='block text-gray-700 mb-1'>Doctor</label>
              <select 
                value={filters.doctor}
                onChange={(e) => updateFilters({ doctor: e.target.value })}
                className='w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value="all">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-gray-700 mb-1'>From Date</label>
              <input 
                type="date" 
                value={filters.dateFrom}
                onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                className='w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-gray-700 mb-1'>To Date</label>
              <input 
                type="date" 
                value={filters.dateTo}
                onChange={(e) => updateFilters({ dateTo: e.target.value })}
                className='w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>
      )}

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {filteredAppointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index+1}</p>
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} className='w-8 rounded-full' alt="" /> <p>{item.userData.name}</p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <div className='flex items-center gap-2'>
              <img src={item.docData.image} className='w-8 rounded-full bg-gray-200' alt="" /> <p>{item.docData.name}</p>
            </div>
            <p>{currency}{item.amount}</p>
            {item.cancelled ? <p className='text-red-400 text-xs font-medium'>Cancelled</p> : item.isCompleted ? <p className='text-green-500 text-xs font-medium'>Completed</p> : <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />}
          </div>
        ))}
      </div>

    </div>
  )
}

export default AllAppointments