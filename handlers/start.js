const { mainKeyboard } = require("../keyboard");

function startHandler(bot) {
  // /start command
  bot.command("start", (ctx) => {
    const name = ctx.from?.first_name ?? "there";
    ctx.reply(
      `🖨️ <b>MikuPrint</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hey <b>${name}</b>! Welcome to your campus print service.\n\n` +
      `📄 <b>Print</b> — upload a file & get it printed\n` +
      `💼 <b>Wallet</b> — manage your balance\n\n` +
      `<i>What would you like to do?</i>`,
      {
        parse_mode: "HTML",
        reply_markup: mainKeyboard,
      }
    );
  });

  // "Home" callback — same as /start
  bot.callbackQuery("home", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}
    const name = ctx.from?.first_name ?? "there";
    ctx.reply(
      `🖨️ <b>MikuPrint</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hey <b>${name}</b>! Welcome to your campus print service.\n\n` +
      `📄 <b>Print</b> — upload a file & get it printed\n` +
      `💼 <b>Wallet</b> — manage your balance\n\n` +
      `<i>What would you like to do?</i>`,
      {
        parse_mode: "HTML",
        reply_markup: mainKeyboard,
      }
    );
  });
}

module.exports = startHandler;