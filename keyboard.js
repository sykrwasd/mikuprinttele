const { InlineKeyboard } = require("grammy");

const mainKeyboard = new InlineKeyboard()
  .text("💰 Wallet", "wallet")
  .text("🖨️ Print", "print");

module.exports = { mainKeyboard };