const { homeKeyboard } = require("../../keyboard");
const supabase = require("../../database/db");

function checkBalHandler(bot) {
  bot.callbackQuery("checkbal", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch (e) {}

    const telegramId = ctx.from.id;

    // Fetch user record
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramId)
      .single();

    if (userError || !user) {
      return ctx.reply("❌ Could not find your account. Use /start to register.", {
        reply_markup: homeKeyboard,
      });
    }

    // Fetch wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("balance_cents")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return ctx.reply("❌ Could not fetch wallet. Please try again.", {
        reply_markup: homeKeyboard,
      });
    }

    const balance = (wallet.balance_cents / 100).toFixed(2);

    await ctx.reply(
      `💰 <b>Your Balance</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `┌──────────────────────┐\n` +
      `│  Balance: <b>RM ${balance}</b>  │\n` +
      `└──────────────────────┘\n\n` +
      `<i>Top up your wallet to start printing!</i>`,
      {
        parse_mode: "HTML",
        reply_markup: homeKeyboard,
      }
    );
  });
}

module.exports = checkBalHandler;