import axios from "axios"
const BASH_URL = "http://localhost:3000"

export const getUserByEmail = async (email) => {
    try {
        const response = await axios.get(`${BASH_URL}/user/email/${email}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response
    } catch (error) {
        return error.response
    }
}