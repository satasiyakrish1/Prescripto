import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../utils/constants'
import { toast } from 'react-toastify'
import { useContext } from 'react'
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

const AccessManagement = () => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ email: '', password: '', role: 'viewer', allowedRoutes: [], active: true })
  const [adminPwd, setAdminPwd] = useState({ currentPassword: '', newPassword: '' })
  const { vRole } = useContext(ViewerContext) || {}
  const { aToken } = useContext(AdminContext)
  const isReadOnly = aToken ? false : (vRole === 'viewer')

  const filtered = useMemo(() => {
    return list.filter(u => {
      const matchesSearch = !search || u.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesActive = activeFilter === 'all' || String(u.active) === activeFilter
      return matchesSearch && matchesRole && matchesActive
    })
  }, [list, search, roleFilter, activeFilter])

  const load = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('aToken') || localStorage.getItem('vToken') || ''
      const qs = new URLSearchParams()
      if (roleFilter !== 'all') qs.set('role', roleFilter)
      if (activeFilter !== 'all') qs.set('active', activeFilter)
      const url = `${API_URL}/api/admin/access-users${qs.toString() ? `?${qs.toString()}` : ''}`
      const res = await fetch(url, {
        headers: {
          'aToken': token,
          'vToken': token,
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      const data = await res.json()
      if (data.success) {
        setList(data.users || [])
      } else {
        toast.error(data.message || 'Failed to fetch access users')
      }
    } catch {
      toast.error('Failed to fetch access users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    if (isReadOnly) return
    setEditItem(null)
    setForm({ email: '', password: '', role: 'viewer', allowedRoutes: [], active: true })
    setModalOpen(true)
  }

  const openEdit = (u) => {
    if (isReadOnly) return
    setEditItem(u)
    setForm({ email: u.email, password: '', role: u.role, allowedRoutes: u.allowedRoutes || [], active: !!u.active })
    setModalOpen(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (isReadOnly) return
    try {
      setLoading(true)
      if (!editItem && !form.password) {
        toast.error('Password is required for new user')
        setLoading(false)
        return
      }
      const method = editItem ? 'PUT' : 'POST'
      const url = editItem ? `${API_URL}/api/admin/access-users/${editItem._id}` : `${API_URL}/api/admin/access-users`
      const token = localStorage.getItem('aToken') || localStorage.getItem('vToken') || ''
      const body = JSON.stringify({
        email: form.email,
        password: form.password || undefined,
        role: form.role,
        allowedRoutes: form.allowedRoutes,
        active: form.active
      })
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'aToken': token,
          'vToken': token,
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(editItem ? 'Access user updated' : 'Access user created')
        setModalOpen(false)
        load()
      } else {
        toast.error(data.message || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id) => {
    if (isReadOnly) return
    if (!window.confirm('Are you sure you want to delete this access user?')) return
    try {
      const token = localStorage.getItem('aToken') || localStorage.getItem('vToken') || ''
      const res = await fetch(`${API_URL}/api/admin/access-users/${id}`, {
        method: 'DELETE',
        headers: {
          'aToken': token,
          'vToken': token,
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Access user deleted')
        load()
      } else {
        toast.error(data.message || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const toggleAllowed = (key) => {
    if (isReadOnly) return
    setForm((f) => {
      const exists = f.allowedRoutes.includes(key)
      return { ...f, allowedRoutes: exists ? f.allowedRoutes.filter(k => k !== key) : [...f.allowedRoutes, key] }
    })
  }

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
          <h1 className='text-xl font-semibold text-gray-800'>Access Management</h1>
          <p className='text-sm text-gray-600'>Create accounts with permissions (viewer/editor) and allowed pages.</p>
        </div>
        {!isReadOnly && <button onClick={() => navigate('/access-management/new')} className='bg-black hover:bg-black/90 text-white px-4 py-2 rounded-md text-sm'>New Access User</button>}
      </div>

      {!isReadOnly && <div className='bg-white rounded-lg shadow-sm p-4 mb-4'>
        <h2 className='text-sm font-semibold text-gray-800 mb-3'>Admin Password</h2>
        <form className='grid grid-cols-1 md:grid-cols-3 gap-3' onSubmit={async (e) => {
          e.preventDefault()
          try {
            setLoading(true)
            const token = localStorage.getItem('aToken') || ''
            const res = await fetch(`${API_URL}/api/admin/change-password`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'aToken': token,
                'Authorization': token ? `Bearer ${token}` : ''
              },
              body: JSON.stringify(adminPwd)
            })
            const data = await res.json()
            if (res.ok && data.success) {
              toast.success('Admin password updated')
              setAdminPwd({ currentPassword: '', newPassword: '' })
            } else {
              toast.error(data.message || 'Failed to update admin password')
            }
          } catch {
            toast.error('Failed to update admin password')
          } finally {
            setLoading(false)
          }
        }}>
          <input
            type='password'
            placeholder='Current password'
            value={adminPwd.currentPassword}
            onChange={(e) => setAdminPwd({ ...adminPwd, currentPassword: e.target.value })}
            className='border border-gray-300 rounded-lg px-3 py-2.5'
            required
          />
          <input
            type='password'
            placeholder='New password'
            value={adminPwd.newPassword}
            onChange={(e) => setAdminPwd({ ...adminPwd, newPassword: e.target.value })}
            className='border border-gray-300 rounded-lg px-3 py-2.5'
            required
          />
          <div className='flex items-center'>
            <button type='submit' className='px-4 py-2 bg-black text-white rounded-md'>Update</button>
          </div>
        </form>
      </div>}

      <div className='flex flex-col sm:flex-row gap-3 mb-4'>
        <div className='relative flex-1 sm:w-64'>
          <input
            type='text'
            placeholder='Search by email...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/40'
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className='border border-gray-300 rounded-lg px-3 py-2'>
          <option value='all'>All Roles</option>
          <option value='viewer'>Viewer</option>
          <option value='editor'>Editor</option>
        </select>
        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className='border border-gray-300 rounded-lg px-3 py-2'>
          <option value='all'>All Status</option>
          <option value='true'>Active</option>
          <option value='false'>Inactive</option>
        </select>
      </div>

      <div className='bg-white rounded-lg shadow-sm overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='bg-gray-50 border-b border-gray-200'>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>User</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Role</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Allowed Pages</th>
              {!isReadOnly && <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {filtered.map(u => (
              <tr key={u._id} className='hover:bg-gray-50 transition-colors'>
                <td className='px-6 py-3 text-sm text-gray-900'>{u.email}</td>
                <td className='px-6 py-3 text-sm'>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'editor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className='px-6 py-3 text-sm'>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className='px-6 py-3 text-sm text-gray-900'>
                  <div className='flex gap-1 flex-wrap'>
                    {(u.allowedRoutes || []).map(k => {
                      const opt = ROUTE_OPTIONS.find(o => o.key === k)
                      return <span key={k} className='px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs'>{opt?.label || k}</span>
                    })}
                  </div>
                </td>
                {!isReadOnly && <td className='px-6 py-3 text-sm'>
                  <div className='flex items-center gap-3'>
                    <button onClick={() => openEdit(u)} className='text-blue-600 hover:text-blue-900'>Edit</button>
                    <button onClick={() => remove(u._id)} className='text-red-600 hover:text-red-900'>Delete</button>
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3'>
          <div className='bg-white rounded-lg p-5 w-full max-w-2xl relative'>
            <button onClick={() => setModalOpen(false)} className='absolute top-3 right-3 text-gray-600 hover:text-gray-800'>✕</button>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>{editItem ? 'Edit Access User' : 'New Access User'}</h2>
            <form onSubmit={submit} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type='email' required className='w-full border border-gray-300 rounded-md px-3 py-2.5' />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-1'>Password{editItem ? ' (leave blank to keep)' : ''}</label>
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type='password' required={!editItem} className='w-full border border-gray-300 rounded-md px-3 py-2.5' />
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
                <button type='button' onClick={() => setModalOpen(false)} className='px-4 py-2 border border-gray-300 rounded-md'>Cancel</button>
                <button type='submit' className='px-4 py-2 bg-black text-white rounded-md'>{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccessManagement
