import React, { useState, useEffect, useContext, useCallback } from 'react'
import { AdminContext } from '../context/AdminContext'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Calendar, Clock, MapPin, Users, DollarSign, Tag, X, Edit, Trash2, Plus,
  Download, BarChart2, Search, Filter, Eye, RefreshCw, Upload, FileText,
  TrendingUp, Activity, CheckCircle, AlertCircle, UserCheck, Mail,
  Phone, Globe, Share2, QrCode, Copy, ExternalLink, Loader2
} from 'lucide-react'

// Enhanced Modal Component
const CRMModal = ({ isOpen, onClose, title, children, size = "md", actions }) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl", 
    xl: "max-w-4xl",
    full: "max-w-7xl"
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              {title}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/80 rounded-xl transition-all">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">{children}</div>
          {actions && (
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              {actions}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// CRM Stats Card
const CRMStatsCard = ({ title, value, change, icon: Icon, color = "indigo", trend, onClick }) => {
  const colorClasses = {
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-green-500 to-green-600",
    blue: "from-primary to-blue-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600"
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

// Event Card Component
const EventCard = ({ event, onEdit, onDelete, onViewParticipants, onViewAnalytics, onShare }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'ongoing': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {event.banner && (
        <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
          <img 
            src={event.banner} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
          </div>
          <button
            onClick={() => onShare(event)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>{event.duration} minutes</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>{event.participantCount || 0} registered</span>
            {event.rsvpLimit > 0 && <span>/ {event.rsvpLimit} max</span>}
          </div>
          {event.eventType === 'paid' && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span>${event.price}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewParticipants(event)}
              className=" #5f6FFF text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm"
            >
              <UserCheck className="w-4 h-4" />
              Participants
            </button>
            <button
              onClick={() => onViewAnalytics(event)}
              className="bg-purple-50 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2 text-sm"
            >
              <BarChart2 className="w-4 h-4" />
              Analytics
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(event)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(event)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Participant Management Component
const ParticipantManager = ({ eventId, participants, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredParticipants, setFilteredParticipants] = useState(participants)

  useEffect(() => {
    const filtered = participants.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredParticipants(filtered)
  }, [searchTerm, participants])

  const exportParticipants = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Registration Date', 'Status'],
      ...filteredParticipants.map(p => [
        p.name || '',
        p.email || '',
        p.phone || '',
        format(new Date(p.registeredAt), 'yyyy-MM-dd'),
        p.status || 'registered'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event-${eventId}-participants.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <span className="text-sm text-gray-600">
            {filteredParticipants.length} of {participants.length} participants
          </span>
        </div>
        <button
          onClick={exportParticipants}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredParticipants.map((participant, index) => (
              <tr key={participant._id || index} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{participant.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-600">{participant.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-600">{participant.phone || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {format(new Date(participant.registeredAt), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    participant.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    participant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {participant.status || 'registered'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1 text-blue-600 hover: #5f6FFF rounded">
                      <Mail className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Main Enhanced Event Management Component
const EnhancedEventManagement = () => {
  const { aToken, handle401Error } = useContext(AdminContext)
  const { backendUrl } = useContext(AppContext)
  
  // State management
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalParticipants: 0,
    revenue: 0
  })
  
  // Modal states
  const [modals, setModals] = useState({
    participants: false,
    analytics: false,
    share: false,
    create: false
  })
  
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${backendUrl}/api/events/admin`, {
        headers: { aToken }
      })
      
      if (response.data.success) {
        setEvents(response.data.events || [])
        // Calculate stats
        const totalEvents = response.data.events.length
        const upcomingEvents = response.data.events.filter(e => new Date(e.date) > new Date()).length
        const totalParticipants = response.data.events.reduce((sum, e) => sum + (e.participantCount || 0), 0)
        const revenue = response.data.events
          .filter(e => e.eventType === 'paid')
          .reduce((sum, e) => sum + ((e.participantCount || 0) * (e.price || 0)), 0)
        
        setStats({ totalEvents, upcomingEvents, totalParticipants, revenue })
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      if (!handle401Error(error)) {
        toast.error('Error fetching events')
      }
    } finally {
      setLoading(false)
    }
  }, [backendUrl, aToken, handle401Error])

  // Fetch participants for an event
  const fetchParticipants = async (eventId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/events/${eventId}/participants`, {
        headers: { aToken }
      })
      
      if (response.data.success) {
        setParticipants(response.data.participants || [])
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
      toast.error('Error fetching participants')
    }
  }

  useEffect(() => {
    if (aToken) {
      fetchEvents()
    }
  }, [aToken, fetchEvents])

  // Modal handlers
  const openModal = (type, event = null) => {
    setModals(prev => ({ ...prev, [type]: true }))
    setSelectedEvent(event)
    
    if (type === 'participants' && event) {
      fetchParticipants(event._id)
    }
  }

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }))
    setSelectedEvent(null)
    setParticipants([])
  }

  // Event handlers
  const handleEdit = (event) => {
    // Navigate to edit form or open edit modal
    console.log('Edit event:', event)
  }

  const handleDelete = async (event) => {
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        await axios.delete(`${backendUrl}/api/events/${event._id}`, {
          headers: { aToken }
        })
        toast.success('Event deleted successfully')
        fetchEvents()
      } catch (error) {
        console.error('Error deleting event:', error)
        toast.error('Error deleting event')
      }
    }
  }

  const handleShare = (event) => {
    const shareUrl = `${window.location.origin}/events/${event._id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Event link copied to clipboard!')
  }

  // Filter events based on search
  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management CRM</h1>
            <p className="text-gray-600">Advanced event management with participant tracking and analytics</p>
          </div>
          <button
            onClick={() => openModal('create')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        {/* CRM Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CRMStatsCard
            title="Total Events"
            value={stats.totalEvents}
            change="+15% this month"
            icon={Calendar}
            color="indigo"
            trend="up"
          />
          <CRMStatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            change="Next 30 days"
            icon={Clock}
            color="blue"
          />
          <CRMStatsCard
            title="Total Participants"
            value={stats.totalParticipants}
            change="+23% this month"
            icon={Users}
            color="green"
            trend="up"
          />
          <CRMStatsCard
            title="Revenue Generated"
            value={`$${stats.revenue.toFixed(2)}`}
            change="+18% this month"
            icon={DollarSign}
            color="purple"
            trend="up"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchEvents}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">Create your first event to get started</p>
            <button
              onClick={() => openModal('create')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewParticipants={(event) => openModal('participants', event)}
                onViewAnalytics={(event) => openModal('analytics', event)}
                onShare={handleShare}
              />
            ))}
          </div>
        )}

        {/* Participants Modal */}
        <CRMModal
          isOpen={modals.participants}
          onClose={() => closeModal('participants')}
          title={`Participants - ${selectedEvent?.title}`}
          size="xl"
        >
          <ParticipantManager
            eventId={selectedEvent?._id}
            participants={participants}
            onClose={() => closeModal('participants')}
          />
        </CRMModal>

        {/* Analytics Modal */}
        <CRMModal
          isOpen={modals.analytics}
          onClose={() => closeModal('analytics')}
          title={`Analytics - ${selectedEvent?.title}`}
          size="xl"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6">
                <h3 className="font-semibold text-indigo-900 mb-4">Registration Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-indigo-800">Total Registrations</span>
                    <span className="font-medium text-indigo-900">{selectedEvent?.participantCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-indigo-800">Confirmed Attendees</span>
                    <span className="font-medium text-indigo-900">{Math.floor((selectedEvent?.participantCount || 0) * 0.8)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-indigo-800">Conversion Rate</span>
                    <span className="font-medium text-indigo-900">85%</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <h3 className="font-semibold text-green-900 mb-4">Revenue Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">Ticket Price</span>
                    <span className="font-medium text-green-900">${selectedEvent?.price || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">Total Revenue</span>
                    <span className="font-medium text-green-900">
                      ${((selectedEvent?.participantCount || 0) * (selectedEvent?.price || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">Average per Participant</span>
                    <span className="font-medium text-green-900">${selectedEvent?.price || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CRMModal>
      </div>
    </div>
  )
}

export default EnhancedEventManagement
