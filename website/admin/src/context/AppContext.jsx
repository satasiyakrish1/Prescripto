import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

export const useAuth = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAuth must be used within an AppContextProvider');
    }
    return context;
}

const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    // Default config
    const defaultSymbol = import.meta.env.VITE_CURRENCY || '$'

    // Helper to map symbol to code for initial load if code is missing
    const getCodeFromSymbol = (sym) => {
        if (sym === '₹') return 'INR';
        if (sym === '€') return 'EUR';
        if (sym === '£') return 'GBP';
        return 'USD';
    }

    const defaultCode = getCodeFromSymbol(defaultSymbol)

    // State
    const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('currencySymbol') || defaultSymbol)
    const [currencyCode, setCurrencyCode] = useState(localStorage.getItem('currencyCode') || defaultCode)
    const [exchangeRates, setExchangeRates] = useState({});

    // Fetch Exchange Rates
    useEffect(() => {
        const fetchRates = async () => {
            try {
                // Using a free API for demonstration (base USD by default usually)
                const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
                setExchangeRates(response.data.rates);
            } catch (error) {
                console.error("Failed to fetch exchange rates", error);
            }
        };

        fetchRates();
        // Polling interval for live rates (every 10 minutes)
        const interval = setInterval(fetchRates, 600000);
        return () => clearInterval(interval);
    }, []);

    // Persistence
    useEffect(() => {
        localStorage.setItem('currencySymbol', currencySymbol)
        localStorage.setItem('currencyCode', currencyCode)
    }, [currencySymbol, currencyCode])

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        if (!slotDate) return ''
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2]
    }

    // Function to calculate the age eg. ( 20_01_2000 => 24 )
    const calculateAge = (dob) => {
        if (!dob) return 0
        const today = new Date()
        const birthDate = new Date(dob)
        let age = today.getFullYear() - birthDate.getFullYear()
        return age
    }

    // Dynamic Currency Converter
    const calculateCurrency = (amount) => {
        if (!amount) return 0;

        // ASSUMPTION: The original prices in the database are in Indian Rupee (INR)
        // because the app started with '₹' default.
        const baseCurrency = 'INR';

        // If rates aren't loaded yet, return original
        if (!exchangeRates[baseCurrency] || !exchangeRates[currencyCode]) return amount;

        // Convert Base(INR) -> USD -> Target
        // Price in USD = Price in INR / Rate of INR (per 1 USD)
        const priceInUSD = amount / exchangeRates[baseCurrency];

        // Price in Target = Price in USD * Rate of Target (per 1 USD)
        const convertedPrice = priceInUSD * exchangeRates[currencyCode];

        return Math.round(convertedPrice * 100) / 100; // Round to 2 decimals
    }

    const value = {
        backendUrl,
        currency: currencySymbol,
        currencySymbol,
        setCurrencySymbol,
        currencyCode,
        setCurrencyCode,
        slotDateFormat,
        calculateAge,
        calculateCurrency
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider