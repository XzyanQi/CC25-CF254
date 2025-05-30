import axios from "axios";
const API_URL = "http://localhost:3000/api/chatbotApi/search"; 

export const sendToMindfulness = async (text, signal) => { 
  try {
    console.log(`Frontend: Mengirim ke ${API_URL} dengan teks: "${text}"`); 
    const response = await axios.post(API_URL, {
      text: text,
      top_k: 3
    }, { signal }); // signal ke konfigurasi Axios
    console.log("Frontend: Menerima respons:", response.data); 
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('API Request dibatalkan:', error.message);
    } else {
      console.error("Frontend: Gagal kirim ke chatbot (via Node.js):", error);
      if (error.response) {
        console.error("Frontend: Data Error:", error.response.data);
        console.error("Frontend: Status Error:", error.response.status);
      } else if (error.request) {
        console.error("Frontend: Tidak ada respons dari server:", error.request);
      } else {
        console.error("Frontend: Error lain:", error.message);
      }
    }
    // Lempar error agar bisa ditangani oleh ChatbotPage, termasuk error pembatalan
    throw error; 
  }
};