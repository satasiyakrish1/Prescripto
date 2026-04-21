import React, { useState, useRef, useEffect, useContext } from 'react';
import { X, Send, Bot, Loader2, Briefcase, Calculator, TrendingUp, RefreshCw, Zap, CircleDot } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const AIAssistantModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const { darkMode } = useTheme();
    const { backendUrl, currency } = useContext(AppContext);

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm your **Business AI Assistant**.\n\nI can help with:\n• ROI and growth calculations\n• Business strategy tips\n• Investment and revenue insights\n\nAsk your question to get started."
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [responseTime, setResponseTime] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const [aiAvailable, setAiAvailable] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Minimal local fallback for simple financial queries when AI is unavailable
    const localFallback = (text) => {
        const t = text.toLowerCase();
        // ROI: (gain - cost) / cost
        if (/roi|return on investment/.test(t)) {
            const nums = text.match(/[\d.,]+/g)?.map(n => Number(n.replace(/,/g, ''))) || [];
            if (nums.length >= 2) {
                const cost = Math.min(nums[0], nums[1]);
                const gain = Math.max(nums[0], nums[1]);
                const roi = ((gain - cost) / cost) * 100;
                return `Estimated ROI: ${roi.toFixed(2)}%\n• Cost: ${currency || '$'}${cost.toLocaleString()}\n• Return: ${currency || '$'}${gain.toLocaleString()}\n• Formula: (Return - Cost) / Cost × 100`;
            }
            return "To estimate ROI, provide cost and return amounts. Example: ROI for cost 50000 and return 65000.";
        }
        // Growth rate: ((new - old)/old)*100
        if (/growth|increase|change rate|cagr/.test(t)) {
            const nums = text.match(/[\d.,]+/g)?.map(n => Number(n.replace(/,/g, ''))) || [];
            if (nums.length >= 2) {
                const oldVal = nums[0];
                const newVal = nums[1];
                const growth = ((newVal - oldVal) / oldVal) * 100;
                return `Growth Rate: ${growth.toFixed(2)}%\n• From: ${currency || '$'}${oldVal.toLocaleString()}\n• To: ${currency || '$'}${newVal.toLocaleString()}\n• Formula: (New - Old) / Old × 100`;
            }
            return "To compute growth, provide two values (old and new). Example: growth from 120000 to 150000.";
        }
        return "AI service is unavailable right now. Try a focused question (e.g., ROI with numbers) or contact admin to enable Gemini.";
    };

    // Subtle AI availability check for indicator
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await axios.get(`${backendUrl}/api/ai/status`, { timeout: 5000 });
                setAiAvailable(Boolean(res.data?.aiAvailable));
            } catch {
                setAiAvailable(false);
            }
        };
        checkStatus();
    }, [backendUrl]);

    const handleSend = async (e, customPrompt = null) => {
        if (e) e.preventDefault();

        const promptToSend = customPrompt || input;
        if (!promptToSend.trim()) return;

        const userMessage = { role: 'user', content: promptToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);
        setResponseTime(null);

        const startTime = Date.now();

        try {
            const response = await axios.post(
                `${backendUrl}/api/ai/business-chat`,
                {
                    prompt: promptToSend,
                    currencySymbol: currency || '$'
                },
                {
                    timeout: 35000 // 35 second timeout
                }
            );

            const endTime = Date.now();
            const timeTaken = endTime - startTime;
            setResponseTime(timeTaken);

            if (response.data.success) {
                const aiMessage = {
                    role: 'assistant',
                    content: response.data.message,
                    cached: response.data.cached,
                    responseTime: response.data.responseTime
                };
                setMessages(prev => [...prev, aiMessage]);

                // Show cache indicator if response was cached
                if (response.data.cached) {
                    toast.success('⚡ Instant response from cache!', { autoClose: 2000 });
                }
            } else {
                throw new Error(response.data.message || "Failed to get response");
            }
        } catch (error) {
            console.error('AI Error:', error);

            let errorMessage = "I encountered an error processing your request.";

            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorMessage = "⏱️ The request took too long. Please try a simpler question or check your connection.";
            } else if (error.response?.status === 429) {
                errorMessage = "🚦 Too many requests. Please wait a moment before trying again.";
            } else if (error.response?.status === 503) {
                errorMessage = "🔧 AI service is currently unavailable. Please try again later.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (!navigator.onLine) {
                errorMessage = "📡 No internet connection. Please check your network.";
            }

            setError(errorMessage);
            // Provide a minimal local fallback so it's still usable
            const fallback = localFallback(promptToSend);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: fallback,
                    fallback: true
                }
            ]);

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestionText) => {
        setInput(suggestionText);
        inputRef.current?.focus();
    };

    const handleRetry = () => {
        if (messages.length >= 2) {
            const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
            if (lastUserMessage) {
                // Remove last error message
                setMessages(prev => prev.slice(0, -1));
                handleSend(null, lastUserMessage.content);
            }
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: "Chat cleared! How can I help you with your business analytics?"
            }
        ]);
        setError(null);
        setResponseTime(null);
    };

    const suggestions = [
        { icon: <TrendingUp size={12} />, text: "Monthly revenue growth from 120000 to 150000" },
        { icon: <Calculator size={12} />, text: "ROI for cost 50000 and return 65000" },
        { icon: <Briefcase size={12} />, text: "How to improve patient retention?" },
    ];

    // Format message content with markdown-like styling
    const formatMessage = (content) => {
        // Simple markdown-like formatting
        return content
            .split('\n')
            .map((line, i) => {
                // Bold text
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Bullet points
                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                    return `<li key=${i} class="ml-4">${line.substring(1)}</li>`;
                }
                return `<p key=${i} class="mb-2">${line}</p>`;
            })
            .join('');
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={`w-full max-w-2xl h-[560px] flex flex-col rounded-xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>

                {/* Header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 107 114"
                                className="h-4 w-4"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M17.1972 15.537L22.9296 -1.66022H32.8908L38.6232 15.537L55.8204 21.2694V31.2306L38.6232 36.963L32.8908 54.1602H22.9296L17.1972 36.963L0 31.2306V21.2694L17.1972 15.537ZM27.9102 16.6019L26.3283 21.3477L23.0079 24.6681L18.2622 26.25L23.0079 27.8319L26.3283 31.1523L27.9102 35.898L29.4921 31.1523L32.8125 27.8319L37.5582 26.25L32.8125 24.6681L29.4921 21.3477L27.9102 16.6019ZM86.1272 31.6972C83.7642 31.5041 80.7072 31.5 76.2101 31.5H69.9101V21H76.4269C80.653 21 84.1409 20.9999 86.9822 21.232C89.9332 21.4731 92.6459 21.9906 95.1939 23.2889C99.1453 25.3022 102.358 28.5148 104.371 32.4662C105.67 35.0142 106.187 37.7269 106.428 40.6779C106.66 43.5192 106.66 47.007 106.66 51.2331V69.5141C106.66 73.7401 106.66 77.2279 106.428 80.0692C106.187 83.0202 105.67 85.7329 104.371 88.2809C102.358 92.2323 99.1453 95.4449 95.1939 97.4582C92.6459 98.7565 89.9332 99.274 86.9822 99.5151C84.1409 99.7472 80.6531 99.7471 76.4271 99.7471H75.3251L63.3965 113.666L55.4237 113.666L43.4952 99.7471H42.3932C38.1671 99.7471 34.6793 99.7472 31.838 99.5151C28.887 99.274 26.1743 98.7565 23.6263 97.4582C19.6749 95.4449 16.4623 92.2323 14.449 88.2809C13.1507 85.7329 12.6332 83.0202 12.3921 80.0692C12.16 77.2279 12.16 73.74 12.1601 69.5139L12.1601 65.6236H22.6601V69.2971C22.6601 73.7941 22.6642 76.8512 22.8573 79.2141C23.0453 81.5158 23.3862 82.6929 23.8045 83.514C24.8112 85.4897 26.4175 87.096 28.3932 88.1026C29.2143 88.521 30.3914 88.8619 32.6931 89.0499C35.056 89.243 38.1131 89.2471 42.6101 89.2471H48.3251L59.4101 102.182L70.4952 89.2471H76.2101C80.7072 89.2471 83.7642 89.243 86.1272 89.0499C88.4288 88.8619 89.6059 88.521 90.427 88.1026C92.4027 87.096 94.009 85.4897 95.0157 83.514C95.434 82.6929 95.7749 81.5158 95.963 79.2141C96.156 76.8512 96.1601 73.7941 96.1601 69.2971V51.45C96.1601 46.953 96.156 43.8959 95.963 41.533C95.7749 39.2313 95.434 38.0542 95.0157 37.2331C94.009 35.2574 92.4027 33.6511 90.427 32.6445C89.6059 32.2261 88.4288 31.8852 86.1272 31.6972Z"
                                    fill="currentColor"
                                />
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M52.9824 56.5722L56.4218 46.2539H62.3985L65.838 56.5722L76.1563 60.0116V65.9883L65.838 69.4278L62.3985 79.7461H56.4218L52.9824 69.4278L42.6641 65.9883V60.0116L52.9824 56.5722Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Business AI Assistant
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Powered by Gemini 1.5 Flash
                                </p>
                                {responseTime && (
                                    <span className={`text-[11px] flex items-center gap-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                        <Zap size={10} />
                                        {responseTime}ms
                                    </span>
                                )}
                                {aiAvailable !== null && (
                                    <span className={`flex items-center gap-1 text-[11px] ${aiAvailable ? 'text-green-500' : 'text-amber-500'}`}>
                                        <CircleDot size={10} />
                                        {aiAvailable ? 'Online' : 'Offline'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearChat}
                            className={`p-2 rounded-lg transition-colors text-xs font-medium ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                            title="Clear chat"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant'
                                    ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white')
                                    : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                                }`}>
                                {msg.role === 'assistant' ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 107 114"
                                        className="h-4 w-4"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M17.1972 15.537L22.9296 -1.66022H32.8908L38.6232 15.537L55.8204 21.2694V31.2306L38.6232 36.963L32.8908 54.1602H22.9296L17.1972 36.963L0 31.2306V21.2694L17.1972 15.537ZM27.9102 16.6019L26.3283 21.3477L23.0079 24.6681L18.2622 26.25L23.0079 27.8319L26.3283 31.1523L27.9102 35.898L29.4921 31.1523L32.8125 27.8319L37.5582 26.25L32.8125 24.6681L29.4921 21.3477L27.9102 16.6019ZM86.1272 31.6972C83.7642 31.5041 80.7072 31.5 76.2101 31.5H69.9101V21H76.4269C80.653 21 84.1409 20.9999 86.9822 21.232C89.9332 21.4731 92.6459 21.9906 95.1939 23.2889C99.1453 25.3022 102.358 28.5148 104.371 32.4662C105.67 35.0142 106.187 37.7269 106.428 40.6779C106.66 43.5192 106.66 47.007 106.66 51.2331V69.5141C106.66 73.7401 106.66 77.2279 106.428 80.0692C106.187 83.0202 105.67 85.7329 104.371 88.2809C102.358 92.2323 99.1453 95.4449 95.1939 97.4582C92.6459 98.7565 89.9332 99.274 86.9822 99.5151C84.1409 99.7472 80.6531 99.7471 76.4271 99.7471H75.3251L63.3965 113.666L55.4237 113.666L43.4952 99.7471H42.3932C38.1671 99.7471 34.6793 99.7472 31.838 99.5151C28.887 99.274 26.1743 98.7565 23.6263 97.4582C19.6749 95.4449 16.4623 92.2323 14.449 88.2809C13.1507 85.7329 12.6332 83.0202 12.3921 80.0692C12.16 77.2279 12.16 73.74 12.1601 69.5139L12.1601 65.6236H22.6601V69.2971C22.6601 73.7941 22.6642 76.8512 22.8573 79.2141C23.0453 81.5158 23.3862 82.6929 23.8045 83.514C24.8112 85.4897 26.4175 87.096 28.3932 88.1026C29.2143 88.521 30.3914 88.8619 32.6931 89.0499C35.056 89.243 38.1131 89.2471 42.6101 89.2471H48.3251L59.4101 102.182L70.4952 89.2471H76.2101C80.7072 89.2471 83.7642 89.243 86.1272 89.0499C88.4288 88.8619 89.6059 88.521 90.427 88.1026C92.4027 87.096 94.009 85.4897 95.0157 83.514C95.434 82.6929 95.7749 81.5158 95.963 79.2141C96.156 76.8512 96.1601 73.7941 96.1601 69.2971V51.45C96.1601 46.953 96.156 43.8959 95.963 41.533C95.7749 39.2313 95.434 38.0542 95.0157 37.2331C94.009 35.2574 92.4027 33.6511 90.427 32.6445C89.6059 32.2261 88.4288 31.8852 86.1272 31.6972Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M52.9824 56.5722L56.4218 46.2539H62.3985L65.838 56.5722L76.1563 60.0116V65.9883L65.838 69.4278L62.3985 79.7461H56.4218L52.9824 69.4278L42.6641 65.9883V60.0116L52.9824 56.5722Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                ) : (
                                    <div className="text-[10px] font-bold">You</div>
                                )}
                            </div>
                            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-[13px] leading-relaxed ${msg.role === 'assistant'
                                    ? msg.isError
                                        ? (darkMode ? 'bg-red-900/20 text-red-300 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200')
                                        : (darkMode ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200')
                                    : 'bg-indigo-600 text-white'
                                }`}>
                                <div
                                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                    className="prose prose-sm max-w-none"
                                />
                                {(msg.cached || msg.fallback) && (
                                    <div className={`mt-2 pt-2 border-t text-[11px] flex items-center gap-2 ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                                        {msg.cached && (
                                            <span className="inline-flex items-center gap-1">
                                                <Zap size={10} />
                                                Cached
                                            </span>
                                        )}
                                        {msg.fallback && (
                                            <span className="inline-flex items-center gap-1">
                                                <CircleDot size={10} />
                                                Offline answer
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'}`}>
                                <Bot size={16} />
                            </div>
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                                <Loader2 size={16} className="animate-spin text-indigo-500" />
                                <span className={`text-[13px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Analyzing your question...
                                </span>
                            </div>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleRetry}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode
                                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                                    }`}
                            >
                                <RefreshCw size={16} />
                                Retry last question
                            </button>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={`p-4 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
                    {/* Suggestions */}
                    {messages.length <= 2 && !isLoading && (
                        <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar">
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSuggestionClick(suggestion.text)}
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border ${darkMode
                                            ? 'border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-indigo-400'
                                            : 'border-gray-200 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                                        }`}
                                >
                                    {suggestion.icon}
                                    {suggestion.text}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSend} className="relative flex items-end gap-2">
                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about investments, ROI, business strategy..."
                                maxLength={2000}
                                className={`w-full pl-3.5 pr-10 py-3 rounded-lg text-[13px] border outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${darkMode
                                        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                    }`}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={`absolute right-2 top-1.5 p-2 rounded-md transition-all ${input.trim() && !isLoading
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        : 'bg-gray-200/50 text-gray-400 cursor-not-allowed dark:bg-gray-700/50 dark:text-gray-600'
                                    }`}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </form>

                    <div className="flex items-center justify-between mt-3">
                        <p className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            AI can make mistakes. Verify important calculations.
                        </p>
                        <p className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            {input.length}/2000
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistantModal;
