const userState = require("../../state");
const { confirmKeyboard, printKeyboard, homeKeyboard } = require("../../keyboard");
const supabase = require("../../database/db")

// Pricing constants
const PRICE_BW = 0.20;
const PRICE_COLOUR = 0.50;

function formatTotal(pages, pricePerPage) {
  return (pages * pricePerPage).toFixed(2);
}

async function getUser_Wallet(ctx) {
  const telegramId = ctx.from.id;

  const { data: userid, error } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  //console.log(userid);

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userid.id)
    .single();

  //console.log(wallet);

  if (error) throw error;

  return wallet;
}


function printTypeHandler(bot) {

  // ── Black & White ─────────────────────────────────────────
  bot.callbackQuery("print_bw", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}

    const state = userState.get(ctx.from.id);
    if (!state || state.step !== "choose_print_type") return;

    const { pages, fileName } = state;
    const total = formatTotal(pages, PRICE_BW);

    // Update state → step confirm
    userState.set(ctx.from.id, { ...state,  preference: "bw" });

    console.log("crrent state",userState)

    const wallet = await getUser_Wallet(ctx);
    const balanceCents = wallet?.balance_cents ?? 0;
    const balance = balanceCents / 100;


    await ctx.reply(
      `📝 <b>Order Summary</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📄 <code>${fileName}</code>\n` +
      `📑 ${pages} pages  ·  🖤 Black &amp; White\n\n` +
      `💵 RM ${PRICE_BW.toFixed(2)} × ${pages} pages = <b>RM ${total}</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Wallet balance:   <b>RM ${balance.toFixed(2)}</b>\n` +
      `🧾 Estimated total:  <b>RM ${total}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `Ready to print? Tap <b>Confirm</b> ⬇️`,
      { parse_mode: "HTML", reply_markup: confirmKeyboard }
    );
  });

  // ── Colour ────────────────────────────────────────────────
  bot.callbackQuery("print_colour", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}

    const state = userState.get(ctx.from.id);
    if (!state || state.step !== "choose_print_type") return;

    const { pages, fileName } = state;
    const total = formatTotal(pages, PRICE_COLOUR);

    // Update state → step confirm
    userState.set(ctx.from.id, { ...state,  preference: "colour" });

    await ctx.reply(
      `📝 <b>Order Summary</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📄 <code>${fileName}</code>\n` +
      `📑 ${pages} pages  ·  🎨 Colour\n\n` +
      `💵 RM ${PRICE_COLOUR.toFixed(2)} × ${pages} pages = <b>RM ${total}</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 Estimated total:  <b>RM ${total}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `Ready to print? Tap <b>Confirm</b> ⬇️`,
      { parse_mode: "HTML", reply_markup: confirmKeyboard }
    );
  });

  bot.callbackQuery("print_change", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}

    const state = userState.get(ctx.from.id);
    if (!state || state.step !== "choose_print_type") {
      await ctx.reply(
        `⚠️ No active print job found.\n\nStart a new one with /start or tap Home below.`,
        { reply_markup: homeKeyboard }
      );
      return;
    }

    const { pages, fileName } = state;

    await ctx.reply(
      `🔄 <b>Change Preference</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `📄 <code>${fileName}</code>\n` +
      `📑 ${pages} pages\n\n` +
      `Choose your print preference below:`,
      { parse_mode: "HTML", reply_markup: printKeyboard }
    );
  });

}

module.exports = printTypeHandler;
