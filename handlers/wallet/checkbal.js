const { homeKeyboard } = require("../../keyboard");

function checkBalHandler(bot) {
  bot.callbackQuery("checkbal", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}
    ctx.reply(
      `💰 <b>Your Balance</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `┌──────────────────┐\n` +
      `│  Balance: <b>RM 0.00</b>  │\n` +
      `└──────────────────┘\n\n` +
      `<i>Top up your wallet to start printing!</i>`,
      {
        parse_mode: "HTML",
        reply_markup: homeKeyboard,
      }
    );
  });
}

module.exports = checkBalHandler;