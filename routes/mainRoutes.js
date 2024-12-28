const express = require("express");
const router = express.Router();
const { sendCommand, fetchCommand } = require("../controllers/mainController");

router.post("/send-command", sendCommand);
router.post("/fetch-command", fetchCommand);

module.exports = router;
