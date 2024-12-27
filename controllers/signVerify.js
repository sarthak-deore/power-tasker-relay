const { ec } = require("elliptic");
const crypto = require("crypto");

const verifySignature = (signatureHex, pubkeyHex, command) => {
  try {
    const ecdsa = new ec("secp256k1");

    if (!pubkeyHex.startsWith("04")) {
      throw new Error(
        "Public key must be in uncompressed format (starts with '04')."
      );
    }

    const messageHash = crypto
      .createHash("sha256")
      .update(command, "utf8")
      .digest();

    const key = ecdsa.keyFromPublic(pubkeyHex, "hex");

    if (signatureHex.length !== 128) {
      throw new Error("Signature must be 64 bytes (128 hex characters).");
    }
    const r = signatureHex.slice(0, 64);
    const s = signatureHex.slice(64);

    // Verify the signature
    const isValid = key.verify(messageHash, { r, s });
    return isValid;
  } catch (err) {
    console.error(`Error verifying signature: ${err.message}`);
    return false;
  }
};

module.exports = { verifySignature };
