const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router
    .post('/login', authController.login)
    .get('/logout', authController.logout)
    .post('/reset-password', authController.resetPassword)
    .post('/register', authController.register);

module.exports = router;
