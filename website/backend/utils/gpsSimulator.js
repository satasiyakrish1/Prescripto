import axios from 'axios';

class GPSSimulator {
    constructor(vehicleId, baseUrl, authToken) {
        this.vehicleId = vehicleId;
        this.baseUrl = baseUrl;
        this.authToken = authToken;
        this.isRunning = false;
        this.currentPosition = null;
        this.intervalId = null;
    }

    // Generate random coordinates within a radius of the base position
    generateRandomPosition(basePosition) {
        const radius = 0.01; // Approximately 1km radius
        const randomAngle = Math.random() * 2 * Math.PI;
        const randomDistance = Math.random() * radius;

        const newLat = basePosition.lat + (randomDistance * Math.cos(randomAngle));
        const newLng = basePosition.lng + (randomDistance * Math.sin(randomAngle));

        return { lat: newLat, lng: newLng };
    }

    // Calculate speed between two points
    calculateSpeed(pos1, pos2, timeInterval) {
        if (!pos1 || !pos2) return 0;

        const R = 6371; // Earth's radius in km
        const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
        const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        // Convert to km/h (timeInterval is in milliseconds)
        return (distance / (timeInterval / 3600000));
    }

    // Start simulation
    start(basePosition = { lat: 0, lng: 0 }) {
        if (this.isRunning) return;

        this.isRunning = true;
        this.currentPosition = basePosition;

        this.intervalId = setInterval(async () => {
            const newPosition = this.generateRandomPosition(basePosition);
            const speed = this.calculateSpeed(this.currentPosition, newPosition, 5000);
            
            try {
                await axios.post(`${this.baseUrl}/api/admin/gps/update`, {
                    vehicleId: this.vehicleId,
                    latitude: newPosition.lat,
                    longitude: newPosition.lng,
                    speed: speed,
                    heading: Math.random() * 360, // Random heading
                    accuracy: 10 + Math.random() * 20 // Random accuracy between 10-30 meters
                }, {
                    headers: { aToken: this.authToken }
                });

                this.currentPosition = newPosition;
            } catch (error) {
                console.error('Error updating GPS location:', error);
            }
        }, 5000); // Update every 5 seconds
    }

    // Stop simulation
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }
}

export default GPSSimulator;