import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const search = async (query, token) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      const response = await axios.get(`${backendUrl}/api/search`, {
        params: { query },
        headers: {
          'Content-Type': 'application/json',
          'aToken': token
        }
      });

      if (response.data.success) {
        setSearchResults(response.data.results);
      } else {
        setSearchError('No results found');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to perform search');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchError(null);
  };

  return (
    <SearchContext.Provider value={{
      searchResults,
      isSearching,
      searchError,
      search,
      clearSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext; 