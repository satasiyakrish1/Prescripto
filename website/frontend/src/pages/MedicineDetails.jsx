import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { gsap } from 'gsap';
import { AppContext } from '../context/AppContext';
import SEO from '../components/SEO';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Share2, Bookmark, Sparkles, AlertTriangle, Info, Pill,
  ChevronDown, Loader2, X, Clock, Shield, Thermometer, Users, Heart,
  Brain, Activity, Zap, CheckCircle, XCircle, AlertCircle, Copy,
  Printer, FileText
} from 'lucide-react';

const MedicineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backendUrl, token, userData } = useContext(AppContext);
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [aiBrief, setAiBrief] = useState(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [showAiBrief, setShowAiBrief] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    description: true, usage: false, sideEffects: false, warnings: false, interactions: false, clinical: false
  });
  const pageRef = useRef(null);

  useEffect(() => {
    const fetchMedicineDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/api/medicine/${id}`);
        setMedicine(response.data);
        setError(null);
        if (token && userData) checkIfBookmarked();
      } catch (err) {
        setError('Failed to fetch medicine details');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicineDetails();
  }, [id, backendUrl, token, userData]);

  const checkIfBookmarked = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/bookmarked-medicines`, { headers: { token } });
      if (data.success) setIsSaved(data.bookmarkedMedicines.includes(id));
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const handleBookmark = async () => {
    if (!token) {
      toast.error('Please login to bookmark');
      navigate('/login');
      return;
    }
    setIsBookmarking(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/bookmark-medicine`, { medicineId: id }, { headers: { token } });
      if (data.success) {
        setIsSaved(data.isBookmarked);
        toast.success(data.message);
      }
    } catch (error) {
      toast.error('Failed to bookmark');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: medicine.name, text: `${medicine.name} - ${medicine.genericName}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link copied!');
        } catch { toast.error('Failed to share'); }
      }
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog...');
  };

  const copyAllData = async () => {
    try {
      let allData = `${medicine.name}\n`;
      allData += `Generic Name: ${medicine.genericName}\n`;
      allData += `Drug Class: ${medicine.drugClass}\n\n`;

      if (medicine.description && medicine.description !== 'N/A') {
        allData += `DESCRIPTION:\n${medicine.description}\n\n`;
      }
      if (medicine.indications && medicine.indications !== 'N/A') {
        allData += `USES & INDICATIONS:\n${medicine.indications}\n\n`;
      }
      if (medicine.sideEffects && medicine.sideEffects.length > 0) {
        allData += `SIDE EFFECTS:\n${medicine.sideEffects.join('\n')}\n\n`;
      }
      if (medicine.warnings && medicine.warnings.length > 0) {
        allData += `WARNINGS:\n${medicine.warnings.join('\n')}\n\n`;
      }
      if (medicine.interactions && medicine.interactions.length > 0) {
        allData += `DRUG INTERACTIONS:\n${medicine.interactions.join('\n')}\n\n`;
      }
      if (medicine.clinicalPharmacology && medicine.clinicalPharmacology !== 'N/A') {
        allData += `CLINICAL PHARMACOLOGY:\n${medicine.clinicalPharmacology}\n\n`;
      }

      await navigator.clipboard.writeText(allData);
      toast.success('All medicine data copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy data');
    }
  };

  const copySectionData = async (title, content) => {
    try {
      let textToCopy = `${title.toUpperCase()}\n\n`;

      if (Array.isArray(content)) {
        textToCopy += content.join('\n');
      } else {
        textToCopy += content;
      }

      await navigator.clipboard.writeText(textToCopy);
      toast.success(`${title} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const generateAIBrief = async () => {
    if (aiBrief) {
      setShowAiBrief(!showAiBrief);
      return;
    }
    setIsGeneratingBrief(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/medicine/generate-brief`, {
        medicineName: medicine.name, genericName: medicine.genericName, drugClass: medicine.drugClass,
        indications: medicine.indications, description: medicine.description, dosageForm: medicine.dosageForm,
        strength: medicine.strength, composition: medicine.composition, usage: medicine.usage,
        contraindications: medicine.contraindications, sideEffects: medicine.sideEffects,
        warnings: medicine.warnings, precautions: medicine.precautions, interactions: medicine.interactions,
        storage: medicine.storage, pregnancy: medicine.pregnancy, clinicalPharmacology: medicine.clinicalPharmacology
      });
      if (data.success) {
        setAiBrief(data);
        setShowAiBrief(true);
        toast.success(data.isAIGenerated === false ? 'Summary generated' : 'AI brief generated!');
      }
    } catch (error) {
      if (error.response?.data?.brief) {
        setAiBrief(error.response.data);
        setShowAiBrief(true);
        toast.info('Summary generated');
      } else {
        toast.error('Failed to generate');
      }
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatDescription = (text) => {
    if (!text) return '';
    // Add proper spacing between sentences and format section headers
    return text
      .replace(/(\d+\.\d+)\s+([A-Z][a-z\s]+)/g, '\n\n**$1 $2**\n\n') // Format numbered sections like "8.1 Pregnancy"
      .replace(/\. ([A-Z])/g, '.\n\n$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const formatted = formatDescription(text);
    const parts = formatted.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // This is a header
        return (
          <div key={index} className="mt-4 mb-2 first:mt-0">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              {part.replace(/\*\*/g, '')}
            </h4>
          </div>
        );
      } else if (part.trim()) {
        return (
          <p key={index} className="text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
            {part}
          </p>
        );
      }
      return null;
    });
  };

  const formatAIBrief = (text) => {
    if (!text) return '';
    let formatted = text
      .replace(/## (.*?)$/gm, '<h3 class="ai-section-title">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="ai-strong">$1</strong>')
      .replace(/^- (.*?)$/gm, '<li class="ai-li">$1</li>')
      .replace(/^• (.*?)$/gm, '<li class="ai-li">$1</li>')
      .replace(/(<li.*?<\/li>\n?)+/g, '<ul class="ai-ul">$&</ul>')
      .replace(/\n\n/g, '</p><p class="ai-p">')
      .replace(/([\u{1F300}-\u{1F9FF}])/gu, '<span class="mr-2">$1</span>');
    return `<p class="ai-p">${formatted}</p>`;
  };

  useEffect(() => {
    if (!loading && medicine && pageRef.current) {
      gsap.fromTo(pageRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
    }
  }, [loading, medicine]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading medicine details...</p>
        </div>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Medicine Not Found</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">The medicine you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-primary-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" ref={pageRef}>
      <SEO title={`${medicine.name} - Medicine Details`} description={`Information about ${medicine.name}`}
        keywords={`${medicine.name}, ${medicine.genericName}`} canonicalUrl={`/medicines/${id}`} />

      {/* Minimalistic Top Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Minimalistic Copy All Button */}
            <button onClick={copyAllData}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all text-sm font-medium"
              title="Copy all medicine information">
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy All</span>
            </button>

            {/* Minimalistic Print Button */}
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all text-sm font-medium"
              title="Print medicine details">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            {/* Bookmark Button */}
            <button onClick={handleBookmark} disabled={isBookmarking}
              className={`p-2 rounded-lg transition-all ${isSaved
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                } ${isBookmarking ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isSaved ? 'Remove bookmark' : 'Bookmark medicine'}>
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* Share Button */}
            <button onClick={handleShare}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-all"
              title="Share medicine">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Responsive Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {medicine.drugClass && medicine.drugClass !== 'N/A' && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-300 text-xs sm:text-sm font-medium rounded-full">
                    {medicine.drugClass}
                  </span>
                )}
                {medicine.dosageForm && medicine.dosageForm !== 'N/A' && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium rounded-full">
                    {medicine.dosageForm}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2 break-words">
                {medicine.name}
              </h1>
              {medicine.genericName && medicine.genericName !== 'N/A' && (
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 break-words">{medicine.genericName}</p>
              )}
            </div>
            <div className="hidden sm:block flex-shrink-0">
              <Pill className="w-12 h-12 lg:w-16 lg:h-16 text-blue-200" strokeWidth={1.5} />
            </div>
          </div>

          {/* Responsive Quick Info Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700">
            {medicine.strength && medicine.strength !== 'N/A' && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-primary-200/50 dark:border-primary-700/30">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-primary-700 dark:text-primary-300">Strength</p>
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate" title={medicine.strength}>
                  {medicine.strength}
                </p>
              </div>
            )}
            {medicine.composition && medicine.composition !== 'N/A' && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-purple-200/50 dark:border-purple-700/30">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Composition</p>
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate" title={medicine.composition}>
                  {medicine.composition}
                </p>
              </div>
            )}
            {medicine.storage && medicine.storage !== 'N/A' && (
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-green-200/50 dark:border-green-700/30">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Thermometer className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">Storage</p>
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate" title={medicine.storage}>
                  {medicine.storage}
                </p>
              </div>
            )}
            {medicine.pregnancy && medicine.pregnancy !== 'N/A' && (
              <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-pink-200/50 dark:border-pink-700/30">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-pink-700 dark:text-pink-300">Pregnancy</p>
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate" title={medicine.pregnancy}>
                  {medicine.pregnancy}
                </p>
              </div>
            )}
          </div>

          {/* Minimalistic AI Button with Gemini Logo */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700">
            <button onClick={generateAIBrief} disabled={isGeneratingBrief}
              className="group w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md">
              {isGeneratingBrief ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generating...</span>
                </>
              ) : (
                <>
                  {/* Official Gemini Logo */}
                  <img
                    src="https://static.vecteezy.com/system/resources/previews/055/687/065/non_2x/gemini-google-icon-symbol-logo-free-png.png"
                    alt="Google Gemini"
                    className="w-5 h-5 flex-shrink-0 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {aiBrief ? (showAiBrief ? 'Hide Guide' : 'Show Guide') : ' Get AI Guide'}
                  </span>
                  {!aiBrief && (
                    <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 ml-1">• Powered by Gemini</span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Responsive Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Drug Class</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate" title={medicine.drugClass}>
                  {medicine.drugClass !== 'N/A' ? medicine.drugClass : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Form</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate" title={medicine.dosageForm}>
                  {medicine.dosageForm !== 'N/A' ? medicine.dosageForm : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">Available</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Info</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">FDA Approved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive AI Brief Display */}
        {showAiBrief && aiBrief && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-200 dark:border-blue-700/40 relative shadow-lg">
            <button onClick={() => setShowAiBrief(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-lg transition-all shadow-sm">
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6 pr-8">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-primary to-indigo-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {aiBrief.isAIGenerated === false ? 'Medical Summary' : 'AI Medical Guide'}
                  </h3>
                  {aiBrief.isAIGenerated && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      AI
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {aiBrief.isAIGenerated === false
                    ? 'Comprehensive information from medical database'
                    : 'Powered by Google Gemini AI'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/80 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm max-h-[60vh] sm:max-h-[70vh] overflow-y-auto border border-white/50 dark:border-gray-700/50">
              <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
                <div className="ai-brief-content leading-relaxed space-y-3 sm:space-y-4"
                  dangerouslySetInnerHTML={{ __html: formatAIBrief(aiBrief.brief || aiBrief) }}
                />
              </div>
            </div>

            {aiBrief.isAIGenerated && (
              <div className="mt-3 sm:mt-4 flex items-start gap-2 p-2.5 sm:p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  AI-generated guide for informational purposes. Always consult your healthcare provider.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Collapsible Sections */}
        <div className="space-y-3 sm:space-y-4">
          {medicine.description && medicine.description !== 'N/A' && (
            <CollapsibleSection
              title="Description"
              icon={Info}
              isExpanded={expandedSections.description}
              onToggle={() => toggleSection('description')}
              onCopy={copySectionData}
              copyContent={medicine.description}>
              <div className="prose prose-base sm:prose-lg max-w-none dark:prose-invert">
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg p-5 sm:p-6 border border-blue-100 dark:border-blue-800/30">
                  <div className="space-y-3">
                    {renderFormattedText(medicine.description)}
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {medicine.indications && medicine.indications !== 'N/A' && (
            <CollapsibleSection
              title="Uses & Indications"
              icon={Pill}
              isExpanded={expandedSections.usage}
              onToggle={() => toggleSection('usage')}
              onCopy={copySectionData}
              copyContent={medicine.indications}>
              <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg p-5 sm:p-6 border border-green-100 dark:border-green-800/30">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-300 mb-1">Primary Uses</h4>
                    <p className="text-sm text-green-700 dark:text-green-400">This medication is prescribed for:</p>
                  </div>
                </div>
                <div className="pl-0 sm:pl-11 space-y-3">
                  {renderFormattedText(medicine.indications)}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {medicine.sideEffects && medicine.sideEffects.length > 0 && (
            <CollapsibleSection
              title="Side Effects"
              icon={AlertTriangle}
              isExpanded={expandedSections.sideEffects}
              onToggle={() => toggleSection('sideEffects')}
              variant="warning"
              onCopy={copySectionData}
              copyContent={medicine.sideEffects}>
              <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-lg p-5 sm:p-6 border border-orange-100 dark:border-orange-800/30">
                <p className="text-sm sm:text-base text-orange-800 dark:text-orange-300 mb-5 flex items-start gap-2">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Not everyone experiences these side effects. Contact your doctor if any become severe.</span>
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {medicine.sideEffects.map((effect, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg p-4 text-base sm:text-lg text-gray-700 dark:text-gray-300 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                      <span>{effect}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {medicine.warnings && medicine.warnings.length > 0 && (
            <CollapsibleSection
              title="Warnings & Precautions"
              icon={AlertTriangle}
              isExpanded={expandedSections.warnings}
              onToggle={() => toggleSection('warnings')}
              variant="danger"
              onCopy={copySectionData}
              copyContent={medicine.warnings}>
              <div className="bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-red-900/10 dark:to-rose-900/10 rounded-lg p-5 sm:p-6 border border-red-200 dark:border-red-800/30">
                <div className="flex items-start gap-3 mb-5 pb-5 border-b border-red-200 dark:border-red-800/40">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-red-900 dark:text-red-300 mb-1">Important Safety Information</h4>
                    <p className="text-sm text-red-700 dark:text-red-400">Read these warnings carefully before taking this medication</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {medicine.warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg p-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 shadow-sm">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm font-bold text-red-600 dark:text-red-400">
                        {i + 1}
                      </span>
                      <span className="flex-1">{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleSection>
          )}

          {medicine.interactions && medicine.interactions.length > 0 && (
            <CollapsibleSection
              title="Drug Interactions"
              icon={Activity}
              isExpanded={expandedSections.interactions}
              onToggle={() => toggleSection('interactions')}
              onCopy={copySectionData}
              copyContent={medicine.interactions}>
              <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-lg p-5 sm:p-6 border border-purple-100 dark:border-purple-800/30">
                <p className="text-sm sm:text-base text-purple-800 dark:text-purple-300 mb-5 flex items-start gap-2">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>This medication may interact with other drugs. Always inform your doctor about all medications you're taking.</span>
                </p>
                <div className="space-y-3">
                  {medicine.interactions.map((interaction, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg p-4 text-base sm:text-lg text-gray-700 dark:text-gray-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors shadow-sm">
                      <Activity className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>{interaction}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {medicine.clinicalPharmacology && medicine.clinicalPharmacology !== 'N/A' && (
            <CollapsibleSection
              title="Clinical Pharmacology"
              icon={Brain}
              isExpanded={expandedSections.clinical}
              onToggle={() => toggleSection('clinical')}
              onCopy={copySectionData}
              copyContent={medicine.clinicalPharmacology}>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/60 dark:to-slate-800/40 rounded-lg p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0">
                    <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">How This Medicine Works</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Scientific explanation of the mechanism of action</p>
                  </div>
                </div>
                <div className="pl-0 sm:pl-11 space-y-3">
                  {renderFormattedText(medicine.clinicalPharmacology)}
                </div>
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* Responsive Tips Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 my-6 sm:my-8 border border-indigo-200 dark:border-indigo-700/30">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Quick Tips</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
            <TipCard icon={CheckCircle} color="green" title="Take as Prescribed"
              description="Follow your doctor's instructions exactly" />
            <TipCard icon={Clock} color="blue" title="Consistent Timing"
              description="Take at the same time each day" />
            <TipCard icon={AlertCircle} color="orange" title="Report Side Effects"
              description="Contact your doctor if unusual symptoms occur" />
            <TipCard icon={XCircle} color="red" title="Don't Share"
              description="This medicine is prescribed specifically for you" />
          </div>
        </div>

        {/* Responsive Disclaimer */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-2 border-primary-200 dark:border-primary-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex-shrink-0">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 text-base sm:text-lg">Medical Disclaimer</h4>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <p className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
                  <span>This information is for <strong>educational purposes only</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
                  <span>Always <strong>consult your healthcare provider</strong> before taking any medication.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
                  <span>In emergencies, <strong>seek immediate medical attention</strong>.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TipCard = ({ icon: Icon, color, title, description }) => {
  const colors = {
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400'
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors[color]} flex-shrink-0 mt-0.5`} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm mb-0.5 sm:mb-1">{title}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
};

const CollapsibleSection = ({ title, icon: Icon, children, isExpanded, onToggle, variant = 'default', onCopy, copyContent }) => {
  const variants = {
    default: { bg: 'bg-white dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', hover: 'hover:bg-gray-50 dark:hover:bg-gray-700', iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    warning: { bg: 'bg-orange-50/50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800', hover: 'hover:bg-orange-100/50 dark:hover:bg-orange-900/20', iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
    danger: { bg: 'bg-red-50/50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800', hover: 'hover:bg-red-100/50 dark:hover:bg-red-900/20', iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' }
  };
  const style = variants[variant];

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (onCopy && copyContent) {
      await onCopy(title, copyContent);
    }
  };

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden shadow-sm hover:shadow-md transition-all`} >
      <div className="flex items-center">
        <button onClick={onToggle}
          className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between ${style.hover} transition-colors`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className={`p-1.5 sm:p-2 ${style.iconBg} rounded-lg flex-shrink-0`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${style.iconColor}`} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-left text-sm sm:text-base truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {isExpanded && (
              <span className="text-xs text-gray-500 hidden sm:block">Collapse</span>
            )}
            <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {onCopy && copyContent && (
          <button
            onClick={handleCopy}
            className="px-3 sm:px-4 py-3 sm:py-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-700"
            title={`Copy ${title}`}>
            <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>
      {
        isExpanded && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {children}
          </div>
        )
      }
    </div >
  );
};

export default MedicineDetails;
