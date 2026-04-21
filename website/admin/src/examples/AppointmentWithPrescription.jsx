import React, { useState, useContext } from 'react';
import { DoctorContext } from '../context/DoctorContext';
import { AppContext } from '../context/AppContext';
import PrescriptionForm from '../components/PrescriptionForm';
import { toast } from 'react-toastify';

/**
 * Example: How to integrate prescription creation into your appointment details page
 * 
 * This component shows how to add a "Create Prescription" button to your existing
 * appointment management interface.
 */

const AppointmentWithPrescription = ({ appointment }) => {
    const { dToken } = useContext(DoctorContext);
    const { backendUrl } = useContext(AppContext);
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

    const handlePrescriptionSuccess = (prescription) => {
        toast.success('Prescription created and saved successfully!');
        setShowPrescriptionForm(false);
        
        // Optional: Update appointment status or refresh data
        console.log('Prescription created:', prescription);
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Existing Appointment Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Appointment Details</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-gray-600">Patient Name</p>
                        <p className="font-semibold">{appointment.userData.name}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Date & Time</p>
                        <p className="font-semibold">
                            {appointment.slotDate} at {appointment.slotTime}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Status</p>
                        <p className="font-semibold">
                            {appointment.isCompleted ? 'Completed' : 
                             appointment.cancelled ? 'Cancelled' : 'Pending'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-semibold">₹{appointment.amount}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                    {!appointment.isCompleted && !appointment.cancelled && (
                        <>
                            <button
                                onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {showPrescriptionForm ? 'Hide Form' : '📝 Create Prescription'}
                            </button>
                            
                            <button
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                ✓ Complete Appointment
                            </button>
                            
                            <button
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                ✗ Cancel Appointment
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Prescription Form (conditionally rendered) */}
            {showPrescriptionForm && (
                <div className="bg-gray-50 rounded-lg p-6">
                    <PrescriptionForm
                        appointmentId={appointment._id}
                        backendUrl={backendUrl}
                        onSuccess={handlePrescriptionSuccess}
                    />
                </div>
            )}

            {/* Existing Prescriptions for this Appointment */}
            {appointment.prescriptions && appointment.prescriptions.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h3 className="text-xl font-bold mb-4">Previous Prescriptions</h3>
                    <div className="space-y-3">
                        {appointment.prescriptions.map((prescription) => (
                            <div 
                                key={prescription._id}
                                className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                            >
                                <div>
                                    <p className="font-semibold">{prescription.diagnosis}</p>
                                    <p className="text-sm text-gray-600">
                                        Created: {new Date(prescription.createdAt).toLocaleDateString()}
                                    </p>
                                    {prescription.googleDrive?.fileUrl && (
                                        <span className="text-xs text-green-600">
                                            ✓ Saved to Google Drive
                                        </span>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <a
                                        href={`${backendUrl}/api/prescription/download/${prescription._id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-600 text-sm"
                                    >
                                        Download
                                    </a>
                                    {prescription.googleDrive?.fileUrl && (
                                        <a
                                            href={prescription.googleDrive.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                        >
                                            Open in Drive
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentWithPrescription;

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Import this component or copy the prescription form integration
 * 2. Add to your existing appointment details page
 * 3. Pass the appointment object as a prop
 * 
 * Example usage in your router:
 * 
 * import AppointmentWithPrescription from './examples/AppointmentWithPrescription';
 * 
 * <Route 
 *   path="/appointment/:id" 
 *   element={<AppointmentWithPrescription appointment={appointmentData} />} 
 * />
 * 
 * Or integrate directly into your existing appointment component:
 * 
 * import PrescriptionForm from './components/PrescriptionForm';
 * 
 * // In your component
 * const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
 * 
 * // Add button
 * <button onClick={() => setShowPrescriptionForm(true)}>
 *   Create Prescription
 * </button>
 * 
 * // Add form
 * {showPrescriptionForm && (
 *   <PrescriptionForm
 *     appointmentId={appointment._id}
 *     backendUrl={backendUrl}
 *     onSuccess={(prescription) => {
 *       toast.success('Prescription created!');
 *       setShowPrescriptionForm(false);
 *     }}
 *   />
 * )}
 */
