import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../utils/constants'
import { toast } from 'react-toastify'
import { ViewerContext } from '../../context/ViewerContext'
import { AdminContext } from '../../context/AdminContext'

const ROUTE_OPTIONS = [
  { key: 'admin-dashboard', label: 'Dashboard', path: '/admin-dashboard' },
  { key: 'all-appointments', label: 'Appointments', path: '/all-appointments' },
  { key: 'add-doctor', label: 'Add Doctor', path: '/add-doctor' },
  { key: 'doctor-list', label: 'Doctors List', path: '/doctor-list' },
  { key: 'staff-list', label: 'Staff List', path: '/staff-list' },
  { key: 'bed-allocation', label: 'Bed Allocation', path: '/bed-allocation' },
  { key: 'vehicle-management', label: 'Vehicle Management', path: '/vehicle-management' },
  { key: 'event-management', label: 'Events', path: '/event-management' },
  { key: 'marketing-analysis', label: 'Marketing Analysis', path: '/marketing-analysis' },
  { key: 'notifications', label: 'Notifications', path: '/notifications' },
  { key: 'todo-list', label: 'Todo List', path: '/todo-list' },
  { key: 'blog-management', label: 'Blog Management', path: '/blog-management' },
  { key: 'assets', label: 'Assets', path: '/assets' },
  { key: 'coupons', label: 'Coupons', path: '/coupons' },
  { key: 'support', label: 'Support Requests', path: '/support' },
  { key: 'support-management', label: 'Support Management', path: '/support-management' },
  { key: 'logs-download', label: 'Server Logs', path: '/logs-download' },
  { key: 'access-management', label: 'Access Management', path: '/access-management' },
]

const CreateAccessUser = () => {
  const navigate = useNavigate()
  const { vRole } = useContext(ViewerContext) || {}
  const { aToken } = useContext(AdminContext)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', role: 'viewer', allowedRoutes: [], active: true })

  const isReadOnly = aToken ? false : (vRole === 'viewer')

  useEffect(() => {
    if (isReadOnly) {
      toast.error('Unauthorized access. Redirecting...')
      navigate('/access-management')
    }
  }, [isReadOnly, navigate])

  const toggleAllowed = (key) => {
    if (isReadOnly) return
    setForm((f) => {
      const exists = f.allowedRoutes.includes(key)
      return { ...f, allowedRoutes: exists ? f.allowedRoutes.filter(k => k !== key) : [...f.allowedRoutes, key] }
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (isReadOnly) return
    try {
      setLoading(true)
      if (!form.email || !form.password) {
        toast.error('Email and password are required')
        setLoading(false)
        return
      }
      const token = localStorage.getItem('aToken') || localStorage.getItem('vToken') || ''
      const res = await fetch(`${API_URL}/api/admin/access-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aToken': token,
          'vToken': token,
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.status === 401) {
        toast.error('Unauthorized. Please login as Admin again.')
      } else if (res.ok && data.success) {
        toast.success('Access user created')
        navigate('/access-management')
      } else {
        toast.error(data.message || 'Failed to create user')
      }
    } catch {
      toast.error('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  if (isReadOnly) return null

  return (
    <div className='w-full p-5 relative min-h-screen overflow-hidden'>
      {/* Premium Beta Ribbon */}
      <div className="absolute top-0 right-0 w-40 h-40 overflow-hidden pointer-events-none z-50">
        <div className="absolute bg-red-600 text-white text-[12px] font-black py-2 w-[220px] text-center rotate-45 translate-x-[60px] translate-y-[35px] shadow-2xl border-y border-white/30 uppercase tracking-[0.2em] antialiased">
          Beta Version
        </div>
      </div>

      <div className='flex items-center justify-between mb-4'>
        <div>
          <h1 className='text-xl font-semibold text-gray-800'>New Access User</h1>
          <p className='text-sm text-gray-600'>Create viewer/editor with allowed pages.</p>
        </div>
        <button onClick={() => navigate('/access-management')} className='px-4 py-2 border border-gray-300 rounded-md'>Back</button>
      </div>
      <div className='bg-white rounded-lg shadow-sm p-5'>
        <form onSubmit={submit} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type='email' required className='w-full border border-gray-300 rounded-md px-3 py-2.5' />
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Password</label>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type='password' required className='w-full border border-gray-300 rounded-md px-3 py-2.5' />
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-600 mb-1'>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className='w-full border border-gray-300 rounded-md px-3 py-2.5'>
              <option value='viewer'>Viewer</option>
              <option value='editor'>Editor</option>
            </select>
          </div>
          <div className='flex items-center gap-2'>
            <label className='block text-xs font-medium text-gray-600'>Active</label>
            <input type='checkbox' checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-xs font-medium text-gray-600 mb-2'>Allowed Pages</label>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
              {ROUTE_OPTIONS.map(opt => (
                <label key={opt.key} className='flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={form.allowedRoutes.includes(opt.key)}
                    onChange={() => toggleAllowed(opt.key)}
                  />
                  <span>{opt.label}</span>
                  <span className='text-gray-400 text-xs'>({opt.path})</span>
                </label>
              ))}
            </div>
          </div>
          <div className='md:col-span-2 flex justify-end gap-2 mt-2'>
            <button type='button' onClick={() => navigate('/access-management')} className='px-4 py-2 border border-gray-300 rounded-md'>Cancel</button>
            <button type='submit' disabled={loading} className='px-4 py-2 bg-black text-white rounded-md'>{loading ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAccessUser
