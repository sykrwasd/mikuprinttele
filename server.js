require("dotenv").config();
const express = require("express");

const app = express();

// Debug middleware (put this FIRST)
app.use((req, res, next) => {
  console.log("Headers:", req.headers);
  next();
});

// Parse form-urlencoded (ToyyibPay usually sends this)
app.use(express.urlencoded({ extended: true }));

// Parse JSON just in case
app.use(express.json());

app.post("/payment/callback", (req, res) => {
  console.log("BODY:", req.body);

  res.status(200).send("OK");
});

app.get("/payment/return", (req, res) => {
  res.send("✅ Payment received! Return to Telegram.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});