const axios = require("axios");

const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8080";

const sendToPythonService = async (text, top_kVal = 3) => {
  try {
     console.log(`[Node.js Service - chatbotlp.js] Mengirim ke Python AI -> text: "${text}", top_k: ${top_kVal}`);
     const response = await axios.post(PYTHON_API_URL, { text, top_k: top_kVal });
     console.log("[Node.js Service - chatbotlp.js] Menerima respons dari Python AI.");
     return response.data;
   } catch (error) {
     console.error("[Node.js Service - chatbotlp.js] Gagal koneksi ke Python AI:", error.message);
     throw new Error("Layanan AI Mindfulness tidak dapat dihubungi.");
   }
};

module.exports = { sendToPythonService };
