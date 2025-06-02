const express = require("express");
const router = express.Router();

const user = require("../apps/api/userApi");
const auth = require("../apps/api/authApi"); 


const chatbotApi = require('../apps/api/chatbotApi.js'); 

router.use("/auth", auth);
router.use("/user", user);
router.use("/chatbotApi", chatbotApi); 

module.exports = router;
