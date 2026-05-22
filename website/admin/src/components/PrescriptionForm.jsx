import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PrescriptionForm = ({ appointmentId, onSuccess, backendUrl }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [medications, setMedications] = useState([
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    const [notes, setNotes] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [saveToGoogleDrive, setSaveToGoogleDrive] = useState(false);
    const [loading, setLoading] = useState(false);

    const addMedication = () => {
        setMedications([
            ...medications,
            { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
        ]);
    };

    const removeMedication = (index) => {
        const newMedications = medications.filter((_, i) => i !== index);
        setMedications(newMedications);
    };

    const updateMedication = (index, field, value) => {
        const newMedications = [...medications];
        newMedications[index][field] = value;
        setMedications(newMedications);
    };

    const handleGoogleDriveAuth = () => {
        // Google OAuth flow
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/google-callback`;
        const scope = 'https://www.googleapis.com/auth/drive.file';
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `response_type=token&` +
            `scope=${scope}`;
        
        window.open(authUrl, 'Google Drive Authorization', 'width=600,height=600');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!diagnosis.trim()) {
            toast.error('Please enter diagnosis');
            return;
        }

        const validMedications = medications.filter(
            med => med.name.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim()
        );

        if (validMedications.length === 0) {
            toast.error('Please add at least one medication');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('dToken');
            
            // Get access token from localStorage if Google Drive is enabled
            let accessToken = null;
            if (saveToGoogleDrive) {
                accessToken = localStorage.getItem('googleAccessToken');
                if (!accessToken) {
                    toast.error('Please authorize Google Drive access first');
                    setLoading(false);
                    return;
                }
            }

            const response = await axios.post(
                `${backendUrl}/api/prescription/create`,
                {
                    appointmentId,
                    diagnosis,
                    medications: validMedications,
                    notes,
                    followUpDate: followUpDate || null,
                    accessToken
                },
                {
                    headers: { dToken: token }
                }
            );

            if (response.data.success) {
                toast.success('Prescription created successfully!');
                if (response.data.prescription.googleDrive) {
                    toast.success('Prescription saved to Google Drive!');
                }
                if (onSuccess) onSuccess(response.data.prescription);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error creating prescription:', error);
            toast.error('Failed to create prescription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Create Prescription</h2>
            
            <form onSubmit={handleSubmit}>
                {/* Diagnosis */}
                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">
                        Diagnosis *
                    </label>
                    <textarea
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Enter diagnosis..."
                        required
                    />
                </div>

                {/* Medications */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-gray-700 font-semibold">
                            Medications *
                        </label>
                        <button
                            type="button"
                            onClick={addMedication}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
                        >
                            + Add Medication
                        </button>
                    </div>

                    {medications.map((med, index) => (
                        <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold">Medication {index + 1}</h4>
                                {medications.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMedication(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={med.name}
                                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                    placeholder="Medicine Name"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="text"
                                    value={med.dosage}
                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                    placeholder="Dosage (e.g., 500mg)"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="text"
                                    value={med.frequency}
                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                    placeholder="Frequency (e.g., Twice daily)"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="text"
                                    value={med.duration}
                                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                    placeholder="Duration (e.g., 7 days)"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <textarea
                                    value={med.instructions}
                                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                    placeholder="Special Instructions (optional)"
                                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="2"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Notes */}
                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">
                        Additional Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Any additional notes or instructions..."
                    />
                </div>

                {/* Follow-up Date */}
                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">
                        Follow-up Date
                    </label>
                    <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Google Drive Option */}
                <div className="mb-6">
                    <label className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={saveToGoogleDrive}
                            onChange={(e) => setSaveToGoogleDrive(e.target.checked)}
                            className="w-5 h-5 text-primary"
                        />
                        <span className="text-gray-700 font-semibold">
                            Save to Google Drive (@prescripto/appointments)
                        </span>
                    </label>
                    {saveToGoogleDrive && !localStorage.getItem('googleAccessToken') && (
                        <button
                            type="button"
                            onClick={handleGoogleDriveAuth}
                            className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                            Authorize Google Drive
                        </button>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold ${
                            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                        }`}
                    >
                        {loading ? 'Creating...' : 'Create Prescription'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PrescriptionForm;
