const userState = require("../../state");
const { cancelKeyboard } = require("../../keyboard");

function printHandler(bot) {
  bot.callbackQuery("print", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}

    userState.set(ctx.from.id, "awaiting_upload");

    ctx.reply(
      `🖨️ <b>Print a File</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `<b>Pricing:</b>\n` +
      `• B&W — <code>RM 0.20</code> / page\n` +
      `• Colour — <code>RM 0.50</code> / page\n\n` +
      `📎 Please upload your <b>PDF file</b> below.\n` +
      `<i>Only .pdf files are accepted.</i>`,
      {
        parse_mode: "HTML",
        reply_markup: cancelKeyboard,
      }
    );
  });
}

module.exports = printHandler;