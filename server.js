require("dotenv").config();
const express = require("express");
const { paymentCallback } = require("./toyyibtest");

const app = express();

// ✅ Body parsers — use `verify` to log raw body WITHOUT consuming the stream first
app.use(
  express.urlencoded({
    extended: true,
    type: "*/*",
    verify: (req, res, buf, encoding) => {
      const raw = buf.toString(encoding || "utf8");
      console.log("📋 Content-Type:", req.headers["content-type"]);
      console.log("📦 RAW BODY:", raw);
      req.rawBody = raw;
    },
  })
);
app.use(express.json({ type: "application/json" }));

// ✅ USE YOUR REAL CALLBACK LOGIC
app.post("/payment/callback", paymentCallback);

// Return URL (user redirect only)
app.get("/payment/return", (req, res) => {
  res.send("✅ Payment received! Return to Telegram.");
});

// Health check
app.get("/health", (req, res) => {
  res.send("hello, sihat");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});