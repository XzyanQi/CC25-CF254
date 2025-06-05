import axios from "axios";


const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

const CHATBOT_API_ENDPOINT = "/api/chatbotApi/search";
const API_URL = `${BASE_URL}${CHATBOT_API_ENDPOINT}`;

// Axios instance dengan konfigurasi default
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 detik timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor untuk request
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
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
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export const sendToMindfulness = async (text, top_k = 3) => {
  try {
    // Validasi input
    if (!text || typeof text !== 'string') {
      throw new Error('Text parameter is required and must be a string');
    }

    // Log untuk debugging
    console.log('Sending request to:', API_URL);
    console.log('Request payload:', { text, top_k });

    const response = await apiClient.post(CHATBOT_API_ENDPOINT, {
      text: text.trim(),
      top_k: Number(top_k)
    });

    return response.data;
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          `Server error: ${error.response.status}`;
      
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });

      throw new Error(`${errorMessage} (Status: ${error.response.status})`);
    } else if (error.request) {
      // Request dibuat jika tidak ada respon diterima
      console.error('Network Error:', error.request);
      throw new Error('Network error: Unable to connect to server');
    } else {
      // vvvvvv
      console.error('Unexpected Error:', error.message);
      throw new Error(`Unexpected error: ${error.message}`);
    }
  }
};

// Health check function untuk memverifikasi koneksi
export const checkAPIHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return { status: 'healthy', data: response.data };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.response?.data || error.message 
    };
  }
};
