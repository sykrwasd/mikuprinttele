const { mainKeyboard } = require("../keyboard");

function startHandler(bot) {
  bot.command("start", (ctx) => {
    const name = ctx.from?.first_name ?? "there";
    ctx.reply(
      `🖨️ <b>MikuPrint</b>\n\n` +
      `Hey <b>${name}</b>, welcome to your campus print service.\n\n` +
      `📄 Upload a file → get it printed\n` +
      `💰 Top up your wallet to pay for prints\n\n` +
      `<i>What would you like to do?</i>`,
      {
        parse_mode: "HTML",
        reply_markup: mainKeyboard,
      }
    );
  });
}

module.exports = startHandler;