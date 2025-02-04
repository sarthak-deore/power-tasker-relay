const PubKey = require("../models/pubkey");
const axios = require("axios");

const registerPubKey = async (req, res) => {
  const { pubkey, captchaToken } = req.body;

  if (!pubkey || !captchaToken) {
    return res
      .status(400)
      .json({ error: "Public key and CAPTCHA token are required" });
  }

  // validate public key
  if (pubkey.length !== 130 || !pubkey.startsWith("04")) {
    return res.status(400).json({ error: "Invalid public key format" });
  }

  try {
    // verify turnstile token
    const turnstileResponse = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: captchaToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!turnstileResponse.data.success) {
      return res.status(400).json({ error: "Invalid challenge token" });
    }

    // add key or warn already registered
    let pubkeyEntry = await PubKey.findOne({ pubkey });
    if (!pubkeyEntry) {
      pubkeyEntry = new PubKey({ pubkey });
      await pubkeyEntry.save();
    } else {
      return res
        .status(409)
        .json({ error: "Public key is already registered" });
    }

    res.status(200).json({ message: "Public key registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { registerPubKey };
