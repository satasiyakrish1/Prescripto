import React, { useState, useContext } from 'react';
import { DoctorContext } from '../context/DoctorContext';
import { AppContext } from '../context/AppContext';
import PrescriptionForm from '../components/PrescriptionForm';
import PrescriptionList from '../components/PrescriptionList';

const DoctorPrescriptions = () => {
    const { dToken } = useContext(DoctorContext);
    const { backendUrl } = useContext(AppContext);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

    // Get doctor ID from token
    const getDoctorId = () => {
        if (!dToken) return null;
        try {
            const payload = JSON.parse(atob(dToken.split('.')[1]));
            return payload.id;
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    };

    const doctorId = getDoctorId();

    const handleCreateSuccess = (prescription) => {
        setShowCreateForm(false);
        setSelectedAppointmentId(null);
        // Refresh the list
        window.location.reload();
    };

    return (
        <div className="m-5 w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Prescriptions</h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                    {showCreateForm ? 'View All Prescriptions' : '+ Create New Prescription'}
                </button>
            </div>

            {showCreateForm ? (
                <div>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Appointment ID (Optional - for linking to appointment)
                        </label>
                        <input
                            type="text"
                            value={selectedAppointmentId || ''}
                            onChange={(e) => setSelectedAppointmentId(e.target.value)}
                            placeholder="Enter appointment ID or leave empty"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <PrescriptionForm
                        appointmentId={selectedAppointmentId}
                        backendUrl={backendUrl}
                        onSuccess={handleCreateSuccess}
                    />
                </div>
            ) : (
                <PrescriptionList
                    doctorId={doctorId}
                    backendUrl={backendUrl}
                />
            )}
        </div>
    );
};

export default DoctorPrescriptions;
