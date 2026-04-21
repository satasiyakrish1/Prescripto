import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

let genAI;
let apiKeySource = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tryLoadEnvFallbacks = () => {
    // If ENV_FILE_LOADED already set by envLoader, try it first
    const hinted = process.env.ENV_FILE_LOADED;
    const candidates = [
        hinted,
        path.join(__dirname, '../.env.local'),
        path.join(__dirname, '../local.env'),
        path.join(__dirname, '../.env.development'),
        path.join(__dirname, '../.env.producation'),
        path.join(__dirname, '../.env.production'),
        path.join(__dirname, '../.env'),
        path.join(__dirname, '../../.env')
    ].filter(Boolean);

    for (const p of candidates) {
        try {
            dotenv.config({ path: p });
            if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
                console.log(`🔁 Fallback loaded environment from: ${p}`);
                return true;
            }
        } catch {
            // ignore and continue
        }
    }
    return false;
};

const initGenAI = () => {
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        const googleAIKey = process.env.GOOGLE_AI_API_KEY;
        const apiKey = geminiKey || googleAIKey;
        if (!apiKey) {
            console.error('❌ CRITICAL: No Gemini API key found on first attempt.');
            // Try loading env fallbacks once
            const loaded = tryLoadEnvFallbacks();
            if (!loaded) {
                return false;
            }
            // Re-read after fallback load
            const k2 = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
            if (!k2) {
                return false;
            }
            genAI = new GoogleGenerativeAI(k2);
            apiKeySource = process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'GOOGLE_AI_API_KEY';
            console.log(`✅ Gemini AI initialized after fallback using ${apiKeySource}`);
            console.log(`   API Key: ${k2.substring(0, 10)}...${k2.substring(k2.length - 4)}`);
            return true;
        }
        genAI = new GoogleGenerativeAI(apiKey);
        apiKeySource = geminiKey ? 'GEMINI_API_KEY' : 'GOOGLE_AI_API_KEY';
        console.log(`✅ Gemini AI initialized successfully using ${apiKeySource}`);
        console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error.message);
        return false;
    }
};

initGenAI();

// In-memory cache for responses (optional - helps with repeated questions)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Rate limiting per IP (simple in-memory implementation)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

// Helper function to check rate limit
const checkRateLimit = (ip) => {
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
    return true;
};

// Helper function to clean cache
const cleanCache = () => {
    if (responseCache.size > MAX_CACHE_SIZE) {
        const firstKey = responseCache.keys().next().value;
        responseCache.delete(firstKey);
    }
};

// Helper function to generate cache key
const getCacheKey = (prompt, currencySymbol) => {
    return `${prompt.toLowerCase().trim()}_${currencySymbol}`;
};

/**
 * Business Chat AI Controller
 * Handles business and financial queries with Gemini AI
 */
const businessChat = async (req, res) => {
    const startTime = Date.now();

    try {
        if (!genAI) {
            const reinit = initGenAI();
            if (!reinit) {
            console.error('⚠️  AI request blocked - No API key configured');
            return res.status(503).json({
                success: false,
                message: "AI service is currently unavailable. The Gemini API key is not configured. Please contact your administrator.",
                hint: "Administrator: Set GEMINI_API_KEY in your .env file. Get it from https://makersuite.google.com/app/apikey"
            });
            }
        }

        const { prompt, currencySymbol } = req.body;
        const userIP = req.ip || req.connection.remoteAddress || 'unknown';

        // Validate input
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Valid prompt is required"
            });
        }

        // Trim and validate prompt length
        const trimmedPrompt = prompt.trim();
        if (trimmedPrompt.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Prompt cannot be empty"
            });
        }

        if (trimmedPrompt.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Prompt is too long. Please keep it under 2000 characters."
            });
        }

        // Check rate limit
        if (!checkRateLimit(userIP)) {
            return res.status(429).json({
                success: false,
                message: "Too many requests. Please wait a moment before trying again."
            });
        }

        // Check cache
        const cacheKey = getCacheKey(trimmedPrompt, currencySymbol || '$');
        const cachedResponse = responseCache.get(cacheKey);

        if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
            console.log(`✅ Cache hit for prompt: "${trimmedPrompt.substring(0, 50)}..."`);
            return res.json({
                success: true,
                message: cachedResponse.text,
                cached: true,
                responseTime: Date.now() - startTime
            });
        }

        // Get the model with optimized settings
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });

        // Enhanced system instruction
        const systemInstruction = `You are a specialized Business & Financial AI Assistant for Prescripto, a medical practice management system.

YOUR CORE EXPERTISE:
- Financial calculations (ROI, profit margins, revenue growth, break-even analysis)
- Business strategy and planning for medical practices
- Investment analysis and recommendations
- Mathematical and statistical problems
- Medical business analytics and trends
- Cost optimization and budgeting
- Revenue cycle management
- Practice growth strategies

STRICT GUIDELINES:
1. ONLY answer questions related to:
   ✓ Business, finance, economics, and mathematics
   ✓ Medical practice management and operations
   ✓ Healthcare business analytics
   ✓ The Prescripto system features and usage
   
2. REFUSE politely for off-topic questions:
   ✗ Medical diagnoses or treatment advice
   ✗ Personal health questions
   ✗ General knowledge unrelated to business/finance
   ✗ Programming or technical support (unless Prescripto-related)
   
   Example refusal: "I apologize, but I specialize in business and financial analytics for medical practices. I cannot assist with [topic]. Please consult appropriate resources for that information."

3. Use currency symbol: ${currencySymbol || '$'}

4. Keep responses:
   - Professional and concise (under 500 words)
   - Actionable with specific examples when possible
   - Formatted clearly with bullet points or numbered lists
   - Include calculations with step-by-step explanations

5. For calculations:
   - Show your work clearly
   - Provide formulas used
   - Round to 2 decimal places for currency

6. Always maintain a helpful, professional tone suitable for healthcare administrators and doctors.`;

        const fullPrompt = `${systemInstruction}\n\n**User Query:** ${trimmedPrompt}\n\n**Your Response:**`;

        console.log(`🤖 Processing AI request from ${userIP}: "${trimmedPrompt.substring(0, 50)}..."`);

        // Generate content with timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
        );

        const generatePromise = model.generateContent(fullPrompt);

        const result = await Promise.race([generatePromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();

        // Validate response
        if (!text || text.trim().length === 0) {
            throw new Error('Empty response from AI');
        }

        // Cache the response
        cleanCache();
        responseCache.set(cacheKey, {
            text: text,
            timestamp: Date.now()
        });

        const responseTime = Date.now() - startTime;
        console.log(`✅ AI response generated in ${responseTime}ms`);

        res.json({
            success: true,
            message: text,
            cached: false,
            responseTime: responseTime
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error("❌ AI Error:", error.message);

        // Handle specific error types
        let errorMessage = "I apologize, but I encountered an error processing your request.";
        let statusCode = 500;

        if (error.message.includes('timeout')) {
            errorMessage = "The request took too long to process. Please try a simpler question or try again later.";
            statusCode = 504;
        } else if (error.message.includes('API key')) {
            errorMessage = "AI service configuration error. Please contact support.";
            statusCode = 503;
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
            errorMessage = "AI service is temporarily at capacity. Please try again in a few moments.";
            statusCode = 429;
        } else if (error.message.includes('safety') || error.message.includes('blocked')) {
            errorMessage = "Your request was blocked due to content policy. Please rephrase your question.";
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            responseTime: responseTime
        });
    }
};

/**
 * Clear AI cache (admin only)
 */
const clearCache = async (req, res) => {
    try {
        const cacheSize = responseCache.size;
        responseCache.clear();
        rateLimitMap.clear();

        res.json({
            success: true,
            message: `Cache cleared successfully. Removed ${cacheSize} cached responses.`
        });
    } catch (error) {
        console.error("Error clearing cache:", error);
        res.status(500).json({
            success: false,
            message: "Failed to clear cache"
        });
    }
};

/**
 * Get AI service status
 */
const getStatus = async (req, res) => {
    try {
        const status = {
            success: true,
            aiAvailable: !!genAI,
            keySource: apiKeySource,
            envFile: process.env.ENV_FILE_LOADED || null,
            cacheSize: responseCache.size,
            maxCacheSize: MAX_CACHE_SIZE,
            rateLimitWindow: `${RATE_LIMIT_WINDOW / 1000}s`,
            maxRequestsPerWindow: MAX_REQUESTS_PER_WINDOW,
            model: "gemini-1.5-flash",
            uptime: process.uptime()
        };

        res.json(status);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get status"
        });
    }
};

export { businessChat, clearCache, getStatus };
