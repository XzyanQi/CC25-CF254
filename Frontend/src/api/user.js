import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const getUserByEmail = async (email) => {
    try {
        const response = await axios.get(`${BASH_URL}/api/user/email/${email}`, { // <-- UBAH INI
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("Frontend: getUserByEmail response:", response);
        return response; 
    } catch (error) {
        console.error("Frontend: getUserByEmail error:", error.response || error.message); 
        return error.response; 
    }
};
