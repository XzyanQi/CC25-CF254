const express = require('express');
const router = express.Router();
const { sendToPythonService, checkPythonServiceHealth } = require('./chatbotlp');

const validateRequest = (req, res, next) => {
  const { text, query, top_k } = req.body;
  const inputText = text || query;
  
  if (!inputText) {
    return res.status(400).json({ 
      success: false,
      message: 'Input text is required. Please provide "text" or "query" in the request body.',
      error: 'MISSING_TEXT_INPUT'
    });
  }
  
  if (typeof inputText !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Input text must be a string.',
      error: 'INVALID_TEXT_TYPE'
    });
  }
  
  const trimmedText = inputText.trim();
  if (trimmedText.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Input text cannot be empty.',
      error: 'EMPTY_TEXT_INPUT'
    });
  }
  
  if (trimmedText.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Input text is too long. Maximum 1000 characters allowed.',
      error: 'TEXT_TOO_LONG'
    });
  }
  
  // Validate top_k
  if (top_k !== undefined) {
    const top_kNum = Number(top_k);
    if (isNaN(top_kNum) || top_kNum < 1 || top_kNum > 10) {
      return res.status(400).json({
        success: false,
        message: 'top_k must be a number between 1 and 10.',
        error: 'INVALID_TOP_K'
      });
    }
  }
  
  // Add validated data to request
  req.validatedData = {
    text: trimmedText,
    top_k: Number(top_k) || 3
  };
  
  next();
};

// Main search endpoint
router.post('/search', validateRequest, async (req, res) => {
  const startTime = Date.now();
  const { text, top_k } = req.validatedData;
  
  try {
    console.log(`[chatbotApi.js] Processing search request:`);
    console.log(`[chatbotApi.js] Text: "${text}"`);
    console.log(`[chatbotApi.js] Top K: ${top_k}`);
    console.log(`[chatbotApi.js] Request ID: ${req.headers['x-request-id'] || 'N/A'}`);
    
    // Call Python service
    const resultFromPython = await sendToPythonService(text, top_k);
    
    const processingTime = Date.now() - startTime;
    console.log(`[chatbotApi.js] Request processed successfully in ${processingTime}ms`);
    
    // Validate Python service response
    if (!resultFromPython) {
      throw new Error('Empty response from Python service');
    }
    
    // Standardize response format
    const response = {
      success: true,
      data: resultFromPython,
      meta: {
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
        request_id: req.headers['x-request-id'] || null
      }
    };
    
    res.json(response);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log error dengan detail lengkap
    console.error(`[chatbotApi.js] Error processing search request:`, {
      error: error.message,
      stack: error.stack,
      text: text,
      top_k: top_k,
      processing_time_ms: processingTime,
      request_id: req.headers['x-request-id'] || null
    });
    
    // Determine error status and message
    let statusCode = 500;
    let errorMessage = 'Internal server error occurred.';
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.message.includes('Network error') || error.message.includes('Cannot connect')) {
      statusCode = 502;
      errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      errorCode = 'SERVICE_UNAVAILABLE';
    } else if (error.message.includes('timeout') || error.message.includes('took too long')) {
      statusCode = 504;
      errorMessage = 'Request timeout. The AI service is taking too long to respond.';
      errorCode = 'REQUEST_TIMEOUT';
    } else if (error.message.includes('Bad request') || error.message.includes('Validation error')) {
      statusCode = 400;
      errorMessage = error.message;
      errorCode = 'VALIDATION_ERROR';
    } else if (error.message.includes('Unauthorized')) {
      statusCode = 401;
      errorMessage = 'Unauthorized access to AI service.';
      errorCode = 'UNAUTHORIZED';
    } else if (error.message.includes('Too many requests')) {
      statusCode = 429;
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
      errorCode = 'RATE_LIMIT_EXCEEDED';
    }
    
    const errorResponse = {
      success: false,
      message: errorMessage,
      error: errorCode,
      meta: {
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
        request_id: req.headers['x-request-id'] || null
      }
    };
    
    // Include original error message in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.debug = {
        original_error: error.message,
        stack: error.stack
      };
    }
    
    res.status(statusCode).json(errorResponse);
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const pythonHealth = await checkPythonServiceHealth();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        nodejs: { status: 'healthy' },
        python_api: pythonHealth
      },
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // health dependencies
    if (pythonHealth.status !== 'healthy') {
      healthStatus.status = 'degraded';
    }
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    console.error('[chatbotApi.js] Health check error:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        nodejs: { status: 'healthy' },
        python_api: { status: 'unknown', error: error.message }
      }
    });
  }
});

// Get API
router.get('/info', (req, res) => {
  res.json({
    name: 'Mindfulness Chatbot API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'API for Mindfulness AI chatbot service',
    endpoints: [
      {
        method: 'POST',
        path: '/api/chatbotApi/search',
        description: 'Send text to AI for mindfulness response'
      },
      {
        method: 'GET', 
        path: '/api/chatbotApi/health',
        description: 'Check API health status'
      },
      {
        method: 'GET',
        path: '/api/chatbotApi/info', 
        description: 'Get API information'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('[chatbotApi.js] Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred.',
    error: 'UNHANDLED_ERROR',
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.headers['x-request-id'] || null
    }
  });
});

module.exports = router;
