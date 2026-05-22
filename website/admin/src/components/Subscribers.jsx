
import React, { useEffect, useContext, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import { useTheme } from '../context/ThemeContext'
import _ from 'lodash'

const Subscribers = () => {
  const { subscribers, getAllSubscribers } = useContext(AdminContext)
  const { darkMode } = useTheme()
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    getAllSubscribers()
  }, [])

  // Format date helper function - compact format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    
    const options = { month: 'short', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  // Get current date formatted
  const getCurrentFormattedDate = () => {
    const now = new Date()
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return now.toLocaleDateString('en-US', options)
  }

  // Function to export data to Excel
  const exportToExcel = () => {
    setIsExporting(true)
    
    try {
      // Prepare the data for export with proper columns
      const exportData = subscribers.map(subscriber => ({
        'Email': subscriber.email,
        'Subscription Date': formatDate(subscriber.subscriptionDate),
        'Status': subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1),
        'Source': subscriber.source || 'Website',
        'Preferences': subscriber.preferences?.join(', ') || 'General'
      }))
      
      // Convert data to CSV format
      const headers = ['Email', 'Subscription Date', 'Status', 'Source', 'Preferences']
      let csvContent = headers.join(',') + '\n'
      
      exportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || ''
          // Escape quotes and wrap in quotes if it contains commas
          return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value
        })
        csvContent += values.join(',') + '\n'
      })
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `subscribers_data_${new Date().getTime()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Failed to export to Excel. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }
  
  // Function to export data to PDF
  const exportToPDF = () => {
    setIsExporting(true)
    
    try {
      // We'll use a simple approach to create a table structure in HTML
      const tableHeader = `
        <tr style="background-color: #4285f4; color: white; text-align: left;">
          <th style="padding: 8px;">Email</th>
          <th style="padding: 8px;">Subscription Date</th>
          <th style="padding: 8px;">Status</th>
          <th style="padding: 8px;">Source</th>
          <th style="padding: 8px;">Preferences</th>
        </tr>
      `
      
      let tableRows = ''
      subscribers.forEach((subscriber, index) => {
        const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white'
        tableRows += `
          <tr style="background-color: ${bgColor};">
            <td style="padding: 8px;">${subscriber.email}</td>
            <td style="padding: 8px;">${formatDate(subscriber.subscriptionDate)}</td>
            <td style="padding: 8px;">${subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1)}</td>
            <td style="padding: 8px;">${subscriber.source || 'Website'}</td>
            <td style="padding: 8px;">${subscriber.preferences?.join(', ') || 'General'}</td>
          </tr>
        `
      })
      
      // Complete HTML document for printing
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Subscribers Data</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              p { color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            </style>
          </head>
          <body>
            <h1>Newsletter Subscribers</h1>
            <p>Exported on: ${getCurrentFormattedDate()}</p>
            <p>Total subscribers: ${subscribers.length}</p>
            
            <table>
              <thead>
                ${tableHeader}
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
      `
      
      // Create a new window for the PDF
      const printWindow = window.open('', '_blank')
      printWindow.document.write(html)
      printWindow.document.close()
      
      // Add a small delay to ensure the content is loaded
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
        setIsExporting(false)
      }, 500)
      
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Failed to export to PDF. Please try again.')
      setIsExporting(false)
    }
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className='flex items-center gap-2'>
          <h2 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Newsletter Subscribers</h2>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? 'bg-blue-900/20 text-blue-400' : ' #5f6FFF text-blue-600'}`}>
            {subscribers.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={exportToExcel}
            disabled={isExporting || subscribers.length === 0}
            className={`p-1.5 rounded transition-colors ${darkMode 
              ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 disabled:opacity-30' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30'}`}
            title="Export to Excel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button 
            onClick={exportToPDF}
            disabled={isExporting || subscribers.length === 0}
            className={`p-1.5 rounded transition-colors ${darkMode 
              ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 disabled:opacity-30' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30'}`}
            title="Export to PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
        {subscribers.length > 0 ? subscribers.slice(0, 8).map((subscriber, index) => (
          <div className={`flex items-center justify-between px-4 py-2.5 ${darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`} key={index}>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>{subscriber.email}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatDate(subscriber.subscriptionDate)}
                </p>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${subscriber.status === 'active' ?
                  (darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600') :
                  (darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600')}`}>
                  {subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div className={`px-4 py-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-sm">No subscribers found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Subscribers