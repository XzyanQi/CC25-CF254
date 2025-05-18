const express = require('express');
const router = express.Router();

const user  = require('../apps/api/userApi')
const auth = require('../apps/api/authApi')

router.use('/auth', auth);
router.use('/user', user);
module.exports = router;