require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { paymentCallback } = require("./toyyibtest");

const app = express();

// Parse multipart/form-data (what ToyyibPay actually sends)
const upload = multer();

// Also support urlencoded just in case
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ USE YOUR REAL CALLBACK LOGIC — multer().none() parses multipart fields (no files)
app.post("/payment/callback", upload.none(), paymentCallback);

// Return URL (user redirect only)
app.get("/payment/return", (req, res) => {

  const data = req.body

  res.send(data);
});

// Health check
app.get("/health", (req, res) => {
  res.send("hello, sihat");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});