import axios from "axios";


const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");


const userApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 detik timeout untuk user operations
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
userApiClient.interceptors.request.use(
  (config) => {
    console.log('User API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('User API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response
userApiClient.interceptors.response.use(
  (response) => {
    console.log('User API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('User API Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export const getUserByEmail = async (email) => {
  try {
    // Validasi email
    if (!email || typeof email !== 'string') {
      throw new Error('Email parameter is required and must be a string');
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const encodedEmail = encodeURIComponent(email.trim());
    console.log('Fetching user by email:', encodedEmail);

    const response = await userApiClient.get(`/api/user/email/${encodedEmail}`);
    
    console.log("Frontend: getUserByEmail success:", response.data);
    return response.data;

  } catch (error) {
    console.error("Frontend: getUserByEmail error:", error);

    // Enhanced error handling
    if (error.response) {
      // Server respon error status
      const errorData = {
        status: error.response.status,
        message: error.response.data?.message || error.response.data?.error || 'Server error',
        data: error.response.data
      };

      console.error("Server Error Response:", errorData);
      
      // kembali
      return {
        success: false,
        error: errorData.message,
        status: errorData.status,
        details: errorData.data
      };
    } else if (error.request) {
      // Internet eror
      console.error("Network Error:", error.request);
      return {
        success: false,
        error: 'Network error: Unable to connect to server',
        status: 'NETWORK_ERROR'
      };
    } else {
      // eror anomali
      console.error("Unexpected Error:", error.message);
      return {
        success: false,
        error: error.message,
        status: 'UNEXPECTED_ERROR'
      };
    }
  }
};

// tambahan
export const createUser = async (userData) => {
  try {
    if (!userData || typeof userData !== 'object') {
      throw new Error('User data is required and must be an object');
    }

    const response = await userApiClient.post('/api/user', userData);
    console.log("Frontend: createUser success:", response.data);
    return response.data;

  } catch (error) {
    console.error("Frontend: createUser error:", error);
    return handleApiError(error);
  }
};

export const updateUser = async (userId, userData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const response = await userApiClient.put(`/api/user/${userId}`, userData);
    console.log("Frontend: updateUser success:", response.data);
    return response.data;

  } catch (error) {
    console.error("Frontend: updateUser error:", error);
    return handleApiError(error);
  }
};

// Utility untuk handle api eror
const handleApiError = (error) => {
  if (error.response) {
    return {
      success: false,
      error: error.response.data?.message || error.response.data?.error || 'Server error',
      status: error.response.status,
      details: error.response.data
    };
  } else if (error.request) {
    return {
      success: false,
      error: 'Network error: Unable to connect to server',
      status: 'NETWORK_ERROR'
    };
  } else {
    return {
      success: false,
      error: error.message,
      status: 'UNEXPECTED_ERROR'
    };
  }
};

// Health check untuk user API
export const checkUserAPIHealth = async () => {
  try {
    const response = await userApiClient.get('/api/user/health');
    return { status: 'healthy', data: response.data };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.response?.data || error.message 
    };
  }
};
