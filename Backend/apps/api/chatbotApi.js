const express = require('express');
const router = express.Router();
const { sendToPythonService } = require('./chatbotlp'); 


router.post('/search', async (req, res) => { 
  try {
    const { text, top_k } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Input teks diperlukan.' });
    }
    console.log(`[Node.js Route - chatbotApi.js] Menerima request /search dengan teks: "${text}"`);
    const resultFromPython = await sendToPythonService(text, top_k || 3);
    console.log(`[Node.js Route - chatbotApi.js] Mengirim respons dari /search`);
    res.json(resultFromPython);
  } catch (error) {
    console.error('[Node.js Route - chatbotApi.js] Error di endpoint /chatbot/search:', error.message);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan internal pada server.' });
  }
});

module.exports = router;