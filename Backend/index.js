require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const routes = require('./routes/route')


app.use(cors({}));
app.use(express.json());
app.use('/', routes);
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})