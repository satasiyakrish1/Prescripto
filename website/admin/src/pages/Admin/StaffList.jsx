import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { StaffContext } from '../../context/StaffContext'
import StaffModal from '../../components/StaffModal'
import { toast } from 'react-toastify'
import { API_URL } from '../../utils/constants'
import { useNavigate } from 'react-router-dom'

const StaffList = () => {
  const { staffData, loading, getStaffList, deleteStaff } = useContext(StaffContext)
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filteredStaffData, setFilteredStaffData] = useState([])
  const [sortBy, setSortBy] = useState({ key: 'name', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [density, setDensity] = useState('comfortable')

  useEffect(() => {
    getStaffList()
  }, [])

  // Load persisted preferences
  useEffect(() => {
    try {
      const prefsRaw = localStorage.getItem('staffListPrefs')
      if (prefsRaw) {
        const prefs = JSON.parse(prefsRaw)
        if (prefs.pageSize) setPageSize(prefs.pageSize)
        if (prefs.density) setDensity(prefs.density)
        if (prefs.sortBy && prefs.sortBy.key && prefs.sortBy.dir) setSortBy(prefs.sortBy)
      }
    } catch {}
  }, [])

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem('staffListPrefs', JSON.stringify({ pageSize, density, sortBy }))
    } catch {}
  }, [pageSize, density, sortBy])

  // Debounce search input for smoother UX
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 200)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    if (staffData) {
      let filtered = [...staffData]
      
      // Apply status filter
      if (filterStatus !== 'all') {
        filtered = filtered.filter(staff => 
          staff.status.toLowerCase() === filterStatus.toLowerCase()
        )
      }

      // Apply department filter
      if (filterDepartment !== 'all') {
        filtered = filtered.filter(staff =>
          staff.department.toLowerCase() === filterDepartment.toLowerCase()
        )
      }
      
      // Apply search term
      if (debouncedSearchTerm) {
        const search = debouncedSearchTerm.toLowerCase()
        filtered = filtered.filter(staff => 
          staff.name.toLowerCase().includes(search) ||
          staff.role.toLowerCase().includes(search) ||
          (staff.customRole && staff.customRole.toLowerCase().includes(search)) ||
          staff.department.toLowerCase().includes(search) ||
          (staff.contactNumber && staff.contactNumber.toLowerCase().includes(search))
        )
      }
      // Sort
      const key = sortBy.key
      const dir = sortBy.dir === 'asc' ? 1 : -1
      filtered.sort((a, b) => {
        const av = (a[key] === 'custom' && key === 'role') ? (a.customRole || '') : (a[key] || '')
        const bv = (b[key] === 'custom' && key === 'role') ? (b.customRole || '') : (b[key] || '')
        const as = String(av).toLowerCase()
        const bs = String(bv).toLowerCase()
        if (as < bs) return -1 * dir
        if (as > bs) return 1 * dir
        return 0
      })
      setPage(1)
      setFilteredStaffData(filtered)
    }
  }, [staffData, debouncedSearchTerm, filterStatus, filterDepartment, sortBy])

  const handleEdit = (staff) => {
    setEditData(staff)
    setIsModalOpen(true)
  }

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      await deleteStaff(staffId)
    }
  }

  const handleAddStaff = () => {
    setEditData(null)
    setIsModalOpen(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterStatus('all')
    setFilterDepartment('all')
    setSortBy({ key: 'name', dir: 'asc' })
    setPage(1)
  }

  const toggleSort = (key) => {
    setSortBy((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  const total = filteredStaffData.length
  const activeCount = filteredStaffData.filter(s => String(s.status).toLowerCase() === 'active').length
  const inactiveCount = total - activeCount
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startIdx = (page - 1) * pageSize
  const currentPageData = filteredStaffData.slice(startIdx, startIdx + pageSize)

  return (
    <div className='w-full p-5'>
      <div className='flex flex-col gap-4 mb-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
          <img src={assets.list_icon} alt='' className='w-6 h-6' />
          <h1 className='text-xl font-semibold text-gray-800'>Staff</h1>
          <span className='ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700'>{total} total</span>
          <span className='ml-1 px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700'>{activeCount} active</span>
          <span className='ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-50 text-gray-700'>{inactiveCount} inactive</span>
        </div>
          <div className='flex items-center gap-2'>
            <div className='inline-flex rounded-md border border-gray-200 bg-white p-0.5'>
              <button
                onClick={() => setDensity('comfortable')}
                className={`px-2.5 py-1.5 rounded ${density === 'comfortable' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                title='Comfortable'
              >
                C
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2.5 py-1.5 rounded ${density === 'compact' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                title='Compact'
              >
                S
              </button>
            </div>
            <button
              onClick={handleAddStaff}
              className='bg-black hover:bg-black/90 text-white px-4 py-2 rounded-md text-sm'
            >
              Add Staff
            </button>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
          <div className='flex gap-3'>
            <button
              onClick={() => window.location.href = `${API_URL}/api/admin/staff/export/excel?status=${filterStatus}&department=${filterDepartment}`}
              className='px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2'
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              Export Excel
            </button>
            <button
              onClick={() => window.location.href = `${API_URL}/api/admin/staff/export/pdf?status=${filterStatus}&department=${filterDepartment}`}
              className='px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2'
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              Export PDF
            </button>
          </div>
          <div className='flex gap-3 w-full sm:w-auto'>
            <div className='relative flex-1 sm:w-64'>
              <input
                type='text'
                placeholder='Search staff...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
              />
              <svg
                className='absolute left-3 top-2.5 h-5 w-5 text-gray-400'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
            <div className='flex gap-3'>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white'
              >
                <option value='all'>All Status</option>
                <option value='active'>Active</option>
                <option value='inactive'>Inactive</option>
              </select>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white'
              >
                <option value='all'>All Departments</option>
                <option value='emergency'>Emergency</option>
                <option value='cardiology'>Cardiology</option>
                <option value='neurology'>Neurology</option>
                <option value='orthopedics'>Orthopedics</option>
                <option value='pediatrics'>Pediatrics</option>
                <option value='pharmacy'>Pharmacy</option>
                <option value='laboratory'>Laboratory</option>
                <option value='radiology'>Radiology</option>
                <option value='administration'>Administration</option>
              </select>
              <button
                onClick={clearFilters}
                className='px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm'
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white w-full'>
        <div className='overflow-x-auto w-full'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50 sticky top-0 z-10'>
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  aria-sort={sortBy.key === 'name' ? (sortBy.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none`}
                >
                  Name {sortBy.key === 'name' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => toggleSort('role')}
                  aria-sort={sortBy.key === 'role' ? (sortBy.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none`}
                >
                  Role {sortBy.key === 'role' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => toggleSort('department')}
                  aria-sort={sortBy.key === 'department' ? (sortBy.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none`}
                >
                  Department {sortBy.key === 'department' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} text-left text-xs font-semibold text-gray-600 uppercase tracking-wider`}>
                  Contact
                </th>
                <th
                  onClick={() => toggleSort('status')}
                  aria-sort={sortBy.key === 'status' ? (sortBy.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none`}
                >
                  Status {sortBy.key === 'status' ? (sortBy.dir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} text-left text-xs font-semibold text-gray-600 uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className='animate-pulse'>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-4'}`}>
                      <div className='flex items-center gap-4'>
                        <div className='h-10 w-10 rounded-full bg-gray-200' />
                        <div>
                          <div className='h-3 w-32 bg-gray-200 rounded mb-2' />
                          <div className='h-3 w-48 bg-gray-100 rounded' />
                        </div>
                      </div>
                    </td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-4'}`}><div className='h-3 w-20 bg-gray-200 rounded' /></td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-4'}`}><div className='h-3 w-24 bg-gray-200 rounded' /></td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-4'}`}><div className='h-3 w-24 bg-gray-200 rounded' /></td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-4'}`}><div className='h-5 w-16 bg-gray-200 rounded-full' /></td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-4'}`}><div className='h-3 w-20 bg-gray-200 rounded' /></td>
                  </tr>
                ))
              ) : currentPageData.length === 0 ? (
                <tr>
                  <td colSpan='6' className='text-center py-12'>
                    <div className='flex flex-col items-center gap-2 text-gray-500'>
                      <div className='h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center'>👥</div>
                      <div className='text-sm'>No staff members found</div>
                      <button onClick={handleAddStaff} className='mt-2 px-3 py-1.5 text-sm rounded-md bg-primary text-white hover:bg-primary/90'>Add Staff</button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentPageData.map((staff, index) => (
                  <tr key={index} className='hover:bg-gray-50 transition-colors duration-150'>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} whitespace-nowrap`}>
                      <div
                        className='flex items-center cursor-pointer'
                        onClick={() => navigate(`/staff/${staff._id}`)}
                        title='View details'
                        role='button'
                      >
                        <div className='h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100'>
                          {staff.image
                            ? <img src={staff.image} alt={staff.name} className='h-10 w-10 object-cover' />
                            : <div className='h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 uppercase text-sm'>
                                {(staff.name || '').split(' ').map(p => p[0]).filter(Boolean).slice(0,2).join('') || '?'}
                              </div>}
                        </div>
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-gray-900 truncate max-w-[220px]' title={staff.name}>{staff.name}</div>
                          <div className='text-xs text-gray-500'>
                            <a href={`mailto:${staff.email}`} className='hover:underline truncate inline-block max-w-[220px]' title={staff.email}>{staff.email}</a>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} whitespace-nowrap`}>
                      <div className='text-sm text-gray-900 truncate max-w-[160px]' title={staff.role === 'custom' ? staff.customRole : staff.role}>{staff.role === 'custom' ? staff.customRole : staff.role}</div>
                    </td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} whitespace-nowrap`}>
                      <div className='text-sm text-gray-900 truncate max-w-[160px]' title={staff.department}>{staff.department}</div>
                    </td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} whitespace-nowrap`}>
                      <div className='text-sm text-gray-900'>
                        <a href={`tel:${staff.contactNumber}`} className='hover:underline'>{staff.contactNumber}</a>
                      </div>
                    </td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} whitespace-nowrap`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${staff.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {staff.status.charAt(0).toUpperCase() + staff.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className={`${density === 'compact' ? 'px-4 py-2' : 'px-6 py-3'} whitespace-nowrap text-sm font-medium`}>
                      <div className='flex items-center gap-3'>
                        <button
                          onClick={() => handleEdit(staff)}
                          className='text-blue-600 hover:text-blue-900 transition-colors duration-150 flex items-center gap-1'
                          title='Edit staff'
                          aria-label={`Edit ${staff.name}`}
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(staff._id)}
                          className='text-red-600 hover:text-red-900 transition-colors duration-150 flex items-center gap-1'
                          title='Delete staff'
                          aria-label={`Delete ${staff.name}`}
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100'>
          <div className='text-sm text-gray-600'>
            Showing {Math.min(total, startIdx + 1)}–{Math.min(total, startIdx + currentPageData.length)} of {total}
          </div>
          <div className='flex items-center gap-3'>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1) }}
              className='px-2 py-1 border border-gray-300 rounded-md text-sm bg-white'
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <div className='flex items-center gap-2'>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className='px-2 py-1 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 text-sm'
              >
                Prev
              </button>
              <span className='text-sm text-gray-700'>Page {page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className='px-2 py-1 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 text-sm'
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editData={editData}
      />
    </div>
  )
}

export default StaffList
