const { walletKeyboard } = require("../../keyboard");
const userState = require("../../state");
const supabase = require("../../database/db");
function walletHandler(bot) {
  bot.callbackQuery("wallet", async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
    } catch (e) {}

    const telegramId = ctx.from.id;

    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (error || !user) {
      return ctx.reply("❌ Could not find your account. Use /start to register.");
    }

    const { data: userBalance, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError || !userBalance) {
      console.error(walletError);
      return ctx.reply("❌ Unable to fetch wallet.");
    }

    userState.set(ctx.from.id, {
      telegram_id: telegramId,
      step: "wallet_menu",
      updatedAt: new Date().toISOString(),
    });

    return ctx.reply(
      `💼 <b>Wallet</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `💳 Your current balance\n\n` +
        `  💰 <b>RM ${(userBalance.balance_cents / 100).toFixed(2)}</b>\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `💸 <b>Top Up</b>  — add funds to print`,
      {
        parse_mode: "HTML",
        reply_markup: walletKeyboard,
      },
    );
  });
}

module.exports = walletHandler;
