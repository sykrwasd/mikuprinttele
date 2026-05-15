function walletHandler(bot) {
  bot.callbackQuery("wallet", (ctx) => {
    ctx.reply("💰 Wallet selected");
  });
}

module.exports = walletHandler;