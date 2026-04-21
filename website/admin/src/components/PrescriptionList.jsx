import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const PrescriptionList = ({ doctorId, backendUrl }) => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    useEffect(() => {
        fetchPrescriptions();
    }, [doctorId]);

    const fetchPrescriptions = async () => {
        try {
            const token = localStorage.getItem('dToken');
            const response = await axios.get(
                `${backendUrl}/api/prescription/doctor/${doctorId}`,
                {
                    headers: { dToken: token }
                }
            );

            if (response.data.success) {
                setPrescriptions(response.data.prescriptions);
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            toast.error('Failed to load prescriptions');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadToDrive = async (prescriptionId) => {
        const accessToken = localStorage.getItem('googleAccessToken');
        if (!accessToken) {
            toast.error('Please authorize Google Drive access first');
            return;
        }

        try {
            const token = localStorage.getItem('dToken');
            const response = await axios.post(
                `${backendUrl}/api/prescription/upload-drive`,
                {
                    prescriptionId,
                    accessToken
                },
                {
                    headers: { dToken: token }
                }
            );

            if (response.data.success) {
                toast.success('Uploaded to Google Drive successfully!');
                fetchPrescriptions();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error uploading to Drive:', error);
            toast.error('Failed to upload to Google Drive');
        }
    };

    const handleDownload = async (prescriptionId) => {
        try {
            window.open(`${backendUrl}/api/prescription/download/${prescriptionId}`, '_blank');
        } catch (error) {
            console.error('Error downloading prescription:', error);
            toast.error('Failed to download prescription');
        }
    };

    const viewDetails = (prescription) => {
        setSelectedPrescription(prescription);
    };

    if (loading) {
        return <div className="text-center py-8">Loading prescriptions...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Prescriptions</h2>

            {prescriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No prescriptions found
                </div>
            ) : (
                <div className="grid gap-4">
                    {prescriptions.map((prescription) => (
                        <div
                            key={prescription._id}
                            className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {prescription.patientName}
                                    </h3>
                                    <p className="text-gray-600 mt-1">
                                        <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
                                    </p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Created: {new Date(prescription.createdAt).toLocaleDateString()}
                                    </p>
                                    
                                    {prescription.googleDrive?.fileUrl && (
                                        <div className="mt-2 flex items-center text-green-600">
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                                            </svg>
                                            <span className="text-sm">Saved to Google Drive</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <button
                                        onClick={() => viewDetails(prescription)}
                                        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-600 text-sm"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleDownload(prescription._id)}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                    >
                                        Download PDF
                                    </button>
                                    {!prescription.googleDrive?.fileUrl && (
                                        <button
                                            onClick={() => handleUploadToDrive(prescription._id)}
                                            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                                        >
                                            Upload to Drive
                                        </button>
                                    )}
                                    {prescription.googleDrive?.fileUrl && (
                                        <a
                                            href={prescription.googleDrive.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm text-center"
                                        >
                                            Open in Drive
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Prescription Details Modal */}
            {selectedPrescription && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold">Prescription Details</h3>
                            <button
                                onClick={() => setSelectedPrescription(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="font-semibold text-gray-700">Patient:</p>
                                <p className="text-gray-600">{selectedPrescription.patientName}</p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-700">Doctor:</p>
                                <p className="text-gray-600">{selectedPrescription.doctorName}</p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-700">Diagnosis:</p>
                                <p className="text-gray-600">{selectedPrescription.diagnosis}</p>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-700 mb-2">Medications:</p>
                                {selectedPrescription.medications.map((med, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded mb-2">
                                        <p className="font-medium">{index + 1}. {med.name}</p>
                                        <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                                        <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                                        <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                                        {med.instructions && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                Instructions: {med.instructions}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {selectedPrescription.notes && (
                                <div>
                                    <p className="font-semibold text-gray-700">Additional Notes:</p>
                                    <p className="text-gray-600">{selectedPrescription.notes}</p>
                                </div>
                            )}

                            {selectedPrescription.followUpDate && (
                                <div>
                                    <p className="font-semibold text-gray-700">Follow-up Date:</p>
                                    <p className="text-gray-600">
                                        {new Date(selectedPrescription.followUpDate).toLocaleDateString()}
                                    </p>
                                </div>
                            )}

                            <div>
                                <p className="font-semibold text-gray-700">Created:</p>
                                <p className="text-gray-600">
                                    {new Date(selectedPrescription.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrescriptionList;
