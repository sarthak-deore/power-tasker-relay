const mongoose = require("mongoose");

const PubKeySchema = new mongoose.Schema({
  pubkey: { type: String, required: true, unique: true },
  mostRecentCommand: { type: String, default: "" },
  signature: { type: String, default: "" },
  lastTimestamp: { type: Date, default: Date.now },
  lastfetched: { type: String, default: "" },
});

// update lastTimestamp before saving
PubKeySchema.pre("save", function (next) {
  this.lastTimestamp = Date.now();
  next();
});

module.exports = mongoose.model("PubKey", PubKeySchema);
