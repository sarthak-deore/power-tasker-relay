const express = require("express");
const router = express.Router();
const {
  sendCommand,
  fetchCommand,
  getLastFetched,
} = require("../controllers/mainController");

router.post("/send-command", sendCommand);
router.post("/fetch-command", fetchCommand);
router.post("/last-active", getLastFetched);

module.exports = router;
