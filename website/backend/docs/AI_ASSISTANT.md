# Business AI Assistant - Technical Documentation

## Overview
The Business AI Assistant is a specialized AI-powered chatbot integrated into the Prescripto admin panel. It uses Google's Gemini 1.5 Flash model to provide intelligent responses to business, financial, and analytics questions.

## Features

### ✅ Core Capabilities
- **Financial Calculations**: ROI, profit margins, revenue growth, break-even analysis
- **Business Strategy**: Practice management, growth strategies, optimization
- **Investment Analysis**: Equipment purchases, expansion planning
- **Mathematical Operations**: Complex calculations with step-by-step explanations
- **Medical Business Analytics**: Healthcare-specific business insights

### ✅ Performance Optimizations
1. **Response Caching**
   - 5-minute TTL (Time To Live)
   - Up to 100 cached responses
   - Instant responses for repeated questions
   - Automatic cache cleanup

2. **Rate Limiting**
   - 20 requests per minute per IP
   - Prevents API abuse
   - Protects against excessive usage

3. **Timeout Protection**
   - 30-second backend timeout
   - 35-second frontend timeout
   - Graceful error handling

4. **Error Recovery**
   - Automatic retry functionality
   - Detailed error messages
   - Offline detection

### ✅ User Experience
- **Real-time Response Time Display**: Shows how fast responses are generated
- **Cache Indicators**: Notifies when responses come from cache
- **Character Counter**: Shows remaining characters (2000 max)
- **Markdown Formatting**: Bold text, bullet points, structured responses
- **Quick Suggestions**: Pre-defined prompts for common questions
- **Clear Chat**: Reset conversation anytime
- **Auto-scroll**: Automatically scrolls to latest message

## Architecture

### Backend (`aiController.js`)
```
┌─────────────────────────────────────┐
│   Client Request                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Rate Limit Check                  │
│   (20 req/min per IP)               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Input Validation                  │
│   - Length check (max 2000 chars)  │
│   - Type validation                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Cache Check                       │
│   (5-minute TTL)                    │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
     Cache         Cache
     Hit           Miss
        │             │
        │             ▼
        │   ┌─────────────────────┐
        │   │  Gemini AI API      │
        │   │  (gemini-1.5-flash) │
        │   └─────────┬───────────┘
        │             │
        │             ▼
        │   ┌─────────────────────┐
        │   │  Cache Response     │
        │   └─────────┬───────────┘
        │             │
        └─────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │  Return Response        │
        │  + Metadata             │
        └─────────────────────────┘
```

### Frontend (`AIAssistantModal.jsx`)
```
┌─────────────────────────────────────┐
│   User Input                        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Validation                        │
│   - Empty check                     │
│   - Length check                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Add to Messages                   │
│   Show Loading State                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   API Call to Backend               │
│   (with 35s timeout)                │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    Success        Error
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────┐
│ Show Response│  │ Show Error   │
│ + Metadata   │  │ + Retry Btn  │
└──────────────┘  └──────────────┘
```

## API Endpoints

### 1. POST `/api/ai/business-chat`
Main chat endpoint for AI interactions.

**Request:**
```json
{
  "prompt": "Calculate ROI for $50,000 equipment over 5 years",
  "currencySymbol": "$"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "AI response text...",
  "cached": false,
  "responseTime": 1234
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error description",
  "responseTime": 567
}
```

### 2. GET `/api/ai/status`
Check AI service health and statistics.

**Response:**
```json
{
  "success": true,
  "aiAvailable": true,
  "cacheSize": 45,
  "maxCacheSize": 100,
  "rateLimitWindow": "60s",
  "maxRequestsPerWindow": 20,
  "model": "gemini-1.5-flash",
  "uptime": 123456
}
```

### 3. POST `/api/ai/clear-cache` (Admin Only)
Clear AI response cache and rate limits.

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully. Removed 45 cached responses."
}
```

## Configuration

### Environment Variables
Add to `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Get Gemini API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy and add to `.env` file

## Error Handling

### Error Types and Messages

| Error Type | Status Code | User Message |
|------------|-------------|--------------|
| Timeout | 504 | "Request took too long. Try a simpler question." |
| Rate Limit | 429 | "Too many requests. Please wait a moment." |
| API Key Error | 503 | "AI service configuration error. Contact support." |
| Quota Exceeded | 429 | "AI service at capacity. Try again later." |
| Content Blocked | 400 | "Request blocked. Please rephrase your question." |
| Network Error | 500 | "No internet connection. Check your network." |
| Empty Response | 500 | "Empty response from AI." |

## Performance Metrics

### Expected Response Times
- **Cached Response**: < 50ms
- **New Query (Simple)**: 1-3 seconds
- **New Query (Complex)**: 3-8 seconds
- **Maximum Timeout**: 30 seconds

### Cache Efficiency
- **Hit Rate**: ~40-60% for typical usage
- **Memory Usage**: ~1-5MB for 100 cached responses
- **TTL**: 5 minutes

## Best Practices

### For Users
1. **Be Specific**: "Calculate ROI for $50k equipment" vs "ROI calculation"
2. **Use Context**: Mention currency, timeframes, specific numbers
3. **One Question at a Time**: Better accuracy with focused questions
4. **Verify Results**: Always double-check important calculations

### For Developers
1. **Monitor Logs**: Check console for AI errors and performance
2. **Clear Cache**: Use admin endpoint when testing new prompts
3. **Rate Limits**: Adjust based on usage patterns
4. **Error Handling**: Always provide user-friendly error messages

## Troubleshooting

### Common Issues

#### 1. "AI service is currently unavailable"
**Cause**: Missing or invalid GEMINI_API_KEY
**Solution**: 
- Check `.env` file has valid API key
- Restart backend server
- Verify API key at Google AI Studio

#### 2. "Too many requests"
**Cause**: Rate limit exceeded
**Solution**:
- Wait 1 minute
- Clear cache (admin)
- Increase rate limit in `aiController.js`

#### 3. Slow Responses
**Cause**: Complex queries or API latency
**Solution**:
- Simplify questions
- Check internet connection
- Verify Gemini API status

#### 4. Empty or Incorrect Responses
**Cause**: Poor prompt or API issue
**Solution**:
- Rephrase question
- Be more specific
- Check if question is business-related

## Monitoring

### Logs to Watch
```javascript
// Success
✅ Gemini AI initialized successfully
✅ Cache hit for prompt: "..."
✅ AI response generated in 1234ms

// Errors
❌ Failed to initialize Gemini AI
❌ AI Error: timeout
⚠️  GEMINI_API_KEY is not set
```

### Health Check
```bash
# Check AI status
curl http://localhost:4000/api/ai/status

# Expected response
{
  "success": true,
  "aiAvailable": true,
  "cacheSize": 45,
  ...
}
```

## Future Enhancements

### Planned Features
- [ ] Conversation history persistence
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Export chat as PDF
- [ ] Custom AI training on practice data
- [ ] Integration with dashboard analytics
- [ ] Scheduled reports generation
- [ ] Collaborative chat sessions

### Performance Improvements
- [ ] Redis cache for distributed systems
- [ ] WebSocket for real-time streaming
- [ ] Response compression
- [ ] CDN for static assets
- [ ] Database-backed conversation history

## Security Considerations

1. **API Key Protection**: Never expose GEMINI_API_KEY in frontend
2. **Rate Limiting**: Prevents abuse and excessive costs
3. **Input Validation**: Sanitizes user input before processing
4. **Content Filtering**: Gemini's built-in safety filters
5. **Authentication**: Can add auth middleware to routes
6. **HTTPS Only**: Always use secure connections

## Cost Optimization

### Gemini API Pricing (as of 2024)
- **Free Tier**: 60 requests per minute
- **Paid Tier**: $0.00025 per 1K characters

### Cost Reduction Strategies
1. **Caching**: Reduces API calls by 40-60%
2. **Rate Limiting**: Prevents excessive usage
3. **Prompt Optimization**: Shorter system instructions
4. **Model Selection**: gemini-1.5-flash is cost-effective

### Estimated Monthly Costs
- **Low Usage** (100 queries/day): ~$0.50/month
- **Medium Usage** (500 queries/day): ~$2.50/month
- **High Usage** (2000 queries/day): ~$10/month

## Support

### Getting Help
- **Documentation**: This file
- **Logs**: Check backend console
- **Status**: Use `/api/ai/status` endpoint
- **Community**: Google AI Studio forums

### Reporting Issues
Include:
1. Error message
2. Console logs
3. Request/response examples
4. Environment details

---

**Version**: 2.0.0  
**Last Updated**: 2026-02-11  
**Maintained By**: Prescripto Development Team
