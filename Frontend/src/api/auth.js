import axios from "axios";

// Konfigurasi base URL dengan normalisasi trailing slash
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

// Axios instance khusus untuk authentication
const authApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 detik timeout untuk auth operations
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Penting untuk cookie handling
});

// Request interceptor untuk auth
authApiClient.interceptors.request.use(
  (config) => {
    console.log('Auth API Request:', config.method?.toUpperCase(), config.url);
    
    // Tambahkan token jika ada di localStorage atau cookie
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Auth API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor untuk auth
authApiClient.interceptors.response.use(
  (response) => {
    console.log('Auth API Response:', response.status, response.config.url);
    
    // Simpan token jika ada di response
    if (response.data?.token) {
      storeToken(response.data.token);
    }
    
    return response;
  },
  (error) => {
    console.error('Auth API Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });

    // Handle unauthorized responses
    if (error.response?.status === 401) {
      clearStoredToken();
    }
    
    return Promise.reject(error);
  }
);

// Utility functions untuk token management
const getStoredToken = () => {
  // Coba ambil dari localStorage dulu, kemudian dari cookie
  return localStorage.getItem('token') || getCookieValue('token');
};

const storeToken = (token) => {
  localStorage.setItem('token', token);
  // Set cookie dengan expire 7 hari
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `token=${token}; expires=${expires}; path=/; secure; samesite=strict`;
};

const clearStoredToken = () => {
  localStorage.removeItem('token');
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

const getCookieValue = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Enhanced error handling function
const handleAuthError = (error, operation) => {
  console.error(`Auth ${operation} Error:`, error);

  if (error.response) {
    // Server responded with error status
    const errorData = {
      success: false,
      status: error.response.status,
      message: error.response.data?.message || 
               error.response.data?.error || 
               `${operation} failed`,
      data: error.response.data,
      timestamp: new Date().toISOString()
    };

    // Special handling untuk different status codes
    switch (error.response.status) {
      case 400:
        errorData.message = error.response.data?.message || 'Invalid request data';
        break;
      case 401:
        errorData.message = 'Invalid credentials or session expired';
        clearStoredToken();
        break;
      case 403:
        errorData.message = 'Access forbidden';
        break;
      case 404:
        errorData.message = 'Authentication endpoint not found';
        break;
      case 429:
        errorData.message = 'Too many attempts. Please try again later';
        break;
      case 500:
        errorData.message = 'Server error. Please try again later';
        break;
    }

    return errorData;
  } else if (error.request) {
    // Network error
    return {
      success: false,
      status: 'NETWORK_ERROR',
      message: 'Unable to connect to server. Please check your connection.',
      timestamp: new Date().toISOString()
    };
  } else {
    // Unexpected error
    return {
      success: false,
      status: 'UNEXPECTED_ERROR',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    };
  }
};

// Login function
export const login = async (payload) => {
  try {
    // Validasi input
    if (!payload || !payload.email || !payload.password) {
      throw new Error('Email and password are required');
    }

    console.log('Attempting login for:', payload.email);

    const response = await authApiClient.post('/api/auth/login', {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      ...payload // Include other fields if any
    });

    console.log('Login successful:', response.data);

    return {
      success: true,
      data: response.data,
      status: response.status,
      message: 'Login successful'
    };

  } catch (error) {
    return handleAuthError(error, 'Login');
  }
};

// Register function
export const register = async (payload) => {
  try {
    // Validasi input
    if (!payload || !payload.email || !payload.password) {
      throw new Error('Email and password are required');
    }

    // Additional validation
    if (payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    console.log('Attempting registration for:', payload.email);

    const response = await authApiClient.post('/api/auth/register', {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      name: payload.name?.trim(),
      ...payload // Include other fields
    });

    console.log('Registration successful:', response.data);

    return {
      success: true,
      data: response.data,
      status: response.status,
      message: 'Registration successful'
    };

  } catch (error) {
    return handleAuthError(error, 'Registration');
  }
};

// Logout function
export const logout = async () => {
  try {
    console.log('Attempting logout...');

    const response = await authApiClient.post('/api/auth/logout'); // Changed to POST

    // Clear stored tokens
    clearStoredToken();

    console.log('Logout successful');

    return {
      success: true,
      data: response.data,
      status: response.status,
      message: 'Logout successful'
    };

  } catch (error) {
    // Even if server logout fails, clear local tokens
    clearStoredToken();
    
    const errorResult = handleAuthError(error, 'Logout');
    
    // Return success anyway since local logout succeeded
    return {
      success: true,
      message: 'Logged out locally',
      serverError: errorResult
    };
  }
};

// Reset password function
export const resetPassword = async (payload) => {
  try {
    // Validasi input
    if (!payload || !payload.email) {
      throw new Error('Email is required for password reset');
    }

    console.log('Requesting password reset for:', payload.email);

    const response = await authApiClient.post('/api/auth/reset-password', {
      email: payload.email.trim().toLowerCase(),
      ...payload
    });

    console.log('Password reset request successful');

    return {
      success: true,
      data: response.data,
      status: response.status,
      message: 'Password reset email sent'
    };

  } catch (error) {
    return handleAuthError(error, 'Password Reset');
  }
};

// Confirm password reset function
export const confirmPasswordReset = async (payload) => {
  try {
    if (!payload || !payload.token || !payload.newPassword) {
      throw new Error('Reset token and new password are required');
    }

    if (payload.newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const response = await authApiClient.post('/api/auth/confirm-reset-password', {
      token: payload.token,
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword
    });

    return {
      success: true,
      data: response.data,
      status: response.status,
      message: 'Password reset successful'
    };

  } catch (error) {
    return handleAuthError(error, 'Password Reset Confirmation');
  }
};

// Verify token function
export const verifyToken = async () => {
  try {
    const token = getStoredToken();
    if (!token) {
      return { success: false, message: 'No token found' };
    }

    const response = await authApiClient.get('/api/auth/verify');

    return {
      success: true,
      data: response.data,
      status: response.status,
      message: 'Token is valid'
    };

  } catch (error) {
    clearStoredToken();
    return handleAuthError(error, 'Token Verification');
  }
};

// Refresh token function
export const refreshToken = async () => {
  try {
    const response = await authApiClient.post('/api/auth/refresh');

    return {
      success: true,
      data: response.data,
      status: response.status,
      message: 'Token refreshed'
    };

  } catch (error) {
    clearStoredToken();
    return handleAuthError(error, 'Token Refresh');
  }
};

// Get current user function
export const getCurrentUser = async () => {
  try {
    const response = await authApiClient.get('/api/auth/me');

    return {
      success: true,
      data: response.data,
      status: response.status
    };

  } catch (error) {
    return handleAuthError(error, 'Get Current User');
  }
};

// Auth health check
export const checkAuthHealth = async () => {
  try {
    const response = await authApiClient.get('/api/auth/health');
    return { status: 'healthy', data: response.data };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.response?.data || error.message 
    };
  }
};

// Utility functions untuk komponen
export const isAuthenticated = () => {
  return !!getStoredToken();
};

export const getAuthToken = () => {
  return getStoredToken();
};

export const clearAuthentication = () => {
  clearStoredToken();
};
