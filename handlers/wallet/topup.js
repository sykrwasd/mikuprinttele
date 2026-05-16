const { homeKeyboard } = require("../../keyboard");

function topupHandler(bot) {
  bot.callbackQuery("topup", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}
    ctx.reply(
      `💸 <b>Top Up Wallet</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `Send the amount you'd like to add (in RM).\n\n` +
      `<b>Pricing reminder:</b>\n` +
      `• B&W — <code>RM 0.40</code> / page\n` +
      `• Colour — <code>RM 0.60</code> / page\n\n` +
      `<i>Reply with a number, e.g. <code>5.00</code></i>`,
      {
        parse_mode: "HTML",
        reply_markup: homeKeyboard,
      }
    );
  });
}

module.exports = topupHandler;