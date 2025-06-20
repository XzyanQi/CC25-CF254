require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const app = express();
const cors = require('cors');
const routes = require('./routes/route');

app.use(cors({
  origin: ['https://mindfulnessnlp.vercel.app', 'http://localhost:5173'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Welcome to the API root! Actual endpoints are likely under /api');
});

// app.listen buat railway, render, dll
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}, API base path /api`);
// });

// serverless
module.exports = app;
module.exports.handler = serverless(app);
