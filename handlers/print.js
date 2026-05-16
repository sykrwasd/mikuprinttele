function printHandler(bot) {
  bot.callbackQuery("print", (ctx) => {
    ctx.answerCallbackQuery();
    ctx.reply(
      `🖨️ <b>Print a File</b>\n\n` +
      `Send your file and we'll handle the rest.\n\n` +
      `<b>Accepted formats:</b> PDF, DOCX, JPG, PNG\n\n` +
      `<b>Pricing:</b>\n` +
      `• B&W — <code>RM 0.40</code> / page\n` +
      `• Colour — <code>RM 0.60</code> / page\n\n` +
      `<i>Upload your file below ⬇️</i>`,
      { parse_mode: "HTML" }
    );
  });
}

module.exports = printHandler;