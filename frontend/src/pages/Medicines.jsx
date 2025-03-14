import React from 'react';
import MedicineSearch from '../components/MedicineSearch';

const Medicines = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Medicine Search</h1>
      <p className="text-gray-600 mb-8">Search for medicines by name, category, or description.</p>
      <MedicineSearch />
    </div>
  );
};

export default Medicines;