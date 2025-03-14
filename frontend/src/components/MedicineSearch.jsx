import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const MedicineSearch = () => {
  const { backendUrl } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const handleSearch = async (e, newPage = 1) => {
    e?.preventDefault();
    setPage(newPage);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('query', searchQuery);
      params.append('page', newPage);
      params.append('limit', 20);

      const response = await axios.get(`${backendUrl}/api/medicines/search?${params.toString()}`);
      setMedicines(response.data.medicines);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to fetch medicines. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch(null, 1);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for medicines by name, generic name, or medical use..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {medicines.map((medicine, index) => (
          <div
            key={index}
            className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">{medicine.name}</h3>
              <p className="text-gray-600">{medicine.genericName}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">General Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Drug Class:</span> {medicine.drugClass}</p>
                  <p><span className="font-medium">Dosage Form:</span> {medicine.dosageForm}</p>
                  <p><span className="font-medium">Strength:</span> {medicine.strength}</p>
                  <p><span className="font-medium">Composition:</span> {medicine.composition}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Medical Use</h4>
                <p className="text-sm text-gray-600">{medicine.indications}</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600">{medicine.description}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => window.location.href = `/medicine/${medicine._id}`}
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                View Full Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {medicines.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-4">
          No medicines found. Try different search terms.
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={(e) => handleSearch(e, page - 1)}
            disabled={page === 1}
            className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-600">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={(e) => handleSearch(e, page + 1)}
            disabled={page === pagination.pages}
            className={`px-3 py-1 rounded ${page === pagination.pages ? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicineSearch;