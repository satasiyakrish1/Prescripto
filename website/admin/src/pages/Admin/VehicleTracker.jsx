import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const VehicleTracker = () => {
    const { aToken } = useContext(AdminContext);
    const { backendUrl } = useContext(AppContext);
    
    const [vehicles, setVehicles] = useState([]);
    const [activeLocations, setActiveLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [center, setCenter] = useState([0, 0]);
    const [autoUpdate, setAutoUpdate] = useState(true);

    // Fetch active vehicles and their locations
    const fetchActiveLocations = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/admin/gps/active`, {
                headers: { aToken }
            });
            setActiveLocations(response.data);
            
            // Set center to first vehicle's location if available
            if (response.data.length > 0) {
                setCenter([response.data[0].latitude, response.data[0].longitude]);
            }
            
            setError(null);
        } catch (error) {
            console.error('Error fetching active locations:', error);
            setError('Failed to fetch vehicle locations');
            toast.error('Failed to fetch vehicle locations');
        } finally {
            setLoading(false);
        }
    };

    // Fetch vehicles list
    const fetchVehicles = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/admin/vehicle/all`, {
                headers: { aToken }
            });
            setVehicles(response.data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast.error('Failed to fetch vehicles list');
        }
    };

    // Get vehicle details by ID
    const getVehicleDetails = (vehicleId) => {
        return vehicles.find(v => v._id === vehicleId) || {};
    };

    useEffect(() => {
        fetchVehicles();
        fetchActiveLocations();

        // Set up auto-update interval
        let intervalId;
        if (autoUpdate) {
            intervalId = setInterval(() => {
                fetchActiveLocations();
            }, 5000); // Update every 5 seconds
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [autoUpdate, aToken]);

    if (loading) {
        return <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="bg-white p-4 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Vehicle Tracker</h1>
                <div className="flex items-center mt-2">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={autoUpdate}
                            onChange={(e) => setAutoUpdate(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <span>Auto Update (5s)</span>
                    </label>
                    <button
                        onClick={fetchActiveLocations}
                        className="ml-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
                    >
                        Refresh Now
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {activeLocations.map((location) => {
                        const vehicle = getVehicleDetails(location.vehicleId);
                        return (
                            <Marker
                                key={location.vehicleId}
                                position={[location.latitude, location.longitude]}
                                eventHandlers={{
                                    click: () => setSelectedVehicle(vehicle)
                                }}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <h3 className="font-bold">{vehicle.vehicleNumber}</h3>
                                        <p>Type: {vehicle.type}</p>
                                        <p>Status: {vehicle.status}</p>
                                        <p>Speed: {location.speed || 0} km/h</p>
                                        <p>Last Updated: {new Date(location.timestamp).toLocaleString()}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
        </div>
    );
};

export default VehicleTracker;