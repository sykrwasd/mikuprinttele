const { InlineKeyboard } = require("grammy");

// ── Main menu ────────────────────────────────────────────────
const mainKeyboard = new InlineKeyboard()
  .text("🖨️ Print", "print")
  .text("💼 Wallet", "wallet");

// ── Wallet sub-menu ──────────────────────────────────────────
const walletKeyboard = new InlineKeyboard()
  .text("💸 Top Up", "topup")
  .row()
  .text("🏠 Home", "home");

// ── Shared: single Home button ────────────────────────────────
const homeKeyboard = new InlineKeyboard().text("🏠 Home", "home");

// ── Print: cancel while awaiting upload ──────────────────────
const cancelKeyboard = new InlineKeyboard().text("❌ Cancel", "home");

// ── Print: choose B&W or Colour ──────────────────────────────
const printKeyboard = new InlineKeyboard()
  .text("🖤 Black & White  RM 0.20/pg", "print_bw")
  .row()
  .text("🎨 Colour  RM 0.50/pg", "print_colour")
  .row()
  .text("🏠 Home", "home");

// ── After choosing preference: change or go home ─────────────
const changeKeyboard = new InlineKeyboard()
  .text("🔄 Change Preference", "print_change")
  .row()
  .text("🏠 Home", "home");

// ── Confirm print job ─────────────────────────────────────────
const confirmKeyboard = new InlineKeyboard()
  .text("✅ Confirm", "print_confirm")
  .row()
  .text("🔄 Change Preference", "print_change")
  .row()
  .text("❌ Cancel", "home");

const topupKeyboard = new InlineKeyboard()
  .text("💵 RM 10.00", "ten")
  .text("💵 RM 5.00", "five")
  .row()
  .text("❌ Cancel", "home");

module.exports = {
  mainKeyboard,
  walletKeyboard,
  homeKeyboard,
  cancelKeyboard,
  printKeyboard,
  changeKeyboard,
  confirmKeyboard,
  topupKeyboard
};
