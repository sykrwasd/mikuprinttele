function printHandler(bot) {
  bot.callbackQuery("print", (ctx) => {
    ctx.reply("🖨️ Print selected");
  });
}

module.exports = printHandler;