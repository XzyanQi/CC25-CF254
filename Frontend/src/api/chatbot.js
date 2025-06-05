import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const CHATBOT_API_ENDPOINT = "/api/chatbotApi/search";
const API_URL = `${BASE_URL}${CHATBOT_API_ENDPOINT}`;

export const sendToMindfulness = async (text, top_k = 3) => {
  try {
    const response = await axios.post(API_URL, { text, top_k });
    return response.data;
  } catch (error) {
    throw error;
  }
};
