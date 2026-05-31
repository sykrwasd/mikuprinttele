require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { paymentCallback } = require("./toyyib");

const app = express();

// Parse multipart/form-data (what ToyyibPay actually sends)
const upload = multer();

// Also support urlencoded just in case
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ USE YOUR REAL CALLBACK LOGIC — multer().none() parses multipart fields (no files)
app.post("/payment/callback", upload.none(), paymentCallback);

// Return URL (user redirect after payment)
app.get("/payment/return", async (req, res) => {
  console.log("RETURN URL HIT");
  console.log(req.query);

  const { status_id, billcode, order_id, msg, transaction_id } = req.query;

  // status_id "1" = success, anything else = failed
  const isSuccess = status_id === "1";

  // Extract telegramId and amount from order_id (format: wallet_<telegramId>_<amount>_<timestamp>)
  let telegramId = null;
  let amountRM = null;
  if (order_id) {
    const parts = order_id.split("_");
    telegramId = parts[1];
    amountRM = parts[2];
  }

  // Notify user on Telegram
  if (telegramId && process.env.TELEGRAM_BOT_TOKEN) {
    const message = isSuccess
      ? `✅ *Payment Successful!*\n\nYour wallet has been topped up with *RM${amountRM}*.\n\n🧾 Ref: \`${billcode}\`\n\nYou can now use your balance to print!`
      : `❌ *Payment Failed*\n\nYour payment of RM${amountRM} was not completed.\n\nPlease try again from the bot.\n\n🧾 Ref: \`${billcode}\``;

    const keyboard = isSuccess
      ? {
          inline_keyboard: [
            [{ text: "💰 Check Balance", callback_data: "checkbal" }],
            [{ text: "🏠 Main Menu", callback_data: "home" }],
          ],
        }
      : {
          inline_keyboard: [
            [{ text: "🔄 Try Again", callback_data: "topup" }],
            [{ text: "🏠 Main Menu", callback_data: "home" }],
          ],
        };

    try {
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramId,
            text: message,
            parse_mode: "Markdown",
            reply_markup: keyboard,
          }),
        }
      );
    } catch (err) {
      console.error("Failed to send Telegram notification:", err);
    }
  }

  // Serve HTML page
  const html = isSuccess
    ? `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Successful – MikuPrint</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
      font-family: 'Inter', sans-serif;
      padding: 24px;
    }
    .card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 48px 40px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 32px 64px rgba(0,0,0,0.4);
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .icon-wrapper {
      width: 88px; height: 88px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00c896, #00e676);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 28px;
      box-shadow: 0 0 40px rgba(0, 200, 150, 0.45);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 40px rgba(0, 200, 150, 0.45); }
      50%       { box-shadow: 0 0 60px rgba(0, 200, 150, 0.75); }
    }
    .icon-wrapper svg { width: 44px; height: 44px; }
    h1 {
      font-size: 26px; font-weight: 800;
      color: #ffffff; margin-bottom: 10px;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 15px; color: rgba(255,255,255,0.55);
      line-height: 1.6; margin-bottom: 28px;
    }
    .badge {
      display: inline-block;
      background: rgba(0, 200, 150, 0.15);
      border: 1px solid rgba(0, 200, 150, 0.4);
      color: #00e676;
      border-radius: 50px;
      padding: 6px 18px;
      font-size: 13px; font-weight: 600;
      margin-bottom: 28px;
      letter-spacing: 0.5px;
    }
    .details {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 32px;
      text-align: left;
    }
    .details p {
      font-size: 13px; color: rgba(255,255,255,0.45);
      margin-bottom: 6px;
    }
    .details p:last-child { margin-bottom: 0; }
    .details span { color: rgba(255,255,255,0.8); font-weight: 600; }
    .close-note {
      font-size: 13px;
      color: rgba(255,255,255,0.35);
      line-height: 1.5;
    }
    .close-note strong { color: rgba(255,255,255,0.55); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h1>Payment Successful!</h1>
    <p class="subtitle">Your wallet has been topped up. You're all set to start printing.</p>
    <div class="badge">✓ RM${amountRM || "—"} Added</div>
    <div class="details">
      ${billcode ? `<p>Bill Code &nbsp;<span>${billcode}</span></p>` : ""}
      ${transaction_id ? `<p>Transaction &nbsp;<span>${transaction_id}</span></p>` : ""}
    </div>
    <p class="close-note">You've been notified in <strong>Telegram</strong>.<br/>You can close this page now.</p>
  </div>
</body>
</html>`
    : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Failed – MikuPrint</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
      font-family: 'Inter', sans-serif;
      padding: 24px;
    }
    .card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 48px 40px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 32px 64px rgba(0,0,0,0.4);
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .icon-wrapper {
      width: 88px; height: 88px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff4757, #ff6b81);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 28px;
      box-shadow: 0 0 40px rgba(255, 71, 87, 0.45);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 40px rgba(255, 71, 87, 0.45); }
      50%       { box-shadow: 0 0 60px rgba(255, 71, 87, 0.75); }
    }
    .icon-wrapper svg { width: 44px; height: 44px; }
    h1 {
      font-size: 26px; font-weight: 800;
      color: #ffffff; margin-bottom: 10px;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 15px; color: rgba(255,255,255,0.55);
      line-height: 1.6; margin-bottom: 28px;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 71, 87, 0.15);
      border: 1px solid rgba(255, 71, 87, 0.4);
      color: #ff6b81;
      border-radius: 50px;
      padding: 6px 18px;
      font-size: 13px; font-weight: 600;
      margin-bottom: 28px;
      letter-spacing: 0.5px;
    }
    .details {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 32px;
      text-align: left;
    }
    .details p {
      font-size: 13px; color: rgba(255,255,255,0.45);
      margin-bottom: 6px;
    }
    .details p:last-child { margin-bottom: 0; }
    .details span { color: rgba(255,255,255,0.8); font-weight: 600; }
    .close-note {
      font-size: 13px;
      color: rgba(255,255,255,0.35);
      line-height: 1.5;
    }
    .close-note strong { color: rgba(255,255,255,0.55); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </div>
    <h1>Payment Failed</h1>
    <p class="subtitle">Your payment could not be completed. Please try again from the bot.</p>
    <div class="badge">✕ Payment Not Completed</div>
    <div class="details">
      ${billcode ? `<p>Bill Code &nbsp;<span>${billcode}</span></p>` : ""}
      ${msg ? `<p>Reason &nbsp;<span>${msg}</span></p>` : ""}
    </div>
    <p class="close-note">Go back to <strong>Telegram</strong> and tap Top Up again.<br/>You can close this page now.</p>
  </div>
</body>
</html>`;

  res.send(html);
});

// Health check
app.get("/health", (req, res) => {
  res.send("hello, sihat");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});