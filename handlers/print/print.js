const userState = require("../../state");
const { cancelKeyboard } = require("../../keyboard");

function printHandler(bot) {
  bot.callbackQuery("print", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}

    const state = userState.get(ctx.from.id) || {};
    userState.set(ctx.from.id, { ...state, step: "awaiting_upload" });
    

    ctx.reply(
      `🖨️ <b>Print a File</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 <b>Pricing</b>\n` +
      `  🖤 Black &amp; White   <code>RM 0.20</code> / page\n` +
      `  🎨 Colour          <code>RM 0.50</code> / page\n\n` +
      `📎 Upload your PDF file below to get started.\n` +
      `<i>⚠️ Only .pdf files are accepted.</i>`,
      {
        parse_mode: "HTML",
        reply_markup: cancelKeyboard,
      }
    );
  });
}

module.exports = printHandler;