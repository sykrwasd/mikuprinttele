const { InlineKeyboard } = require("grammy");

// ── Main menu ────────────────────────────────────────────────
const mainKeyboard = new InlineKeyboard()
  .text("🖨️ Print", "print")
  .text("💼 Wallet", "wallet");

// ── Wallet sub-menu ──────────────────────────────────────────
const walletKeyboard = new InlineKeyboard()
  .text("💰 Check Balance", "checkbal")
  .text("💸 Top Up", "topup")
  .row()
  .text("🏠 Home", "home");

// ── Shared: single Home button ────────────────────────────────
const homeKeyboard = new InlineKeyboard().text("🏠 Home", "home");

// ── Print: cancel while awaiting upload ──────────────────────
const cancelKeyboard = new InlineKeyboard().text("❌ Cancel", "home");

module.exports = { mainKeyboard, walletKeyboard, homeKeyboard, cancelKeyboard };
