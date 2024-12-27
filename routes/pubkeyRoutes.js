const express = require("express");
const { registerPubKey } = require("../controllers/pubkeyController");

const router = express.Router();

// Register a public key
router.post("/register", registerPubKey);

router.get("/recaptcha-site-key", (req, res) => {
  res.json({ siteKey: process.env.RECAPTCHA_SITE_KEY });
});

module.exports = router;
