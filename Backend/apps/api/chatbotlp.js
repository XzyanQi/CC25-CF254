const axios = require("axios");

const PYTHON_API_URL = "https://flask-production-61c8.up.railway.app/search";

const sendToPythonService = async (text, top_kVal = 3) => {
  // ... (isi fungsi seperti sebelumnya) ...
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
