const userState = require("../../state");
const {
  homeKeyboard,
  confirmKeyboard,
} = require("../../keyboard");
const supabase = require("../../database/db");
const { InlineKeyboard } = require("grammy");

const PRICE_BW = 0.2;
const PRICE_COLOUR = 0.5;

function confirmHandler(bot) {
  bot.callbackQuery("print_confirm", async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
    } catch (e) {}

    const state = userState.get(ctx.from.id);
    if (!state || !["choose_print_type", "confirm"].includes(state.step)) {
      await ctx.reply(
        `⚠️ No active order found.\n\nTap Home and start a new print job.`,
        { reply_markup: homeKeyboard },
      );
      return;
    }

    const { pages, fileName, preference } = state;
    const pricePerPage = preference === "bw" ? PRICE_BW : PRICE_COLOUR;
    const totalCents = Math.round(pages * pricePerPage * 100);
    const total = totalCents / 100;
    const prefLabel = preference === "bw" ? "🖤 Black & White" : "🎨 Colour";

    // Claim the session before any await so a double-tap can't run this twice.
    // It's restored below if the order doesn't go through.
    userState.delete(ctx.from.id);

    // Charge the wallet and create the job in one DB transaction.
    const { data: result, error } = await supabase.rpc("confirm_print_job", {
      p_telegram_id: ctx.from.id,
      p_file_name: fileName,
      p_file_path: state.storagePath,
      p_page_num: pages,
      p_preference: preference,
      p_total_cents: totalCents,
    });

    if (error) {
      console.error("confirm_print_job error:", error);
      userState.set(ctx.from.id, state);
      await ctx.reply(
        `⚠️ <b>Something went wrong</b>\n\n` +
          `Your order wasn't placed and you were <b>not charged</b>.\n` +
          `Please tap Confirm to try again.`,
        { parse_mode: "HTML", reply_markup: confirmKeyboard },
      );
      return;
    }

    if (!result.ok) {
      userState.set(ctx.from.id, state);

      if (result.reason === "insufficient_balance") {
        const balance = result.balance_cents / 100;
        const shortfall = (total - balance).toFixed(2);
        const topupKeyboard = new InlineKeyboard()
          .text("💸 Top Up Wallet", "topup")
          .row()
          .text("🏠 Home", "home");

        await ctx.reply(
          `❌ <b>Insufficient Balance</b>\n` +
            `━━━━━━━━━━━━━━━━━━━\n\n` +
            `You need a little more credit to print this job.\n\n` +
            `💰 Wallet balance:  <code>RM ${balance.toFixed(2)}</code>\n` +
            `🧾 Print total:     <code>RM ${total.toFixed(2)}</code>\n` +
            `📉 Shortfall:       <code>RM ${shortfall}</code>\n\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `👉 Top up at least <b>RM ${shortfall}</b> to continue.`,
          { parse_mode: "HTML", reply_markup: topupKeyboard },
        );
        return;
      }

      console.error("confirm_print_job rejected:", result);
      await ctx.reply(
        `❌ Could not find your account. Use /start to register.`,
        { reply_markup: homeKeyboard },
      );
      return;
    }

    const confirmedAt =
      new Date().toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " MYT";

    await ctx.reply(
      `🧾 <b>Print Receipt</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `📄 <code>${fileName}</code>\n` +
        `📑 ${pages} pages  ·  ${prefLabel}\n` +
        `💵 RM ${pricePerPage.toFixed(2)} / page\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🧾 Total charged:    <b>RM ${total.toFixed(2)}</b>\n` +
        `💰 Remaining bal:    <b>RM ${(result.balance_cents / 100).toFixed(2)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `🕐 <code>${confirmedAt}</code>\n\n` +
        `✅ <b>Order placed successfully!</b>\n` +
        `<i>We’ll notify you when your print is ready. 🖨️</i>`,
      { parse_mode: "HTML", reply_markup: homeKeyboard },
    );
  });
}

module.exports = confirmHandler;
