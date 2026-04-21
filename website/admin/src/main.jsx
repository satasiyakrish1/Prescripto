import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import AdminContextProvider from './context/AdminContext.jsx'
import DoctorContextProvider from './context/DoctorContext.jsx'
import PharmacyContextProvider from './context/PharmacyContext.jsx'
import AppContextProvider from './context/AppContext.jsx'
import ViewerContextProvider from './context/ViewerContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }}>
    <ViewerContextProvider>
      <AdminContextProvider>
        <DoctorContextProvider>
          <PharmacyContextProvider>
            <AppContextProvider>
              <App />
            </AppContextProvider>
          </PharmacyContextProvider>
        </DoctorContextProvider>
      </AdminContextProvider>
    </ViewerContextProvider>
  </BrowserRouter>,
)
