const express = require("express");
const router = express.Router();
console.log("Memuat Backend/routes/route.js..."); 

const auth = require("../apps/api/authApi"); 
const user = require("../apps/api/userApi");
const chatbotApi = require('../apps/api/chatbotApi.js'); 

if (auth) {
  console.log("Router 'auth' berhasil dimuat dari authApi.js"); 
  router.use("/auth", auth);
} else {
  console.error("GAGAL memuat router 'auth' dari authApi.js!");
}


router.use("/user", user);
router.use("/chatbotApi", chatbotApi); 

module.exports = router;
