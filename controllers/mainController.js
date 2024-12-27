const PubKey = require("../models/pubkey");

const signVerify = require("./signVerify");

//submit commands

const sendRequest = async (req, res) => {
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

//fetch commands

const fetchResponse = async (req, res) => {
  const { pubkey } = req.params;

  if (!pubkey) {
    return res.status(400).json({ error: "Public key is required" });
  }

  const pubkeyEntry = await PubKey.findOne({
    pubkey,
  });
  if (!pubkeyEntry) {
    return res.status(404).json({ error: "Public key not found" });
  }

  //send command, pubkey, and signature to the client
  res.status(200).json({
    command: pubkeyEntry.mostRecentCommand,
    pubkey: pubkeyEntry.pubkey,
    signature: pubkeyEntry.signature,
  });
};

module.exports = { sendRequest, fetchResponse };
