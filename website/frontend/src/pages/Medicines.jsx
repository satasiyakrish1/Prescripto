import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import MedicineSearch from '../components/MedicineSearch';
import SEO from '../components/SEO';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Search, QrCode, Filter, X, Camera, CheckCircle, AlertCircle, Bookmark, Pill, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Medicines = () => {
  const navigate = useNavigate();
  const { backendUrl, token, userData } = useContext(AppContext);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [detectedMedicine, setDetectedMedicine] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, found, notfound, error

  // Data state
  const [medicines, setMedicines] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [bookmarkedMedicines, setBookmarkedMedicines] = useState([]);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scannerIntervalRef = useRef(null);

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Persistent Cache using sessionStorage
  const getCache = (key) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  };

  const setCache = (key, data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Cache storage failed', e);
    }
  };

  const categories = [
    'Antibiotics', 'Analgesics', 'Antivirals', 'Cardiovascular',
    'Respiratory', 'Gastrointestinal', 'Neurological', 'Dermatological'
  ];

  // GSAP Animations
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.animate-header',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
    );
  }, []);

  useEffect(() => {
    if (!isQrModalOpen) {
      setScanStatus('idle');
    }
  }, [isQrModalOpen]);

  // Fetch bookmarked medicines
  useEffect(() => {
    const fetchBookmarkedMedicines = async () => {
      if (token && userData) {
        try {
          const response = await axios.get(`${backendUrl}/api/user/bookmarked-medicines`, {
            headers: { token }
          });
          if (response.data.success) {
            setBookmarkedMedicines(response.data.bookmarkedMedicines || []);
          }
        } catch (error) {
          console.error('Error fetching bookmarked medicines:', error);
        }
      }
    };
    fetchBookmarkedMedicines();
  }, [token, userData, backendUrl]);

  // Enhanced data completeness scoring system
  const calculateCompletenessScore = useCallback((medicine) => {
    // Field weights based on importance for user decision-making
    // PRIORITY: Title (name) and Description are most important
    const fieldWeights = {
      // HIGHEST PRIORITY - Essential for understanding the medicine
      name: 10,              // Title - Must have, highest priority
      description: 10,       // Description - Critical for understanding

      // Critical fields (high weight)
      genericName: 5,
      indications: 5,

      // Important fields
      drugClass: 3,
      dosageForm: 3,
      strength: 3,
      sideEffects: 3,
      warnings: 3,

      // Useful fields
      composition: 2,
      usage: 2,
      interactions: 2,
      contraindications: 2,
      precautions: 2,

      // Additional fields
      storage: 1,
      pregnancy: 1,
      clinicalPharmacology: 1
    };

    let totalScore = 0;
    let maxPossibleScore = 0;

    // Calculate score for each field
    Object.entries(fieldWeights).forEach(([field, weight]) => {
      const value = medicine[field];
      maxPossibleScore += weight * 5; // Max 5 points per field

      if (!value || value === 'N/A' || value === 'Not specified') {
        return; // Skip empty fields
      }

      let fieldScore = 0;

      if (Array.isArray(value)) {
        // Arrays: score based on number of items
        const itemCount = value.filter(item => item && item.trim()).length;
        if (itemCount > 0) {
          fieldScore = Math.min(itemCount, 5); // Max 5 points
        }
      } else if (typeof value === 'string') {
        // Strings: score based on content length and quality
        const trimmedLength = value.trim().length;

        if (trimmedLength > 200) fieldScore = 5;      // Comprehensive
        else if (trimmedLength > 100) fieldScore = 4; // Detailed
        else if (trimmedLength > 50) fieldScore = 3;  // Good
        else if (trimmedLength > 20) fieldScore = 2;  // Basic
        else if (trimmedLength > 5) fieldScore = 1;   // Minimal
      } else {
        // Other types (numbers, booleans, etc.)
        fieldScore = 1;
      }

      totalScore += fieldScore * weight;
    });

    // BONUS: Extra points if both name AND description are complete (priority boost)
    const hasCompleteName = medicine.name && medicine.name !== 'N/A' && medicine.name.trim().length > 5;
    const hasCompleteDescription = medicine.description &&
      medicine.description !== 'N/A' &&
      medicine.description.trim().length > 50;

    if (hasCompleteName && hasCompleteDescription) {
      totalScore += 50; // Significant bonus for having both priority fields
      maxPossibleScore += 50;
    }

    // Return normalized score (0-100) for better comparison
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }, []);

  // Count N/A values in a medicine
  const countNAValues = useCallback((medicine) => {
    const importantFields = [
      'name', 'genericName', 'drugClass', 'dosageForm', 'strength',
      'description', 'indications', 'usage', 'sideEffects', 'warnings'
    ];

    let naCount = 0;
    importantFields.forEach(field => {
      const value = medicine[field];
      if (!value || value === 'N/A' || value === 'Not specified' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value.trim().length === 0)) {
        naCount++;
      }
    });

    return naCount;
  }, []);

  // Memoized sorting function for better performance
  const sortMedicinesByCompleteness = useCallback((medicines) => {
    if (!medicines || medicines.length === 0) return [];

    // Create array with scores and priority flags to avoid recalculating
    const medicinesWithScores = medicines.map(medicine => {
      const hasCompleteName = medicine.name && medicine.name !== 'N/A' && medicine.name.trim().length > 5;
      const hasCompleteDescription = medicine.description &&
        medicine.description !== 'N/A' &&
        medicine.description.trim().length > 50;

      const naCount = countNAValues(medicine);

      return {
        medicine,
        score: calculateCompletenessScore(medicine),
        hasPriorityFields: hasCompleteName && hasCompleteDescription,
        naCount: naCount // Track number of N/A values
      };
    });

    // Sort with multiple criteria:
    // 1. Fewer N/A values first (medicines with N/A go to back)
    // 2. Priority fields (name + description) complete
    // 3. Then by completeness score
    // 4. Finally alphabetically by name
    return medicinesWithScores
      .sort((a, b) => {
        // FIRST: Push medicines with many N/A values to the back
        if (a.naCount !== b.naCount) {
          return a.naCount - b.naCount; // Fewer N/A first
        }

        // SECOND: Medicines with complete name AND description
        if (a.hasPriorityFields !== b.hasPriorityFields) {
          return b.hasPriorityFields ? 1 : -1; // Priority fields first
        }

        // THIRD: Higher completeness score
        if (b.score !== a.score) {
          return b.score - a.score; // Higher score first
        }

        // FOURTH: Alphabetical by name for consistency
        return (a.medicine.name || '').localeCompare(b.medicine.name || '');
      })
      .map(item => item.medicine);
  }, [calculateCompletenessScore, countNAValues]);

  // Fetch medicines based on search query and filters
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setIsLoading(true);

        // Fetch a reasonable number of medicines (100) to sort and paginate
        const params = {
          page: 1,
          limit: 100, // Fetch 100 medicines to have enough for sorting
        };

        // Add search query - use default popular medicines if no search
        if (debouncedSearchQuery) {
          params.query = debouncedSearchQuery;
        } else if (!hasInitialLoad) {
          // Load some common medicines on initial load
          params.query = 'aspirin';
          setHasInitialLoad(true);
        } else if (hasInitialLoad && !debouncedSearchQuery) {
          // If user cleared search, show common medicines
          params.query = 'pain';
        }

        // Note: FDA API doesn't support category filtering directly
        // Categories are used for UI filtering only

        console.log('Fetching medicines with params:', params);
        const response = await axios.get(`${backendUrl}/api/medicine/search`, { params });
        console.log('Response received:', response.data);

        if (response.data.success) {
          let fetchedMedicines = response.data.medicines || [];
          console.log('Fetched medicines count:', fetchedMedicines.length);

          // Client-side filtering by categories if selected
          if (selectedCategories.length > 0) {
            fetchedMedicines = fetchedMedicines.filter(medicine =>
              selectedCategories.some(cat =>
                medicine.drugClass?.toLowerCase().includes(cat.toLowerCase())
              )
            );
            console.log('After category filter:', fetchedMedicines.length);
          }

          // Sort ALL fetched medicines by data completeness (most complete first)
          const sortedMedicines = sortMedicinesByCompleteness(fetchedMedicines);
          console.log('Sorted medicines count:', sortedMedicines.length);

          // Now apply pagination on the sorted results
          const itemsPerPage = 12;
          const totalItems = sortedMedicines.length;
          const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);

          // Get medicines for current page
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedMedicines = sortedMedicines.slice(startIndex, endIndex);

          console.log('Paginated medicines for page', currentPage, ':', paginatedMedicines.length);

          setMedicines(paginatedMedicines);
          setTotalPages(calculatedTotalPages);
        } else {
          console.log('Response not successful');
          setMedicines([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching medicines:', error);
        console.error('Error details:', error.response?.data || error.message);
        setMedicines([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedicines();
  }, [debouncedSearchQuery, selectedCategories, currentPage, backendUrl, hasInitialLoad, sortMedicinesByCompleteness]);

  const activateCamera = async () => {
    try {
      setIsCameraActive(true);
      setScanStatus('scanning');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        startQRScanner();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please ensure camera permissions are granted.");
      setIsCameraActive(false);
      setScanStatus('error');
    }
  };

  const startQRScanner = () => {
    import('jsqr').then(({ default: jsQR }) => {
      if (scannerIntervalRef.current) clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
            if (code) {
              clearInterval(scannerIntervalRef.current);
              stopCamera();
              fetchMedicineByCode(code.data);
            }
          }
        }
      }, 100);
    });
  };

  const fetchMedicineByCode = async (code) => {
    try {
      setScanStatus('scanning');
      setDetectedMedicine(null);

      // Parse QR code data - it could be in different formats
      let searchTerm = code.trim();

      // Check if QR code contains JSON data
      try {
        const jsonData = JSON.parse(code);
        // If it's JSON, extract the medicine name or NDC
        searchTerm = jsonData.name || jsonData.ndc || jsonData.barcode || jsonData.medicineName || code;
      } catch (e) {
        // Not JSON, use as-is
      }

      // Try to search for the medicine using the backend API
      const response = await axios.get(`${backendUrl}/api/medicine/search`, {
        params: { query: searchTerm, limit: 5 }
      });

      if (response.data.medicines && response.data.medicines.length > 0) {
        // Found medicine(s) - use the first match
        const foundMedicine = response.data.medicines[0];
        setDetectedMedicine({
          _id: foundMedicine._id,
          name: foundMedicine.name,
          genericName: foundMedicine.genericName,
          code: searchTerm,
          manufacturer: foundMedicine.manufacturer || 'N/A',
          drugClass: foundMedicine.drugClass,
          strength: foundMedicine.strength
        });
        setScanStatus('found');
      } else {
        // No medicine found
        setDetectedMedicine({
          name: null,
          code: searchTerm,
          error: 'Medicine not found in database'
        });
        setScanStatus('notfound');
      }
    } catch (error) {
      console.error('Error fetching medicine by code:', error);
      setDetectedMedicine({
        name: null,
        code: code,
        error: 'Failed to search medicine. Please try again.'
      });
      setScanStatus('error');
    }
  };

  const stopCamera = () => {
    if (scannerIntervalRef.current) clearInterval(scannerIntervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleViewMedicine = () => {
    if (detectedMedicine && detectedMedicine._id) {
      navigate(`/medicines/${detectedMedicine._id}`);
      setIsQrModalOpen(false);
    } else if (detectedMedicine && detectedMedicine.name) {
      setSearchQuery(detectedMedicine.name);
      setIsQrModalOpen(false);
    }
  };

  const handleScanAgain = () => {
    setDetectedMedicine(null);
    setScanStatus('idle');
    activateCamera();
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-dark-bg dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-white font-outfit selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      <SEO
        title="Medicines | Prescripto"
        description="Search our premium medicine database."
        keywords="medicine, search, health"
        canonicalUrl="/medicines"
      />

      {/* Subtle Professional Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft Gradient Orbs - invisible in dark mode */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-50/20 dark:bg-indigo-900/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
        {/* Professional Header Section */}
        <div className="text-center mb-20 animate-header relative max-w-5xl mx-auto">

          {/* Enhanced 3D Status Badge */}
          {/* Enhanced 3D Status Badge */}
          <div className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full mb-8 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-[0_2px_8px_rgba(34,197,94,0.4)]"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/60 to-transparent rounded-full"></div>
            </div>
            <span className="relative text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">100+ Medicines Available</span>
          </div>

          {/* Main Heading with Enhanced Shadow */}
          {/* Main Heading with Enhanced Shadow */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-gray-900 dark:text-white leading-tight mb-6 drop-shadow-sm">
            Find your{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                medication
              </span>
              {/* Enhanced Highlighter Effect with Shadow */}
              <span className="absolute top-1/2 left-0 right-0 h-[60%] -translate-y-1/2 bg-yellow-200/40 dark:bg-yellow-500/20 -z-10 rounded-lg shadow-[0_4px_12px_rgba(250,204,21,0.2)]"></span>
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Access comprehensive clinical information, dosage guidelines, and safety warnings for informed healthcare decisions.
          </p>

          {/* Enhanced 3D Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative flex items-center justify-center w-7 h-7 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-full shadow-inner">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent rounded-full"></div>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">FDA Approved</span>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-full shadow-inner">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent rounded-full"></div>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Verified Information</span>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative flex items-center justify-center w-7 h-7 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 rounded-full shadow-inner">
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent rounded-full"></div>
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Instant Search</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="max-w-2xl mx-auto mb-16 animate-search relative z-20">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicines..."
              className="block w-full pl-12 pr-14 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm hover:shadow-md focus:shadow-xl focus:border-gray-300 dark:focus:border-gray-600 focus:ring-0 transition-all duration-300 text-lg"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                title="Scan QR"
              >
                <QrCode className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filter Tags */}
          <div className="mt-6 animate-filters">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center px-4 py-2 rounded-full text-sm transition-all duration-300 border ${isFilterOpen || selectedCategories.length > 0
                  ? 'bg-gray-900 dark:bg-primary text-white border-gray-900 dark:border-primary'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {selectedCategories.length > 0 && (
                  <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                    {selectedCategories.length}
                  </span>
                )}
              </button>

              {/* Quick Categories */}
              {!isFilterOpen && ['Antibiotics', 'Pain Relief', 'Vitamins'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-4 py-2 rounded-full text-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Expanded Filters */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFilterOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Categories</span>
                  <button onClick={() => setSelectedCategories([])} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Reset</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${selectedCategories.includes(category)
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-4xl mx-auto">
          <MedicineSearch
            medicines={medicines}
            loading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            bookmarkedMedicines={bookmarkedMedicines}
          />
        </div>
      </div>

      {/* QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700/50 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Scan Medicine QR Code</h3>
              <button onClick={() => setIsQrModalOpen(false)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-900 dark:bg-black rounded-2xl overflow-hidden aspect-square relative mb-6">
                {isCameraActive ? (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-2 border-white/20 m-8 rounded-xl pointer-events-none">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-scan" />
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-white text-sm bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                        Position QR code within frame
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Camera className="h-12 w-12 mb-3 opacity-50" />
                    <span className="text-sm">Camera inactive</span>
                  </div>
                )}
              </div>

              {scanStatus === 'idle' && !detectedMedicine && (
                <button
                  onClick={activateCamera}
                  className="w-full py-3.5 bg-gray-900 dark:bg-primary text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-primary/90 transition-all"
                >
                  Start Camera
                </button>
              )}

              {scanStatus === 'scanning' && isCameraActive && !detectedMedicine && (
                <button
                  onClick={stopCamera}
                  className="w-full py-3.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all"
                >
                  Stop Camera
                </button>
              )}

              {scanStatus === 'found' && detectedMedicine && detectedMedicine.name && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-green-800 dark:text-green-400 font-semibold">Medicine Found!</p>
                  </div>
                  <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{detectedMedicine.name}</p>
                    <p className="text-gray-600 dark:text-gray-400">{detectedMedicine.genericName}</p>
                    {detectedMedicine.strength && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Strength: {detectedMedicine.strength}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleViewMedicine}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                    >
                      View Details
                    </button>
                    <button
                      onClick={handleScanAgain}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      Scan Again
                    </button>
                  </div>
                </div>
              )}

              {(scanStatus === 'notfound' || scanStatus === 'error') && detectedMedicine && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <p className="text-red-800 dark:text-red-400 font-semibold">
                      {scanStatus === 'notfound' ? 'Medicine Not Found' : 'Error Occurred'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {detectedMedicine.error || 'The scanned code does not match any medicine in our database.'}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <p className="font-mono break-all">Scanned: {detectedMedicine.code}</p>
                  </div>
                  <button
                    onClick={handleScanAgain}
                    className="w-full py-2 bg-gray-900 dark:bg-primary text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-primary/90 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Medicines;