require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const routes = require('./routes/route') 

app.use(cors({}));
app.use(express.json());


app.use('/api', routes); 

app.get('/', (req, res) => {
    res.send('Welcome to the API root! Actual endpoints are likely under /api');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000, API base path /api');
})
