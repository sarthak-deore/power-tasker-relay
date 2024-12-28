const PubKey = require("../models/pubkey");

const signVerify = require("./signVerify");

//submit command
const sendCommand = async (req, res) => {
  const { pubkey, signature, command } = req.body;

  if (!pubkey || !signature || !command) {
    return res
      .status(400)
      .json({ error: "Public key, signature, and command are required" });
  }

  // valid commands = (shutdown/restart/signout/sleep)

  if (!["shutdown", "restart", "signout", "sleep"].includes(command)) {
    return res.status(400).json({ error: "Invalid command" });
  }

  const pubkeyEntry = await PubKey.findOne({
    pubkey,
  });
  if (!pubkeyEntry) {
    return res.status(404).json({ error: "Public key not found" });
  }

  if (pubkeyEntry.lastTimestamp > Date.now() - 5000) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  const result = signVerify.verifySignature(signature, pubkey, command);

  if (!result) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  pubkeyEntry.mostRecentCommand = command;
  pubkeyEntry.signature = signature;
  await pubkeyEntry.save();
  res.status(200).json({ success: true });
};

//fetch command
const fetchCommand = async (req, res) => {
  const { pubkey, signature, command } = req.body;

  if (!pubkey || !signature || !command) {
    return res
      .status(400)
      .json({ error: "Public key, signature, and command are required" });
  }

  //check if the request command "get" is valid
  if (!["get"].includes(command)) {
    return res.status(400).json({ error: "Invalid command" });
  }

  const pubkeyEntry = await PubKey.findOne({
    pubkey,
  });
  if (!pubkeyEntry) {
    return res.status(404).json({ error: "Public key not found" });
  }

  const result = signVerify.verifySignature(signature, pubkey, command);

  if (!result) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  // Check if command and signature are empty
  if (!pubkeyEntry.mostRecentCommand || !pubkeyEntry.signature) {
    return res.status(204).send("No command available");
  }

  //send command, pubkey, and signature to the client
  res.status(200).json({
    command: pubkeyEntry.mostRecentCommand,
    pubkey: pubkeyEntry.pubkey,
    signature: pubkeyEntry.signature,
  });

  //reset the command and signature for the pubkey
  pubkeyEntry.mostRecentCommand = "";
  pubkeyEntry.signature = "";
  await pubkeyEntry.save();
};

module.exports = { sendCommand, fetchCommand };
