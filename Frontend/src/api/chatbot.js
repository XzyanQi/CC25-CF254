import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const CHATBOT_API_ENDPOINT = "/api/chatbotApi/search";
const API_URL = `${BASE_URL}${CHATBOT_API_ENDPOINT}`;

/**
 * Mengirim pesan ke backend Express (yang teruskan ke Flask)
 * @param {string} text - isi pesan user
 * @param {AbortSignal} signal - abort signal
 * @param {number} top_k - jumlah jawaban teratas, default 3
 */
export const sendToMindfulness = async (text, signal, top_k = 3) => {
  try {
    const response = await axios.post(API_URL, { text, top_k }, { signal });
    return response.data;
  } catch (error) {
    throw error;
  }
};
