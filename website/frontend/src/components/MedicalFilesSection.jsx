import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const MedicalFilesSection = () => {
    const { backendUrl, token } = useContext(AppContext);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareFileId, setShareFileId] = useState(null);
    const [doctorEmail, setDoctorEmail] = useState('');
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [viewerFile, setViewerFile] = useState(null);

    // AI Analysis State
    const [analysisPrompt, setAnalysisPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisFile, setAnalysisFile] = useState(null);

    // Fetch medical files
    const fetchMedicalFiles = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(backendUrl + '/api/medical-files/list', {
                headers: { token }
            });

            if (data.success) {
                setFiles(data.files);
            }
        } catch (error) {
            console.error('Error fetching medical files:', error);
            toast.error('Error loading files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchMedicalFiles();
        }
    }, [token]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) validateAndSetFile(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const validateAndSetFile = (file) => {
        if (file.type !== 'application/pdf') {
            toast.error('PDF files only');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Max 10MB');
            return;
        }
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);

            const { data } = await axios.post(
                backendUrl + '/api/medical-files/upload',
                formData,
                { headers: { token, 'Content-Type': 'multipart/form-data' } }
            );

            if (data.success) {
                toast.success('Uploaded successfully');
                setSelectedFile(null);
                document.getElementById('fileInput').value = '';
                fetchMedicalFiles();
            }
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (fileId) => {
        if (!window.confirm('Delete this file?')) return;

        try {
            const { data } = await axios.delete(
                backendUrl + `/api/medical-files/${fileId}`,
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Deleted');
                fetchMedicalFiles();
            }
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleShare = async () => {
        if (!doctorEmail) {
            toast.error('Enter email');
            return;
        }

        try {
            const { data } = await axios.post(
                backendUrl + `/api/medical-files/${shareFileId}/share`,
                { recipientEmail: doctorEmail },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Shared');
                setShowShareModal(false);
                setDoctorEmail('');
                setShareFileId(null);
            }
        } catch (error) {
            toast.error('Share failed');
        }
    };

    const handleAnalyze = async () => {
        if (!analysisFile) return;

        try {
            setIsAnalyzing(true);
            const { data } = await axios.post(
                backendUrl + `/api/medical-files/${analysisFile.id}/analyze`,
                { prompt: analysisPrompt },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Analysis generated');
                setSelectedAnalysis(data.analysis);
                // Update local state
                setFiles(prev => prev.map(f => f.id === analysisFile.id ? { ...f, aiAnalysis: data.analysis } : f));
                setAnalysisFile(prev => ({ ...prev, aiAnalysis: data.analysis }));
            }
        } catch (error) {
            console.error(error);
            toast.error('Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Minimalist Header */}
            <div className="border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Medical Files</h1>
                    <p className="text-sm text-gray-500 mt-2">Store and manage your medical documents</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Upload Area - Minimalist */}
                <div
                    className={`mb-12 border-2 border-dashed rounded-2xl transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="fileInput"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="p-12 text-center">
                        {selectedFile ? (
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-full">
                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                                    <span className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="px-8 py-3 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {uploading ? 'Uploading...' : 'Upload File'}
                                </button>
                            </div>
                        ) : (
                            <>
                                <svg className="w-10 h-10 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm text-gray-600 mb-2">Drop PDF files here or</p>
                                <label htmlFor="fileInput" className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                                    browse files
                                </label>
                                <p className="text-xs text-gray-400 mt-4">PDF • Max 10MB</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Files Grid - Clean & Minimal */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-20">
                        <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-400 text-sm">No files yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="group flex items-center justify-between px-6 py-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(file.uploadedAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setAnalysisFile(file);
                                            setSelectedAnalysis(file.aiAnalysis);
                                            setShowAnalysisModal(true);
                                        }}
                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                        title={file.aiAnalysis ? "View Analysis" : "Generate Analysis"}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setViewerFile(file)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="View"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <a
                                        href={file.downloadLink}
                                        download
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Download"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </a>
                                    <button
                                        onClick={() => {
                                            setShareFileId(file.id);
                                            setShowShareModal(true);
                                        }}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Share"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PDF Viewer Modal - Full Screen with PDF.js */}
            {viewerFile && (
                <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 bg-black bg-opacity-50 backdrop-blur-sm">
                        <p className="text-white font-medium">{viewerFile.name}</p>
                        <div className="flex items-center gap-2">
                            <a
                                href={viewerFile.viewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                                title="Open in new tab"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                            <a
                                href={viewerFile.downloadLink}
                                download
                                className="p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                                title="Download"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </a>
                            <button
                                onClick={() => setViewerFile(null)}
                                className="p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative bg-gray-100">
                        {/* Direct PDF rendering - works better with Appwrite */}
                        <iframe
                            src={viewerFile.viewLink}
                            className="w-full h-full border-0"
                            title="PDF Viewer"
                        />
                    </div>
                </div>
            )}

            {/* Share Modal - Minimalist */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h3 className="text-xl font-medium text-gray-900 mb-6">Share File</h3>
                        <input
                            type="email"
                            placeholder="doctor@example.com"
                            value={doctorEmail}
                            onChange={(e) => setDoctorEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors mb-6"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowShareModal(false);
                                    setDoctorEmail('');
                                    setShareFileId(null);
                                }}
                                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Analysis Modal - Clean */}
            {showAnalysisModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-medium text-gray-900">AI Analysis</h3>
                            <button
                                onClick={() => {
                                    setShowAnalysisModal(false);
                                    setSelectedAnalysis(null);
                                    setAnalysisFile(null);
                                    setAnalysisPrompt('');
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                            {selectedAnalysis ? selectedAnalysis : (
                                <div className="text-center py-10">
                                    <p className="text-gray-500 mb-4">No analysis available for this file.</p>
                                    <div className="space-y-4 max-w-lg mx-auto">
                                        <textarea
                                            placeholder="Optional: Add specific questions or context for the AI..."
                                            value={analysisPrompt}
                                            onChange={(e) => setAnalysisPrompt(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-sm h-24"
                                            disabled={isAnalyzing}
                                        />
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing}
                                            className="px-6 py-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                        >
                                            {isAnalyzing ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    Analyzing...
                                                </span>
                                            ) : 'Generate Analysis'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Regenerate Option if analysis exists (Optional) */}
                        {selectedAnalysis && (
                            <div className="mt-8 pt-6 border-t border-gray-100 text-right">
                                <button
                                    onClick={() => setSelectedAnalysis(null)} // Reset to show the generate form
                                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    Regenerate Analysis
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalFilesSection;
