const PubKey = require("../models/pubkey");
const signVerify = require("./signVerify");

// validate timestamp
const isTimestampValid = (timestampStr) => {
  if (!/^\d{14}$/.test(timestampStr)) return false;
  const year = parseInt(timestampStr.substring(0, 4));
  const month = parseInt(timestampStr.substring(4, 6)) - 1;
  const day = parseInt(timestampStr.substring(6, 8));
  const hour = parseInt(timestampStr.substring(8, 10));
  const minute = parseInt(timestampStr.substring(10, 12));
  const second = parseInt(timestampStr.substring(12, 14));

  const timestampDate = new Date(
    Date.UTC(year, month, day, hour, minute, second)
  );

  if (isNaN(timestampDate.getTime())) return false;

  // current UTC timestamp in milliseconds
  const currentTimeUTC = Date.now();
  const timeDiff = Math.abs(currentTimeUTC - timestampDate.getTime());
  const twoMinutesInMs = 2 * 60 * 1000;

  return timeDiff <= twoMinutesInMs;
};

// split command and timestamp
const parseCommand = (commandStr) => {
  const parts = commandStr.split("+");
  if (parts.length !== 2) return null;

  return {
    action: parts[0],
    timestamp: parts[1],
  };
};

// get last fetched
const getLastFetched = async (req, res) => {
  const { pubkey } = req.body;

  if (!pubkey) {
    return res.status(400).json({ error: "Public key is required" });
  }

  const pubkeyEntry = await PubKey.findOne({
    pubkey,
  });
  if (!pubkeyEntry) {
    return res.status(404).json({ error: "Public key not found" });
  }

  res.status(200).json({ lastfetched: pubkeyEntry.lastfetched });
};

// send command
const sendCommand = async (req, res) => {
  const { pubkey, signature, command } = req.body;

  if (!pubkey || !signature || !command) {
    return res
      .status(400)
      .json({ error: "Public key, signature, and command are required" });
  }

  const parsedCommand = parseCommand(command);
  if (!parsedCommand) {
    return res.status(400).json({ error: "Invalid command format" });
  }
  if (
    !["shutdown", "restart", "signout", "sleep"].includes(parsedCommand.action)
  ) {
    return res.status(400).json({ error: "Invalid command" });
  }

  // validate timestamp
  if (!isTimestampValid(parsedCommand.timestamp)) {
    return res
      .status(400)
      .json({ error: "Command timestamp is invalid or expired" });
  }

  const pubkeyEntry = await PubKey.findOne({
    pubkey,
  });
  if (!pubkeyEntry) {
    return res.status(404).json({ error: "Public key not found" });
  }

  if (pubkeyEntry.lastTimestamp > Date.now() - 500) {
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

// fetch command
const fetchCommand = async (req, res) => {
  const { pubkey, signature, command } = req.body;

  if (!pubkey || !signature || !command) {
    return res
      .status(400)
      .json({ error: "Public key, signature, and command are required" });
  }

  const parsedCommand = parseCommand(command);
  if (!parsedCommand) {
    return res.status(400).json({ error: "Invalid command format" });
  }

  if (!["get"].includes(parsedCommand.action)) {
    return res.status(400).json({ error: "Invalid command" });
  }

  // validate request timestamp
  if (!isTimestampValid(parsedCommand.timestamp)) {
    return res
      .status(400)
      .json({ error: "Request timestamp is invalid or expired" });
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

  // check if stored command and signature are empty
  if (!pubkeyEntry.mostRecentCommand || !pubkeyEntry.signature) {
    pubkeyEntry.lastfetched = parsedCommand.timestamp;
    await pubkeyEntry.save();
    return res.status(204).send("No command available");
  }

  // check stored command timestamp
  const storedCommand = parseCommand(pubkeyEntry.mostRecentCommand);
  if (!storedCommand || !isTimestampValid(storedCommand.timestamp)) {
    // reset if expired command
    pubkeyEntry.mostRecentCommand = "";
    pubkeyEntry.signature = "";
    pubkeyEntry.lastfetched = parsedCommand.timestamp;
    await pubkeyEntry.save();
    return res.status(204).send("No valid command available");
  }

  // send command, pubkey, and signature to the client
  res.status(200).json({
    command: pubkeyEntry.mostRecentCommand,
    pubkey: pubkeyEntry.pubkey,
    signature: pubkeyEntry.signature,
  });

  // reset the command and signature for the pubkey
  pubkeyEntry.mostRecentCommand = "";
  pubkeyEntry.signature = "";
  pubkeyEntry.lastfetched = parsedCommand.timestamp;
  await pubkeyEntry.save();
};

module.exports = { sendCommand, fetchCommand, getLastFetched };
