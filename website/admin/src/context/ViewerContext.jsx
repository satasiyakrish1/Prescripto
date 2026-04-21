import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AppContextProvider from './AppContext.jsx';
export const ViewerContext = createContext();

export const useViewer = () => {
  const ctx = useContext(ViewerContext);
  if (!ctx) {
    throw new Error('useViewer must be used within a ViewerContextProvider');
  }
  return ctx;
};

const ViewerContextProvider = (props) => {
  const [vToken, setVToken] = useState(localStorage.getItem('vToken') || '');
  const [vRole, setVRole] = useState(localStorage.getItem('vRole') || '');
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('vToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.vToken = token;
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          if (!isTokenExpired) {
            setIsTokenExpired(true);
            localStorage.removeItem('vToken');
            setVToken('');
            toast.error('Viewer session expired. Please login again.');
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [isTokenExpired]);

  const value = { vToken, setVToken, vRole, setVRole };
  return (
    <ViewerContext.Provider value={value}>
      {props.children}
    </ViewerContext.Provider>
  );
};

export default ViewerContextProvider;
