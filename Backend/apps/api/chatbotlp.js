const axios = require("axios");
const PYTHON_API_URL = process.env.PYTHON_API_URL

const sendToPythonService = async (text, top_kVal = 3) => {
  try {
    const response = await axios.post(PYTHON_API_URL, { text, top_k: top_kVal });
    return response.data;
  } catch (error) {
    console.error('[chatbotlp.js] Error from Python API:', error.response?.data || error.message || error);
    throw new Error("Layanan AI Mindfulness tidak dapat dihubungi.");
  }
};

module.exports = { sendToPythonService };
