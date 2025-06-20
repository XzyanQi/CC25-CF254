const express = require('express');
const router = express.Router();
const { sendToPythonService, checkPythonServiceHealth } = require('./chatbotlp');

const PESAN_ERROR = {
  TEKS_KOSONG: 'Teks tidak boleh kosong. Mohon isi pesan Anda.',
  TEKS_INVALID: 'Format teks tidak valid. Teks harus berupa tulisan.',
  TEKS_TERLALU_PANJANG: 'Teks terlalu panjang. Maksimal 1000 karakter.',
  TOP_K_INVALID: 'Nilai top_k harus antara 1 sampai 10.',
  SERVER_ERROR: 'Terjadi kesalahan pada server.',
  AI_TIDAK_TERSEDIA: 'Layanan AI sedang tidak tersedia. Silakan coba lagi nanti.',
  TIMEOUT: 'Waktu respons habis. Silakan coba lagi.',
  RATE_LIMIT: 'Terlalu banyak permintaan. Mohon tunggu beberapa saat.'
};


const validasiRequest = (req, res, next) => {
  const { text, query, top_k } = req.body;
  const teksMasuk = text || query;
  
  if (!teksMasuk) {
    return res.status(400).json({ 
      sukses: false,
      pesan: PESAN_ERROR.TEKS_KOSONG,
      error: 'TEKS_KOSONG'
    });
  }
  
  if (typeof teksMasuk !== 'string') {
    return res.status(400).json({
      sukses: false,
      pesan: PESAN_ERROR.TEKS_INVALID,
      error: 'FORMAT_TEKS_INVALID'
    });
  }
  
  const teksBersih = teksMasuk.trim();
  if (teksBersih.length === 0) {
    return res.status(400).json({
      sukses: false,
      pesan: PESAN_ERROR.TEKS_KOSONG,
      error: 'TEKS_KOSONG_SETELAH_TRIM'
    });
  }
  
  if (teksBersih.length > 1000) {
    return res.status(400).json({
      sukses: false,
      pesan: PESAN_ERROR.TEKS_TERLALU_PANJANG,
      error: 'TEKS_TERLALU_PANJANG'
    });
  }
  

  if (top_k !== undefined) {
    const nilaiTopK = Number(top_k);
    if (isNaN(nilaiTopK) || nilaiTopK < 1 || nilaiTopK > 10) {
      return res.status(400).json({
        sukses: false,
        pesan: PESAN_ERROR.TOP_K_INVALID,
        error: 'TOP_K_INVALID'
      });
    }
  }
  
  req.dataTervalidasi = {
    text: teksBersih,
    top_k: Number(top_k) || 3
  };
  
  next();
};


router.post('/search', validasiRequest, async (req, res) => {
  const waktuMulai = Date.now();
  const { text, top_k } = req.dataTervalidasi;
  
  try {
    console.log(`[chatbotApi.js] Memproses permintaan pencarian:`)
    console.log(`[chatbotApi.js] Teks: "${text}"`);
    console.log(`[chatbotApi.js] Top K: ${top_k}`);
    console.log(`[chatbotApi.js] ID Request: ${req.headers['x-request-id'] || 'N/A'}`);
    

    const hasilDariPython = await sendToPythonService(text, top_k);
    const waktuProses = Date.now() - waktuMulai;

    if (!hasilDariPython) {
      throw new Error('Tidak ada respons dari layanan AI');
    }

    let dataField = hasilDariPython;
    if (!hasilDariPython.results) {
      if (Array.isArray(hasilDariPython)) {
        dataField = { results: hasilDariPython };
      } else {
        dataField = { results: [hasilDariPython] };
      }
    }

    const respons = {
      sukses: true,
      data: dataField,
      meta: {
        waktu_proses_ms: waktuProses,
        waktu: new Date().toISOString(),
        id_request: req.headers['x-request-id'] || null
      }
    };

    console.log('[chatbotApi.js] Respons ke frontend:', JSON.stringify(respons, null, 2));
    res.json(respons);

  } catch (error) {
    const waktuProses = Date.now() - waktuMulai;
    
    console.error(`[chatbotApi.js] Error saat memproses permintaan:`, {
      error: error.message,
      stack: error.stack,
      text: text,
      top_k: top_k,
      waktu_proses_ms: waktuProses,
      id_request: req.headers['x-request-id'] || null
    });
    
    let statusCode = 500;
    let pesanError = PESAN_ERROR.SERVER_ERROR;
    let kodeError = 'ERROR_SERVER';
    
    if (error.message.includes('Network error') || error.message.includes('Cannot connect')) {
      statusCode = 502;
      pesanError = PESAN_ERROR.AI_TIDAK_TERSEDIA;
      kodeError = 'LAYANAN_TIDAK_TERSEDIA';
    } else if (error.message.includes('timeout')) {
      statusCode = 504;
      pesanError = PESAN_ERROR.TIMEOUT;
      kodeError = 'TIMEOUT';
    } else if (error.message.includes('Too many requests')) {
      statusCode = 429;
      pesanError = PESAN_ERROR.RATE_LIMIT;
      kodeError = 'RATE_LIMIT';
    }
    
    const responsError = {
      sukses: false,
      pesan: pesanError,
      error: kodeError,
      meta: {
        waktu_proses_ms: waktuProses,
        waktu: new Date().toISOString(),
        id_request: req.headers['x-request-id'] || null
      }
    };
    
    if (process.env.NODE_ENV === 'development') {
      responsError.debug = {
        error_asli: error.message,
        stack: error.stack
      };
    }
    
    res.status(statusCode).json(responsError);
  }
});

router.get('/health', async (req, res) => {
  try {
    const kesehatanPython = await checkPythonServiceHealth();
    const statusKesehatan = {
      status: 'sehat',
      waktu: new Date().toISOString(),
      layanan: {
        nodejs: { status: 'sehat' },
        python_api: kesehatanPython
      },
      versi: process.env.npm_package_version || '1.0.0'
    };
    if (kesehatanPython.status !== 'healthy') {
      statusKesehatan.status = 'terdegradasi';
    }
    const statusCode = statusKesehatan.status === 'sehat' ? 200 : 503;
    res.status(statusCode).json(statusKesehatan);
  } catch (error) {
    console.error('[chatbotApi.js] Error cek kesehatan:', error);
    res.status(503).json({
      status: 'tidak_sehat',
      waktu: new Date().toISOString(),
      error: error.message,
      layanan: {
        nodejs: { status: 'sehat' },
        python_api: { status: 'tidak_diketahui', error: error.message }
      }
    });
  }
});

router.get('/info', (req, res) => {
  res.json({
    nama: 'API Chatbot Mindfulness',
    versi: process.env.npm_package_version || '1.0.0',
    deskripsi: 'API untuk layanan chatbot Mindfulness AI',
    endpoint: [
      {
        metode: 'POST',
        path: '/api/chatbotApi/search',
        deskripsi: 'Kirim teks ke AI untuk mendapat respons mindfulness'
      },
      {
        metode: 'GET', 
        path: '/api/chatbotApi/health',
        deskripsi: 'Cek status kesehatan API'
      },
      {
        metode: 'GET',
        path: '/api/chatbotApi/info', 
        deskripsi: 'Dapatkan informasi API'
      }
    ],
    waktu: new Date().toISOString()
  });
});

router.use((error, req, res, next) => {
  console.error('[chatbotApi.js] Error tidak tertangani:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({
    sukses: false,
    pesan: 'Terjadi kesalahan yang tidak terduga.',
    error: 'ERROR_TIDAK_TERDUGA',
    meta: {
      waktu: new Date().toISOString(),
      id_request: req.headers['x-request-id'] || null
    }
  });
});

module.exports = router;
