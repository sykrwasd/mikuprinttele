function topupHandler(bot) {
  bot.callbackQuery("topup", (ctx) => {
    ctx.answerCallbackQuery();
    ctx.reply(
      `💸 <b>Top Up Wallet</b>\n\n` +
      `Send the amount you'd like to add (in RM).\n\n` +
      `<b>Pricing reminder:</b>\n` +
      `• B&W — RM 0.40 / page\n` +
      `• Colour — RM 0.60 / page\n\n` +
      `<i>Reply with a number, e.g. <code>5.00</code></i>`,
      { parse_mode: "HTML" }
    );
  });
}

module.exports = topupHandler;