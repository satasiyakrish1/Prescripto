import React, { createContext, useState } from 'react'
import { toast } from 'react-toastify'
import { API_URL } from '../utils/constants'

export const StaffContext = createContext()

const StaffContextProvider = ({ children }) => {
  const [staffData, setStaffData] = useState([])
  const [loading, setLoading] = useState(false)

  const getStaffList = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/admin/staff/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'aToken': localStorage.getItem('aToken')
        }
      })
      const data = await response.json()
      if (data.success) {
        setStaffData(data.staffList || [])
      } else {
        toast.error(data.message || 'Failed to fetch staff list')
      }
    } catch (error) {
      toast.error('Failed to fetch staff list')
    } finally {
      setLoading(false)
    }
  }

  const addStaff = async (staffInfo) => {
    try {
      setLoading(true)
      const formData = new FormData()
      
      // Log the staffInfo for debugging
      console.log('Staff info being submitted:', staffInfo)
      
      // Ensure required fields are present
      if (!staffInfo.name || !staffInfo.email || !staffInfo.password || !staffInfo.role || !staffInfo.department) {
        toast.error('Missing required fields')
        setLoading(false)
        return
      }
      
      Object.keys(staffInfo).forEach(key => {
        // Only append if the value is defined and not null
        if (staffInfo[key] !== undefined && staffInfo[key] !== null) {
          // Convert 'avatar' field to 'image' for backend compatibility
          if (key === 'avatar') {
            if (staffInfo[key] instanceof File) {
              formData.append('image', staffInfo[key])
            }
          } 
          // Convert status to lowercase to match backend schema
          else if (key === 'status') {
            // Ensure status is always lowercase for backend compatibility
            formData.append(key, String(staffInfo[key]).toLowerCase())
          } else {
            formData.append(key, staffInfo[key])
          }
        }
      })
      
      // Check if aToken exists
      const aToken = localStorage.getItem('aToken')
      if (!aToken) {
        toast.error('Authentication token missing. Please login again.')
        return
      }
      
      const response = await fetch(`${API_URL}/api/admin/staff/add`, {
        method: 'POST',
        headers: {
          'aToken': aToken
          // Note: Don't set Content-Type when sending FormData,
          // browser will set it automatically with the correct boundary
        },
        body: formData
      })
      
      const data = await response.json()
      console.log('Server response:', data)
      
      if (response.ok) {
        toast.success('Staff member added successfully')
        getStaffList()
      } else {
        // More specific error handling
        if (data.message) {
          console.error('Server error message:', data.message)
          toast.error(data.message)
        } else if (response.status === 400) {
          console.error('Bad request error (400):', data)
          toast.error('Missing required fields. Please check your form.')
        } else if (response.status === 401 || response.status === 403) {
          console.error('Authentication error:', response.status)
          toast.error('Authentication failed. Please login again.')
        } else if (response.status === 409) {
          console.error('Conflict error (409):', data)
          toast.error('Email already registered. Please use a different email.')
        } else {
          console.error('Unknown error:', response.status, data)
          toast.error('Failed to add staff member')
        }
      }
    } catch (error) {
      console.error('Staff addition error:', error)
      // Log more detailed information about the error
      if (error.response) {
        console.error('Response error data:', error.response.data)
        console.error('Response error status:', error.response.status)
        toast.error(error.response.data?.message || 'Failed to add staff member. Please try again.')
      } else if (error.request) {
        console.error('Request error:', error.request)
        toast.error('Network error. Please check your connection and try again.')
      } else {
        console.error('Error message:', error.message)
        toast.error('Failed to add staff member. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const updateStaff = async (staffId, staffInfo) => {
    try {
      setLoading(true)
      const formData = new FormData()
      
      // Log the staffInfo for debugging
      console.log('Staff info being updated:', staffInfo)
      
      Object.keys(staffInfo).forEach(key => {
        // Only append if the value is defined and not null
        if (staffInfo[key] !== undefined && staffInfo[key] !== null) {
          // Convert 'avatar' field to 'image' for backend compatibility
          if (key === 'avatar') {
            formData.append('image', staffInfo[key])
          } 
          // Convert status to lowercase to match backend schema
          else if (key === 'status') {
            // Ensure status is always lowercase for backend compatibility
            formData.append(key, String(staffInfo[key]).toLowerCase())
          } else {
            formData.append(key, staffInfo[key])
          }
        }
      })
      // Check if aToken exists
      const aToken = localStorage.getItem('aToken')
      if (!aToken) {
        toast.error('Authentication token missing. Please login again.')
        return
      }
      
      const response = await fetch(`${API_URL}/api/admin/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'aToken': aToken
          // Note: Don't set Content-Type when sending FormData,
          // browser will set it automatically with the correct boundary
        },
        body: formData
      })
      
      const data = await response.json()
      console.log('Server response:', data)
      
      if (response.ok) {
        toast.success('Staff member updated successfully')
        getStaffList()
      } else {
        // More specific error handling
        if (data.message) {
          console.error('Server error message:', data.message)
          toast.error(data.message)
        } else if (response.status === 400) {
          console.error('Bad request error (400):', data)
          toast.error('Missing required fields. Please check your form.')
        } else if (response.status === 401 || response.status === 403) {
          console.error('Authentication error:', response.status)
          toast.error('Authentication failed. Please login again.')
        } else if (response.status === 404) {
          console.error('Not found error (404):', data)
          toast.error('Staff member not found.')
        } else {
          console.error('Unknown error:', response.status, data)
          toast.error('Failed to update staff member')
        }
      }
    } catch (error) {
      console.error('Staff update error:', error)
      // Log more detailed information about the error
      if (error.response) {
        console.error('Response error data:', error.response.data)
        console.error('Response error status:', error.response.status)
        toast.error(error.response.data?.message || 'Failed to update staff member. Please try again.')
      } else if (error.request) {
        console.error('Request error:', error.request)
        toast.error('Network error. Please check your connection and try again.')
      } else {
        console.error('Error message:', error.message)
        toast.error('Failed to update staff member. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteStaff = async (staffId) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/admin/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'aToken': localStorage.getItem('aToken')
        }
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Staff member deleted successfully')
        getStaffList()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to delete staff member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <StaffContext.Provider value={{
      staffData,
      loading,
      getStaffList,
      addStaff,
      updateStaff,
      deleteStaff
    }}>
      {children}
    </StaffContext.Provider>
  )
}

export default StaffContextProvider