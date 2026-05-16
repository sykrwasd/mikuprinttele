function checkBalHandler(bot) {
  bot.callbackQuery("checkbal", (ctx) => {
    ctx.answerCallbackQuery();
    ctx.reply(
      `💰 <b>Your Balance</b>\n\n` +
      `┌─────────────────┐\n` +
      `│  <b>RM 0.00</b>          │\n` +
      `└─────────────────┘\n\n` +
      `<i>Top up to start printing!</i>`,
      { parse_mode: "HTML" }
    );
  });
}

module.exports = checkBalHandler;