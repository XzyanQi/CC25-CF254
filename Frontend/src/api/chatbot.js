import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const CHATBOT_API_ENDPOINT = "/api/chatbotApi/search";
const API_URL = `${BASE_URL}${CHATBOT_API_ENDPOINT}`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 detik untuk proses
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

/**
 * Fungsi utama kirim pesan ke backend Mindfulness
 * @param {string} text - Pesan user
 * @param {number} top_k - Jumlah top hasil (opsional, default 3)
 * @returns {Promise<Object>} Respons dari backend
 */
export const sendToMindfulness = async (text, top_k = 3) => {
  try {
    // Validasi input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text parameter is required and must be a non-empty string');
    }
    if (text.trim().length > 1000) {
      throw new Error('Text is too long. Maximum 1000 characters allowed.');
    }

    console.log('Sending request to:', API_URL);
    console.log('Request payload:', { text: text.trim(), top_k });

    const response = await apiClient.post(CHATBOT_API_ENDPOINT, {
      text: text.trim(),
      top_k: Number(top_k) || 3
    });

    if (!response.data) {
      throw new Error('Empty response from server');
    }

    return response.data;

  } catch (error) {
    if (error.response) {
      // Server mengembalikan error status
      const status = error.response.status;
      const errorData = error.response.data;
      
      let errorMessage = 'Server error occurred';
      
      switch (status) {
        case 400:
          errorMessage = errorData?.message || errorData?.pesan || 'Bad request - invalid input';
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
          errorMessage = errorData?.message || errorData?.pesan || 'Internal server error';
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
          errorMessage = errorData?.message || errorData?.pesan || `Server error: ${status}`;
      }

      console.error('API Error Response:', {
        status,
        data: errorData,
        url: error.config?.url
      });
      
      throw new Error(`${errorMessage} (Status: ${status})`);
      
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      console.error('Request Timeout:', error.message);
      throw new Error('Request timeout: Server is taking too long to respond. Please try again.');
    } else if (error.request) {
      // Request berhasil dikirim tapi tidak ada respons
      console.error('Network Error:', error.request);
      throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
    } else {
      // Error lain
      console.error('Unexpected Error:', error.message);
      throw new Error(`Unexpected error: ${error.message}`);
    }
  }
};

/**
 * Mengecek kesehatan API (health check)
 * @returns {Promise<Object>} Status kesehatan API
 */
export const checkAPIHealth = async () => {
  try {
    const response = await apiClient.get('/api/health', {
      timeout: 5000 // 5 detik
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

/**
 * Fungsi kirim pesan dengan retry otomatis (exponential backoff)
 * @param {string} text 
 * @param {number} top_k 
 * @param {number} maxRetries 
 * @returns {Promise<Object>}
 */
export const sendToMindfulnessWithRetry = async (text, top_k = 3, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to send message`);
      return await sendToMindfulness(text, top_k);
    } catch (error) {
      lastError = error;
      
      // Jika error 4xx, jangan retry
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
