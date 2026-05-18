const userState = require("../../state");
const { homeKeyboard } = require("../../keyboard");
const supabase = require("../../database/db");

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
        `⚠️ No active order found.\n\nUse /start to begin a new one.`,
        { reply_markup: homeKeyboard },
      );
      return;
    }

    const { pages, fileName, preference, username, updatedAt } = state;
    const pricePerPage = preference === "bw" ? PRICE_BW : PRICE_COLOUR;
    const total = (pages * pricePerPage).toFixed(2);
    const prefLabel = preference === "bw" ? "🖤 Black & White" : "🎨 Colour";
    const orderId = `ORD-${Date.now()}`;
    const confirmedAt =
      new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

    userState.set(ctx.from.id, { ...state, total_price: total });

    console.log("FINAL STATE", userState);

    const { data, error } = await supabase.from("print").insert([
      {
        username: state.username,
        file_name: state.fileName,
        file_path: state.storagePath,
        page_num: state.pages,
        preference: state.preference,
        total_price: total,
      },
    ]);

    if (error) {
      console.error("DB ERROR:", error);
    }

    // Clear state — order is now placed
    userState.delete(ctx.from.id);

    await ctx.reply(
      `🧾 <b>PRINT RECEIPT</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `🪪 Order ID: <code>${orderId}</code>\n` +
        `👤 User: <b>@${username ?? "unknown"}</b>\n` +
        `🕐 Time: <code>${confirmedAt}</code>\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `<b>ORDER DETAILS</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `📄 File: <code>${fileName}</code>\n` +
        `📑 Pages: <b>${pages}</b>\n` +
        `🖼️ Type: <b>${prefLabel}</b>\n` +
        `💵 Price/page: <code>RM ${pricePerPage.toFixed(2)}</code>\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🧾 <b>TOTAL: RM ${total}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ <b>Order confirmed!</b>\n` +
        `<i>We'll notify you when your print job is ready.</i>`,
      { parse_mode: "HTML", reply_markup: homeKeyboard },
    );
  });
}

module.exports = confirmHandler;
