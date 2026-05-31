const userState = require("../../state");
const { homeKeyboard, walletKeyboard } = require("../../keyboard");
const supabase = require("../../database/db");
const { InlineKeyboard } = require("grammy");

const PRICE_BW = 0.2;
const PRICE_COLOUR = 0.5;

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

    const { pages, fileName, preference, username, updatedAt } = state;
    const pricePerPage = preference === "bw" ? PRICE_BW : PRICE_COLOUR;
    const total = parseFloat((pages * pricePerPage).toFixed(2));
    const prefLabel = preference === "bw" ? "🖤 Black & White" : "🎨 Colour";
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

    userState.set(ctx.from.id, { ...state, total_price: total });

    const wallet = await getUser_Wallet(ctx);
    const balanceCents = wallet?.balance_cents ?? 0;
    const balance = balanceCents / 100;

    //console.log("balance (RM)", balance, "| required (RM)", total);

    if (balance < total) {
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

    const { data, error } = await supabase.from("print").insert([
      {
        user_id: state.userid,
        file_name: state.fileName,
        file_path: state.storagePath,
        page_num: state.pages,
        preference: state.preference,
        total_price: total,
      },
    ]);

    if (error) {
      console.error("DB ERROR:", error);
    } else {
      // Deduct print cost from wallet
      const newBalanceCents = balanceCents - Math.round(total * 100);
      const { error: deductError } = await supabase
        .from("wallets")
        .update({ balance_cents: newBalanceCents })
        .eq("id", wallet.id);

      if (deductError) {
        console.error("Wallet deduct error:", deductError);
      }
    }

    userState.delete(ctx.from.id);

    await ctx.reply(
      `🧾 <b>Print Receipt</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `📄 <code>${fileName}</code>\n` +
        `📑 ${pages} pages  ·  ${prefLabel}\n` +
        `💵 RM ${pricePerPage.toFixed(2)} / page\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🧾 Total charged:    <b>RM ${total.toFixed(2)}</b>\n` +
        `💰 Remaining bal:    <b>RM ${(balance - total).toFixed(2)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `🕐 <code>${confirmedAt}</code>\n\n` +
        `✅ <b>Order placed successfully!</b>\n` +
        `<i>We’ll notify you when your print is ready. 🖨️</i>`,
      { parse_mode: "HTML", reply_markup: homeKeyboard },
    );
  });
}

module.exports = confirmHandler;

