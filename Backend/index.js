require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/route'); 

const app = express();

// cors
app.use(cors({
  origin: "https://mindfulnessnlp.vercel.app",
  credentials: true,
  // method
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options('*', cors());

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Welcome to the API root! Actual endpoints are likely under /api');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}, API base path /api`);
});
