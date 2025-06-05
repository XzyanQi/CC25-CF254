import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

// Login
export const login = async (payload) => {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response;
    } catch (error) {
        // Kembalikan respon error agar bisa ditangani di komponen
        return error.response;
    }
};

// Logout
export const logout = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/auth/logout`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Hapus token dari cookie saat logout
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        return response;
    } catch (error) {
        return error.response;
    }
};

// Register / Daftar akun
export const register = async (payload) => {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, payload, { 
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response;
    } catch (error) {
        return error.response;
    }
};

// Reset password
export const resetPassword = async (payload) => {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/reset-password`, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response;
    } catch (error) {
        return error.response;
    }
};
