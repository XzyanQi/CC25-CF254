import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const AUTH_TIMEOUT = 15000; // 15 detik
const TOKEN_STORAGE_KEY = 'auth_token';
const TOKEN_EXPIRY_DAYS = 7;

// Axios instance khusus untuk authentication
const authApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: AUTH_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Token Management

const getStoredToken = () => {
  // Priority: localStorage -> cookie
  return localStorage.getItem(TOKEN_STORAGE_KEY) || getCookieValue(TOKEN_STORAGE_KEY);
};

const storeToken = (token) => {
  if (!token) return;
  
  // Store in localStorage
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  
  // Store in secure cookie
  const expires = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${TOKEN_STORAGE_KEY}=${token}; expires=${expires}; path=/; secure; samesite=strict`;
};

const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  document.cookie = `${TOKEN_STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const getCookieValue = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};


// Request interceptor
authApiClient.interceptors.request.use(
  (config) => {
    console.log(`Auth API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token if available
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

// Response interceptor
authApiClient.interceptors.response.use(
  (response) => {
    console.log(`Auth API Response: ${response.status} ${response.config.url}`);
    
    // Store token if present in response
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

    if (error.response?.status === 401) {
      clearStoredToken();
    
    }
    
    return Promise.reject(error);
  }
);

// Eror handle

const createErrorResponse = (error, operation) => {
  console.error(`Auth ${operation} Error:`, error);

  const baseError = {
    success: false,
    operation,
    timestamp: new Date().toISOString()
  };

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    let message = data?.message || data?.error || `${operation} failed`;
    
    // Status-specific messages
    switch (status) {
      case 400:
        message = data?.message || 'Invalid request data';
        break;
      case 401:
        message = 'Invalid credentials or session expired';
        clearStoredToken();
        break;
      case 403:
        message = 'Access forbidden';
        break;
      case 404:
        message = 'Authentication endpoint not found';
        break;
      case 429:
        message = 'Too many attempts. Please try again later';
        break;
      case 500:
        message = 'Server error. Please try again later';
        break;
    }

    return {
      ...baseError,
      status,
      message,
      data: data || null
    };
  } 
  
  if (error.request) {
    // Network error
    return {
      ...baseError,
      status: 'NETWORK_ERROR',
      message: 'Unable to connect to server. Please check your connection.'
    };
  }
  
  // Unexpected error
  return {
    ...baseError,
    status: 'UNEXPECTED_ERROR',
    message: error.message || 'An unexpected error occurred'
  };
};

const createSuccessResponse = (response, message = 'Operation successful') => ({
  success: true,
  status: response.status,
  message,
  data: response.data,
  timestamp: new Date().toISOString()
});

// validasi

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateLoginPayload = (payload) => {
  if (!payload) throw new Error('Payload is required');
  if (!payload.email) throw new Error('Email is required');
  if (!payload.password) throw new Error('Password is required');
  if (!validateEmail(payload.email)) throw new Error('Invalid email format');
  if (!validatePassword(payload.password)) throw new Error('Password must be at least 6 characters long');
};

const validateRegisterPayload = (payload) => {
  validateLoginPayload(payload); 
  if (payload.confirmPassword && payload.password !== payload.confirmPassword) {
    throw new Error('Passwords do not match');
  }
};

//APi

export const login = async (payload) => {
  try {
    validateLoginPayload(payload);
    
    console.log('Attempting login for:', payload.email);

    const response = await authApiClient.post('/api/auth/login', {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      rememberMe: payload.rememberMe || false
    });

    console.log('Login successful');
    return createSuccessResponse(response, 'Login successful');

  } catch (error) {
    return createErrorResponse(error, 'Login');
  }
};

export const register = async (payload) => {
  try {
    validateRegisterPayload(payload);
    
    console.log('Attempting registration for:', payload.email);

    const response = await authApiClient.post('/api/auth/register', {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      name: payload.name?.trim(),
      ...payload
    });

    console.log('Registration successful');
    return createSuccessResponse(response, 'Registration successful');

  } catch (error) {
    return createErrorResponse(error, 'Registration');
  }
};

export const logout = async () => {
  try {
    console.log('Attempting logout...');

    const response = await authApiClient.post('/api/auth/logout');
    
    // Clear stored tokens
    clearStoredToken();
    
    console.log('Logout successful');
    return createSuccessResponse(response, 'Logout successful');

  } catch (error) {
    // Even if server logout fails, clear local tokens
    clearStoredToken();
    
    const errorResult = createErrorResponse(error, 'Logout');
    
    // Return success anyway since local logout succeeded
    return {
      success: true,
      message: 'Logged out locally',
      serverError: errorResult,
      timestamp: new Date().toISOString()
    };
  }
};

export const resetPassword = async (payload) => {
  try {
    if (!payload?.email) {
      throw new Error('Email is required for password reset');
    }
    
    if (!validateEmail(payload.email)) {
      throw new Error('Invalid email format');
    }

    console.log('Requesting password reset for:', payload.email);

    const response = await authApiClient.post('/api/auth/reset-password', {
      email: payload.email.trim().toLowerCase()
    });

    console.log('Password reset request successful');
    return createSuccessResponse(response, 'Password reset email sent');

  } catch (error) {
    return createErrorResponse(error, 'Password Reset');
  }
};

export const confirmPasswordReset = async (payload) => {
  try {
    if (!payload?.token) throw new Error('Reset token is required');
    if (!payload?.newPassword) throw new Error('New password is required');
    if (!validatePassword(payload.newPassword)) {
      throw new Error('New password must be at least 6 characters long');
    }
    if (payload.confirmPassword && payload.newPassword !== payload.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const response = await authApiClient.post('/api/auth/confirm-reset-password', {
      token: payload.token,
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword
    });

    return createSuccessResponse(response, 'Password reset successful');

  } catch (error) {
    return createErrorResponse(error, 'Password Reset Confirmation');
  }
};

export const verifyToken = async () => {
  try {
    const token = getStoredToken();
    if (!token) {
      return { success: false, message: 'No token found' };
    }

    const response = await authApiClient.get('/api/auth/verify');
    return createSuccessResponse(response, 'Token is valid');

  } catch (error) {
    clearStoredToken();
    return createErrorResponse(error, 'Token Verification');
  }
};

export const refreshToken = async () => {
  try {
    const response = await authApiClient.post('/api/auth/refresh');
    return createSuccessResponse(response, 'Token refreshed');

  } catch (error) {
    clearStoredToken();
    return createErrorResponse(error, 'Token Refresh');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await authApiClient.get('/api/auth/me');
    return createSuccessResponse(response, 'User data retrieved');

  } catch (error) {
    return createErrorResponse(error, 'Get Current User');
  }
};

export const updateProfile = async (payload) => {
  try {
    if (!payload) throw new Error('Profile data is required');

    const response = await authApiClient.put('/api/auth/profile', payload);
    return createSuccessResponse(response, 'Profile updated successfully');

  } catch (error) {
    return createErrorResponse(error, 'Update Profile');
  }
};

export const changePassword = async (payload) => {
  try {
    if (!payload?.currentPassword) throw new Error('Current password is required');
    if (!payload?.newPassword) throw new Error('New password is required');
    if (!validatePassword(payload.newPassword)) {
      throw new Error('New password must be at least 6 characters long');
    }

    const response = await authApiClient.post('/api/auth/change-password', {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword
    });

    return createSuccessResponse(response, 'Password changed successfully');

  } catch (error) {
    return createErrorResponse(error, 'Change Password');
  }
};

export const isAuthenticated = () => {
  return !!getStoredToken();
};

export const getAuthToken = () => {
  return getStoredToken();
};

export const clearAuthentication = () => {
  clearStoredToken();
};

export const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth health check
export const checkAuthHealth = async () => {
  try {
    const response = await authApiClient.get('/api/auth/health');
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

// Auto-refresh token before expiry 
export const setupAutoRefresh = (intervalMinutes = 30) => {
  return setInterval(async () => {
    if (isAuthenticated()) {
      try {
        await refreshToken();
        console.log('Token auto-refreshed');
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }
  }, intervalMinutes * 60 * 1000);
};

// Cleanup function
export const cleanup = (refreshInterval) => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  clearAuthentication();
};
