const axios = require("axios");
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";
const DEFAULT_TIMEOUT = 25000; // 25 seconds
const MAX_RETRIES = 2;

const pythonApiClient = axios.create({
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
pythonApiClient.interceptors.request.use(
  (config) => {
    console.log(`[chatbotlp.js] Sending request to Python API: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`[chatbotlp.js] Request payload:`, config.data);
    return config;
  },
  (error) => {
    console.error('[chatbotlp.js] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
pythonApiClient.interceptors.response.use(
  (response) => {
    console.log(`[chatbotlp.js] Python API response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[chatbotlp.js] Response interceptor error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

const sendToPythonService = async (text, top_kVal = 3, retryCount = 0) => {
  try {
    // Input validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error("Input text is required and must be a non-empty string");
    }

    if (!PYTHON_API_URL) {
      throw new Error("PYTHON_API_URL environment variable is not configured");
    }

    const url = `${PYTHON_API_URL}/search`;
    console.log(`[chatbotlp.js] Sending request to: ${url}`);
    console.log(`[chatbotlp.js] Request data:`, { text: text.trim(), top_k: top_kVal });

    const response = await pythonApiClient.post(url, {
      text: text.trim(),
      top_k: Number(top_kVal) || 3
    });

    if (!response.data) {
      throw new Error("Empty response from Python API");
    }

    console.log(`[chatbotlp.js] Python API response received successfully`);
    console.log(`[chatbotlp.js] Response data:`, response.data);

    return response.data;

  } catch (error) {
    console.error(`[chatbotlp.js] Error from Python API (attempt ${retryCount + 1}):`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });

    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      let errorMessage = "Python API error";

      switch (status) {
        case 400:
          errorMessage = errorData?.message || errorData?.detail || "Bad request to Python API";
          break;
        case 401:
          errorMessage = "Unauthorized access to Python API";
          break;
        case 403:
          errorMessage = "Access forbidden to Python API";
          break;
        case 404:
          errorMessage = "Python API endpoint not found";
          break;
        case 422:
          errorMessage = errorData?.detail || "Validation error in Python API";
          break;
        case 429:
          errorMessage = "Too many requests to Python API";
          break;
        case 500:
          errorMessage = errorData?.message || errorData?.detail || "Internal error in Python API";
          break;
        case 502:
          errorMessage = "Bad gateway - Python API connection issue";
          break;
        case 503:
          errorMessage = "Python API service unavailable";
          break;
        case 504:
          errorMessage = "Gateway timeout - Python API took too long";
          break;
        default:
          errorMessage = errorData?.message || errorData?.detail || `Python API error: ${status}`;
      }

      // Retry untuk error 5xx
      if (status >= 500 && retryCount < MAX_RETRIES) {
        console.log(`[chatbotlp.js] Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return sendToPythonService(text, top_kVal, retryCount + 1);
      }

      throw new Error(errorMessage);

    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      const timeoutError = "Request timeout: Python API is taking too long to respond.";
      if (retryCount < MAX_RETRIES) {
        console.log(`[chatbotlp.js] Timeout error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return sendToPythonService(text, top_kVal, retryCount + 1);
      }
      throw new Error(timeoutError);

    } else if (error.request) {
      // Network error
      const networkError = "Network error: Cannot connect to Python API. Please check if the Python service is running.";
      if (retryCount < MAX_RETRIES) {
        console.log(`[chatbotlp.js] Network error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 3000));
        return sendToPythonService(text, top_kVal, retryCount + 1);
      }
      throw new Error(networkError);

    } else {
      throw new Error(`Unexpected error: ${error.message}`);
    }
  }
};

const checkPythonServiceHealth = async () => {
  try {
    const url = `${PYTHON_API_URL}/health`;
    const response = await pythonApiClient.get(url, { timeout: 5000 });
    return {
      status: 'healthy',
      data: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[chatbotlp.js] Python service health check failed:', error.message);
    return {
      status: 'unhealthy',
      error: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = { 
  sendToPythonService,
  checkPythonServiceHealth 
};
