import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MedicineDetails = () => {
  const { id } = useParams();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedicineDetails = async () => {
      try {
        const response = await axios.get(`/api/medicines/${id}`);
        setMedicine(response.data);
      } catch (err) {
        setError('Failed to fetch medicine details. Please try again.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicineDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-gray-500">Medicine not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{medicine.name}</h1>
          <p className="text-lg text-gray-600">{medicine.genericName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">General Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Drug Class:</span> {medicine.drugClass}</p>
              <p><span className="font-medium">Dosage Form:</span> {medicine.dosageForm}</p>
              <p><span className="font-medium">Strength:</span> {medicine.strength}</p>
              <p><span className="font-medium">Composition:</span> {medicine.composition}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Clinical Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Clinical Pharmacology:</span> {medicine.clinicalPharmacology}</p>
              <p><span className="font-medium">Storage:</span> {medicine.storage}</p>
              <p><span className="font-medium">Pregnancy Category:</span> {medicine.pregnancy}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Description</h2>
          <p className="text-gray-700">{medicine.description}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Indications & Usage</h2>
          <p className="text-gray-700">{medicine.indications}</p>
          <div className="mt-3">
            <h3 className="text-lg font-medium mb-2">Administration</h3>
            <p className="text-gray-700">{medicine.usage}</p>
          </div>
        </div>

        {medicine.contraindications && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3 text-red-600">Contraindications</h2>
            <p className="text-gray-700">{medicine.contraindications}</p>
          </div>
        )}

        {medicine.warnings && medicine.warnings.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3 text-red-600">Warnings</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {medicine.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {medicine.sideEffects && medicine.sideEffects.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Side Effects</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {medicine.sideEffects.map((effect, index) => (
                <li key={index}>{effect}</li>
              ))}
            </ul>
          </div>
        )}

        {medicine.precautions && medicine.precautions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Precautions</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {medicine.precautions.map((precaution, index) => (
                <li key={index}>{precaution}</li>
              ))}
            </ul>
          </div>
        )}

        {medicine.interactions && medicine.interactions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Drug Interactions</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {medicine.interactions.map((interaction, index) => (
                <li key={index}>{interaction}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineDetails;