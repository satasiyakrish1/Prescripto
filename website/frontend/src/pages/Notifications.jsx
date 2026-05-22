import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AppContext } from '../context/AppContext'
import Lottie from 'lottie-react'
import notificationAnim from '../assets/Notification.json'

const NotificationItem = ({ n, onMarkRead }) => {
    const typeColors = {
        info: ' #5f6FFF border-primary-200',
        success: 'bg-green-50 border-green-200',
        warning: 'bg-yellow-50 border-yellow-200',
        error: 'bg-red-50 border-red-200'
    }
    return (
        <div className={`p-3 rounded-lg border ${typeColors[n.type] || 'bg-gray-50 border-gray-200'} flex items-start gap-3`}> 
            <div className='flex-1'>
                <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium text-gray-800'>{n.title}</p>
                    <span className='text-[10px] text-gray-500'>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p className='text-sm text-gray-600 mt-1'>{n.message}</p>
                {!n.recipients?.[0]?.isRead && (
                    <button onClick={() => onMarkRead(n._id)} className='mt-2 text-xs px-2 py-1 bg-primary text-white rounded-md'>Mark as read</button>
                )}
            </div>
        </div>
    )
}

const NotificationList = ({ items, onMarkRead }) => {
    if (!items.length) return (
        <div className='p-6 text-center text-gray-500 border rounded-xl bg-white'>
            No notifications yet.
        </div>
    )
    return (
        <div className='space-y-2'>
            {items.map(n => (
                <NotificationItem key={n._id} n={n} onMarkRead={onMarkRead} />
            ))}
        </div>
    )
}

const SystemBadge = () => (
    <span className='text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border'>System</span>
)

const Notifications = () => {
    const { token, backendUrl } = useContext(AppContext)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [DotLottiePlayer, setDotLottiePlayer] = useState(null)
    const [emptyLottieSrc, setEmptyLottieSrc] = useState(null) // for .lottie files

    const load = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get(`${backendUrl}/api/notifications/user`, { headers: { token } })
            if (data.success) setItems(data.notifications || [])
        } catch (e) {
            console.error('Failed to load notifications', e)
        } finally {
            setLoading(false)
        }
    }

    const markRead = async (id) => {
        try {
            await axios.put(`${backendUrl}/api/notifications/user/mark-read/${id}`, {}, { headers: { token } })
            setItems(prev => prev.map(n => n._id === id ? { ...n, recipients: [{ ...(n.recipients?.[0] || {}), isRead: true }] } : n))
        } catch (e) {
            console.error('Failed to mark read', e)
        }
    }

    const markAll = async () => {
        try {
            await axios.put(`${backendUrl}/api/notifications/user/mark-all-read`, {}, { headers: { token } })
            setItems(prev => prev.map(n => ({ ...n, recipients: [{ ...(n.recipients?.[0] || {}), isRead: true }] })))
        } catch (e) {
            console.error('Failed to mark all', e)
        }
    }

    useEffect(() => { load() }, [])

    // Lazy-load lottie player and local empty state asset, tolerating missing file
    useEffect(() => {
        let mounted = true
        import('@lottiefiles/dotlottie-react')
            .then(mod => { if (mounted) setDotLottiePlayer(() => mod.DotLottiePlayer) })
            .catch(() => { if (mounted) setDotLottiePlayer(null) })
        // Try to load local .lottie asset users can replace later
        import('../assets/Notification.json')
            .then(mod => { if (mounted) setEmptyLottieSrc(mod.default || mod) })
            .catch(() => { if (mounted) setEmptyLottieSrc(null) })
        return () => { mounted = false }
    }, [])

    return (
        <div className='max-w-3xl mx-auto px-4 py-6'>
            <header className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                    <h1 className='text-lg font-semibold text-gray-800'>Notifications</h1>
                    <SystemBadge />
                </div>
                <div className='flex items-center gap-2'>
                    <button onClick={markAll} className='px-3 py-1.5 text-sm border rounded-md'>Mark all as read</button>
                    <button onClick={load} className='px-3 py-1.5 text-sm bg-primary text-white rounded-md'>Refresh</button>
                </div>
            </header>

            {loading ? (
                <div className='p-6 text-center text-gray-500 border rounded-xl bg-white'>Loading…</div>
            ) : items.length === 0 ? (
                <div className='py-10 bg-white border rounded-xl flex flex-col items-center justify-center'>
                    <div className='w-64 h-64'>
                        <Lottie animationData={notificationAnim} loop autoplay style={{ width: '100%', height: '100%' }} />
                    </div>
                </div>
            ) : (
                <NotificationList items={items} onMarkRead={markRead} />
            )}
        </div>
    )
}

export default Notifications


