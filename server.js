require("dotenv").config();
const express = require("express");
const { paymentCallback } = require("./toyyibtest");

const app = express();

// Debug middleware
app.use((req, res, next) => {
  console.log("Headers:", req.headers);
  next();
});

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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