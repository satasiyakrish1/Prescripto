import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { FaTrash, FaUser, FaSearch, FaFilter, FaSort } from 'react-icons/fa'

const DoctorsList = () => {
  const { doctors, changeAvailability, aToken, vToken, getAllDoctors, removeDoctor, isReadOnly } = useContext(AdminContext)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (aToken || vToken) {
      setIsLoading(true)
      getAllDoctors().finally(() => setIsLoading(false))
    }
  }, [aToken, vToken])

  const handleDelete = (doctor) => {
    setSelectedDoctor(doctor)
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    setIsLoading(true)
    try {
      await removeDoctor(selectedDoctor._id)
    } catch (error) {
      console.error('Error removing doctor:', error)
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
      setSelectedDoctor(null)
    }
  }

  const handleAvailabilityChange = async (doctorId) => {
    setIsLoading(true)
    try {
      await changeAvailability(doctorId)
    } catch (error) {
      console.error('Error changing availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort doctors
  const filteredAndSortedDoctors = doctors
    .filter(doctor => {
      const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterBy === 'all' ||
        (filterBy === 'available' && doctor.available) ||
        (filterBy === 'unavailable' && !doctor.available)
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'speciality':
          return a.speciality.localeCompare(b.speciality)
        case 'available':
          return b.available - a.available
        default:
          return 0
      }
    })

  if (isLoading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading doctors...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Doctors</h1>
              <p className="text-gray-600 mt-1">Manage your medical staff</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {filteredAndSortedDoctors.length} {filteredAndSortedDoctors.length === 1 ? 'Doctor' : 'Doctors'}
              </span>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or speciality..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="name">Sort by Name</option>
                <option value="speciality">Sort by Speciality</option>
                <option value="available">Sort by Availability</option>
              </select>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        {filteredAndSortedDoctors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600">
              {searchTerm || filterBy !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No doctors have been added yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedDoctors.map((doctor, index) => (
              <div
                key={doctor._id || index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                {/* Doctor Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary to-purple-600">
                  {doctor.image ? (
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FaUser className="h-16 w-16 text-white opacity-80" />
                    </div>
                  )}

                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${doctor.available
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                      {doctor.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>

                {/* Doctor Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                    Dr. {doctor.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 truncate">
                    {doctor.speciality}
                  </p>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    {/* Availability Toggle */}
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={doctor.available}
                          onChange={() => {
                            if (isReadOnly) return
                            handleAvailabilityChange(doctor._id)
                          }}
                          disabled={isLoading || isReadOnly}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${doctor.available ? 'bg-green-500' : 'bg-gray-300'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${doctor.available ? 'transform translate-x-5' : ''
                            }`}></div>
                        </div>
                      </div>
                      <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                        Available
                      </span>
                    </label>

                    {/* Delete Button */}
                    {!isReadOnly && <button
                      onClick={() => handleDelete(doctor)}
                      disabled={isLoading}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove doctor"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <FaTrash className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Confirm Delete
                    </h3>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove <span className="font-medium">Dr. {selectedDoctor?.name}</span>?
                  This action cannot be undone.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorsList