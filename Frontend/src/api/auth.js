import axios from "axios"
const BASH_URL = "http://localhost:3000"

export const login = async (payload) => {
    try {
        const response = await axios.post(`${BASH_URL}/auth/login`, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response
    } catch (error) {
        return error.response
    }
}

export const logout = async () => {
    try {
        const response = await axios.get(`${BASH_URL}/auth/logout`, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'


        return response
    } catch (error) {
        return error.response
    }
}

export const register = async (payload) => {
    try {
        const response = await axios.post(`${BASH_URL}/auth/register`, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response
    } catch (error) {
        return error.response
    }
}

export const resetPassword = async (payload) => {
    try {
        const response = await axios.post(`${BASH_URL}/auth/reset-password`, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response
    } catch (error) {
        return error.response
    }
}