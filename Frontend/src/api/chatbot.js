import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const CHATBOT_API_ENDPOINT = "/api/chatbotApi/search";
const API_URL = `${BASE_URL}${CHATBOT_API_ENDPOINT}`; 

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 detik buat proses
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor untuk request
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Request Data:', config.data);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor untuk response
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export const sendToMindfulness = async (text, top_k = 3) => {
  try {
    // Validasi input yang lebih ketat
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text parameter is required and must be a non-empty string');
    }

    if (text.trim().length > 1000) {
      throw new Error('Text is too long. Maximum 1000 characters allowed.');
    }

    // Log untuk debugging
    console.log('Sending request to:', API_URL);
    console.log('Request payload:', { text: text.trim(), top_k });

    const response = await apiClient.post(CHATBOT_API_ENDPOINT, {
      text: text.trim(),
      top_k: Number(top_k) || 3
    });

    // Validasi response structure
    if (!response.data) {
      throw new Error('Empty response from server');
    }

    return response.data;

  } catch (error) {
    // Enhanced error handling dengan lebih spesifik
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const errorData = error.response.data;
      
      let errorMessage = 'Server error occurred';
      
      switch (status) {
        case 400:
          errorMessage = errorData?.message || 'Bad request - invalid input';
          break;
        case 401:
          errorMessage = 'Unauthorized access';
          break;
        case 403:
          errorMessage = 'Access forbidden';
          break;
        case 404:
          errorMessage = 'API endpoint not found';
          break;
        case 429:
          errorMessage = 'Too many requests - please wait';
          break;
        case 500:
          errorMessage = errorData?.message || 'Internal server error';
          break;
        case 502:
          errorMessage = 'Bad gateway - server connection issue';
          break;
        case 503:
          errorMessage = 'Service unavailable - server overloaded';
          break;
        case 504:
          errorMessage = 'Gateway timeout - server took too long to respond';
          break;
        default:
          errorMessage = errorData?.message || `Server error: ${status}`;
      }

      console.error('API Error Response:', {
        status,
        data: errorData,
        url: error.config?.url
      });
      
      throw new Error(`${errorMessage} (Status: ${status})`);
      
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
      throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      console.error('Request Timeout:', error.message);
      throw new Error('Request timeout: Server is taking too long to respond. Please try again.');
      
    } else {
      // Something else happened
      console.error('Unexpected Error:', error.message);
      throw new Error(`Unexpected error: ${error.message}`);
    }
  }
};

// Health check function untuk memverifikasi koneksi
export const checkAPIHealth = async () => {
  try {
    const response = await apiClient.get('/api/health', {
      timeout: 5000 // detik
    });
    return { 
      status: 'healthy', 
      data: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export const sendToMindfulnessWithRetry = async (text, top_k = 3, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to send message`);
      return await sendToMindfulness(text, top_k);
    } catch (error) {
      lastError = error;
      
      if (error.message.includes('Status: 4')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; 
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};
