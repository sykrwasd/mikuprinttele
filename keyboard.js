const { InlineKeyboard } = require("grammy");

const mainKeyboard = new InlineKeyboard()
  .text("💰 Wallet", "wallet")
  .text("🖨️ Print", "print");

const walletKeyboard = new InlineKeyboard()
  .text("Check Balance", "checkbal")
  .text("Topup", "topup");

module.exports = { mainKeyboard,walletKeyboard };
