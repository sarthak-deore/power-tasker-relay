const PubKey = require("../models/pubkey");
const axios = require("axios");

const registerPubKey = async (req, res) => {
  const { pubkey, captchaToken } = req.body;

  if (!pubkey || !captchaToken) {
    return res
      .status(400)
      .json({ error: "Public key and CAPTCHA token are required" });
  }

  try {
    // Verify CAPTCHA
    const captchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    if (!captchaResponse.data.success) {
      return res.status(400).json({ error: "Invalid CAPTCHA" });
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

    res
      .status(200)
      .json({ message: "Public key registered successfully", pubkey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { registerPubKey };
