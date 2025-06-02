// File: Backend/index.js

// require('dotenv').config(); // Komentari dulu jika tidak esensial untuk tes ini
const express = require('express');
const app = express();
// const cors = require('cors'); // Komentari dulu
// const routes = require('./routes/route'); // Komentari dulu

// app.use(cors({})); // Komentari dulu
// app.use(express.json()); // Komentari dulu
// app.use('/api', routes); // PASTIKAN INI DIKOMENTARI atau DIHAPUS untuk tes ini

// Route untuk root, yang sebelumnya Anda bilang bekerja
app.get('/', (req, res) => {
  console.log('Backend RILIS: Root / diakses!'); // Tambahkan log unik
  res.send('Welcome to the API root! - Versi Tes Minimalis');
});

// Route tes baru TANPA /api
app.get('/pinglokal', (req, res) => { // Ganti nama route agar benar-benar baru
  console.log('Backend RILIS: /pinglokal diakses!'); // Tambahkan log unik
  res.status(200).send('Pong dari /pinglokal! - Versi Tes Minimalis');
});

// Route tes baru DENGAN /api
app.get('/api/pingglobal', (req, res) => { // Ganti nama route agar benar-benar baru
  console.log('Backend RILIS: /api/pingglobal diakses!'); // Tambahkan log unik
  res.status(200).send('Pong dari /api/pingglobal! - Versi Tes Minimalis');
});

const PORT = process.env.PORT || 3000; // Gunakan process.env.PORT yang disediakan Railway
app.listen(PORT, () => {
  console.log(`Server tes minimalis berjalan di port ${PORT}. Routes aktif: /, /pinglokal, /api/pingglobal`);
});
