const userState = require("../../state");
const { changeKeyboard, printKeyboard, homeKeyboard } = require("../../keyboard");

// Pricing constants
const PRICE_BW = 0.20;
const PRICE_COLOUR = 0.50;

function formatTotal(pages, pricePerPage) {
  return (pages * pricePerPage).toFixed(2);
}

function printTypeHandler(bot) {

  // ── Black & White ─────────────────────────────────────────
  bot.callbackQuery("print_bw", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}

    const state = userState.get(ctx.from.id);
    if (!state || state.step !== "choose_print_type") return;

    const { pages, fileName } = state;
    const total = formatTotal(pages, PRICE_BW);

    // Update state to reflect chosen preference
    userState.set(ctx.from.id, { ...state, preference: "bw" });

    await ctx.reply(
      `🖤 <b>Black & White Selected</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📄 File: <code>${fileName}</code>\n` +
      `📑 Pages: <b>${pages}</b>\n` +
      `💵 Price per page: <code>RM ${PRICE_BW.toFixed(2)}</code>\n\n` +
      `🧾 <b>Estimated Total: RM ${total}</b>\n\n` +
      `<i>Your print job has been queued!\n` +
      `We'll notify you when it's ready.</i>`,
      { parse_mode: "HTML", reply_markup: changeKeyboard }
    );
  });

  // ── Colour ────────────────────────────────────────────────
  bot.callbackQuery("print_colour", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}

    const state = userState.get(ctx.from.id);
    if (!state || state.step !== "choose_print_type") return;

    const { pages, fileName } = state;
    const total = formatTotal(pages, PRICE_COLOUR);

    // Update state to reflect chosen preference
    userState.set(ctx.from.id, { ...state, preference: "colour" });

    await ctx.reply(
      `🎨 <b>Colour Selected</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📄 File: <code>${fileName}</code>\n` +
      `📑 Pages: <b>${pages}</b>\n` +
      `💵 Price per page: <code>RM ${PRICE_COLOUR.toFixed(2)}</code>\n\n` +
      `🧾 <b>Estimated Total: RM ${total}</b>\n\n` +
      `<i>Your print job has been queued!\n` +
      `We'll notify you when it's ready.</i>`,
      { parse_mode: "HTML", reply_markup: changeKeyboard }
    );
  });

  // ── Change Preference ─────────────────────────────────────
  bot.callbackQuery("print_change", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}

    const state = userState.get(ctx.from.id);
    if (!state || state.step !== "choose_print_type") {
      await ctx.reply(
        `⚠️ No active print job found.\n\nUse /start to begin a new one.`,
        { reply_markup: homeKeyboard }
      );
      return;
    }

    const { pages, fileName } = state;

    await ctx.reply(
      `🔄 <b>Change Preference</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📄 File: <code>${fileName}</code>\n` +
      `📑 Pages: <b>${pages}</b>\n\n` +
      `Choose your new print preference below:`,
      { parse_mode: "HTML", reply_markup: printKeyboard }
    );
  });

}

module.exports = printTypeHandler;
