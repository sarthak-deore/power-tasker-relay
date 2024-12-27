const mongoose = require("mongoose");

const PubKeySchema = new mongoose.Schema({
  pubkey: { type: String, required: true, unique: true },
  mostRecentCommand: { type: String, default: null },
  signature: { type: String, default: null },
  lastTimestamp: { type: Date, default: Date.now },
});

// Update lastTimestamp whenever the document is updated
PubKeySchema.pre("save", function (next) {
  this.lastTimestamp = Date.now();
  next();
});

module.exports = mongoose.model("PubKey", PubKeySchema);