require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const routes = require('./routes/route');

//  CORS khusus untuk frontend Vercel + localhost dev
app.use(cors({
  origin: ['https://mindfulness-one.vercel.app', 'http://localhost:5173'], // frontend production + local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Welcome to the API root! Actual endpoints are likely under /api');
});

// gunakan process.env.PORT biar cocok Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}, API base path /api`);
});
