require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const routes = require('./routes/route');

// Opsi CORS untuk mengizinkan origin tertentu
const corsOptions = {
  origin: ['https://mindfulnessnlp.vercel.app', 'http://localhost:5173'], // Izinkan frontend production + local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

// middleware CORS dengan opsi yang sudah ditentukan
app.use(cors(corsOptions));

// sebelum request diteruskan ke handler lainnya.
app.options('*', cors(corsOptions));

// Middleware lainnya
app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Welcome to the API root! Actual endpoints are under /api');
});

// Gunakan process.env.PORT agar kompatibel dengan Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}, API base path /api`);
});
