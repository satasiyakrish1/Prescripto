import React from 'react';
import MedicineSearch from '../components/MedicineSearch';
import SEO from '../components/SEO';

const Medicines = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <SEO 
        title="Medicines - Browse and Search Medications | Prescripto"
        description="Search and browse through our extensive database of medications. Find information about dosage, side effects, and availability."
        keywords="medicines, medications, pharmacy, drugs, prescriptions, healthcare, medicine search"
        canonicalUrl="/medicines"
      />
      <h1 className="text-3xl font-bold mb-6">Medicine Search</h1>
      <p className="text-gray-600 mb-8">Search for medicines by name, category, or description.</p>
      <MedicineSearch />
    </div>
  );
};

export default Medicines;