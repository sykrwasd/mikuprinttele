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
        `⚠️ No active order found.\n\nUse /start to begin a new one.`,
        { reply_markup: homeKeyboard },
      );
      return;
    }

    const { pages, fileName, preference, username, updatedAt } = state;
    const pricePerPage = preference === "bw" ? PRICE_BW : PRICE_COLOUR;
    const total = parseFloat((pages * pricePerPage).toFixed(2));
    const prefLabel = preference === "bw" ? "🖤 Black & White" : "🎨 Colour";
    const confirmedAt =
      new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

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
          `Your wallet does not have enough funds to complete this print job.\n\n` +
          `💰 Current balance: <code>RM ${balance.toFixed(2)}</code>\n` +
          `🧾 Print total:     <code>RM ${total.toFixed(2)}</code>\n` +
          `⚠️ Shortfall:       <code>RM ${shortfall}</code>\n\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `Please top up at least <b>RM ${shortfall}</b> to proceed.`,
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
      `🧾 <b>PRINT RECEIPT</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 User: <b>@${username ?? "unknown"}</b>\n` +
        `🕐 Time: <code>${confirmedAt}</code>\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `<b>ORDER DETAILS</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `📄 File: <code>${fileName}</code>\n` +
        `📑 Pages: <b>${pages}</b>\n` +
        `🖼️ Type: <b>${prefLabel}</b>\n` +
        `💵 Price/page: <code>RM ${pricePerPage.toFixed(2)}</code>\n` +
        `🧾 <b>Wallet Balance: RM ${(balance - total).toFixed(2)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🧾 <b>TOTAL: RM ${total.toFixed(2)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ <b>Order confirmed!</b>\n` +
        `<i>We'll notify you when your print job is ready.</i>`,
      { parse_mode: "HTML", reply_markup: homeKeyboard },
    );
  });
}

module.exports = confirmHandler;

