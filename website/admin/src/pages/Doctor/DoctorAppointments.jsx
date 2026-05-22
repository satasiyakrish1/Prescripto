import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { Calendar, Search, CheckCircle, XCircle } from 'lucide-react'

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  const stats = appointments.reduce(
    (acc, item) => {
      acc.total += 1
      if (item.cancelled) acc.cancelled += 1
      else if (item.isCompleted) acc.completed += 1
      else acc.upcoming += 1
      return acc
    },
    { total: 0, upcoming: 0, completed: 0, cancelled: 0 }
  )

  const filteredAppointments = appointments.filter(item => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.userData.name.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (statusFilter === 'all') return true
    if (statusFilter === 'upcoming') return !item.cancelled && !item.isCompleted
    if (statusFilter === 'completed') return item.isCompleted
    if (statusFilter === 'cancelled') return item.cancelled

    return true
  })

  const ClockIcon = () => (
    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2 2m6-4a8 8 0 11-16 0 8 8 0 0116 0z" />
    </svg>
  )

  const getStatusBadge = (item) => {
    if (item.cancelled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
        </span>
      )
    }

    if (item.isCompleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
        <ClockIcon />
        Upcoming
      </span>
    )
  }

  const handleCancel = (id) => {
    cancelAppointment(id)
  }

  const handleComplete = (id) => {
    completeAppointment(id)
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-5">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-500">Quick overview of all your patient visits</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All status</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Total</p>
          <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Upcoming</p>
          <p className="text-xl font-semibold text-blue-600">{stats.upcoming}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Completed</p>
          <p className="text-xl font-semibold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Cancelled</p>
          <p className="text-xl font-semibold text-red-600">{stats.cancelled}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr_1.5fr] gap-3 px-5 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50">
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p className="text-right">Status / Actions</p>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No appointments found for this view
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAppointments.map((item, index) => (
              <div
                key={item._id || index}
                className="flex flex-col md:grid md:grid-cols-[0.5fr_2fr_1fr_2fr_1fr_1.5fr] gap-4 px-5 py-4 text-sm hover:bg-gray-50 transition-colors"
              >
                <div className="hidden md:flex items-center text-xs text-gray-500">
                  {index + 1}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={item.userData.image}
                    alt={item.userData.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.userData.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.payment ? 'Online payment' : 'Cash'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-700">
                  {calculateAge(item.userData.dob)}
                </div>

                <div className="flex flex-col justify-center gap-1 text-sm text-gray-700">
                  <span>{slotDateFormat(item.slotDate)}</span>
                  <span className="text-xs text-gray-500">{item.slotTime}</span>
                </div>

                <div className="flex items-center text-sm font-semibold text-gray-900">
                  {currency}{item.amount}
                </div>

                <div className="flex flex-col md:items-end gap-2">
                  {getStatusBadge(item)}
                  {!item.cancelled && !item.isCompleted && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => handleComplete(item._id)}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark completed
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(item._id)}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex md:hidden justify-between items-center text-xs text-gray-500">
                  <span>
                    Age: {calculateAge(item.userData.dob)}
                  </span>
                  <span>
                    {currency}{item.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorAppointments
