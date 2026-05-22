import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import Constants from 'expo-constants';

// Get correct API URL safely bypassing .env cache
const debuggerHost = Constants.expoConfig?.hostUri;
const ENV_URL = __DEV__ 
  ? (debuggerHost ? `http://${debuggerHost.split(':')[0]}:4000` : 'http://localhost:4000')
  : 'https://krishsatasiya-prescripto.onrender.com';

const BASE_URL = ENV_URL;
export const backendUrl = BASE_URL;

type AppContextType = {
    token: string;
    setToken: (t: string) => void;
    userData: any;
    isAuthenticated: boolean;
    doctors: any[];
    appointments: any[];
    getDoctorsData: () => void;
    getUserAppointments: () => void;
    loadUserProfileData: () => void;
    logout: () => void;
};

export const AppContext = createContext<AppContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAuth must be used within an AppContextProvider');
    }
    return context;
};

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState('');
    const [userData, setUserData] = useState<any>(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        setToken('');
        setUserData(false);
        setIsAuthenticated(false);
        setAppointments([]);
        router.replace('/login');
    };

    const getDoctorsData = async () => {
        try {
            const res = await fetch(`${backendUrl}/api/doctor/list`);
            const data = await res.json();
            if (data.success) {
                setDoctors(data.doctors);
            }
        } catch (error) {
            console.log('Doctor fetch error', error);
        }
    };

    const getUserAppointments = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${backendUrl}/api/user/appointments`, {
                headers: { token }
            });
            const data = await res.json();
            if (data.success) {
                setAppointments(data.appointments.reverse());
            }
        } catch (error) {
            console.log('Appointments fetch error', error);
        }
    };

    const loadUserProfileData = async (tokenOverride?: string) => {
        const currentToken = tokenOverride || token || await AsyncStorage.getItem('userToken');
        if (!currentToken) {
            setLoading(false);
            return;
        }
        
        try {
            const res = await fetch(`${backendUrl}/api/user/get-profile`, {
                headers: { token: currentToken }
            });
            const data = await res.json();
            if (data.success) {
                setUserData(data.userData);
                setIsAuthenticated(true);
                if (!token && !tokenOverride) setToken(currentToken);
            } else {
                if (data.message === 'Unauthorized' || data.message === 'Login Again') {
                  logout();
                }
            }
        } catch (error) {
            console.log('User profile fetch error', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load initial token and profile
        const init = async () => {
          try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (storedToken) {
              setToken(storedToken);
              await loadUserProfileData(storedToken);
            } else {
              setLoading(false);
            }
          } catch (e) {
            console.error('Failed to init auth', e);
            setLoading(false);
          }
        };
        init();
        getDoctorsData();
    }, []);

    useEffect(() => {
        if (token) {
            AsyncStorage.setItem('userToken', token);
            loadUserProfileData();
            getUserAppointments();
        }
    }, [token]);

    const value = {
        token, setToken,
        userData, isAuthenticated,
        doctors, appointments,
        getDoctorsData, getUserAppointments,
        loadUserProfileData, logout
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
