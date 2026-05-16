const { walletKeyboard } = require("../../keyboard");

function walletHandler(bot) {
  bot.callbackQuery("wallet", (ctx) => {
    ctx.answerCallbackQuery();
    ctx.reply(
      `💼 <b>Wallet</b>\n\n` +
      `Manage your MikuPrint balance here.\n\n` +
      `• <b>Check Balance</b> — view your current credits\n` +
      `• <b>Topup</b> — add funds to your account`,
      {
        parse_mode: "HTML",
        reply_markup: walletKeyboard,
      }
    );
  });
}

module.exports = walletHandler;