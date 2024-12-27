const express = require("express");
const router = express.Router();
const { sendRequest, fetchResponse } = require("../controllers/mainController");

router.post("/send-request", sendRequest);
router.get("/fetch-response/:pubkey", fetchResponse);

module.exports = router;
