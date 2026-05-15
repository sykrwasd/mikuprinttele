const { mainKeyboard } = require("../keyboard");

function startHandler(bot) {
  bot.command("start", (ctx) => {
    ctx.reply("Choose option:", {
      reply_markup: mainKeyboard,
    });
  });
}

module.exports = startHandler;