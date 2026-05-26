const { walletKeyboard } = require("../../keyboard");
const userState = require("../../state");
const supabase = require("../../database/db");
function walletHandler(bot) {
  bot.callbackQuery("wallet", async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
    } catch (e) {}

    const telegramId = ctx.from.id;
    userState.set(ctx.from.id, {
      telegram_id: telegramId,
      username: ctx.from.username,
      updatedAt: new Date().toISOString(),
    });

    console.log(userState);

    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    //error PGRST116 = The result contains 0 rows
    if (error && error.code === "PGRST116") {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            telegram_id: telegramId,
            username: ctx.from.username,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error("User create error:", createError);
        return ctx.reply("❌ Error creating wallet account.");
      }

      user = newUser;

      //buat data dalam table wallet jugak, since 1 wallet = 1 user
      await supabase.from("wallets").insert([
        {
          user_id: user.id,
          balance_cents: 0,
        },
      ]);
    }

    const { data: userBalance, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError) {
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
        `💰 Balance: RM ${(userBalance.balance_cents / 100).toFixed(2)}\n\n` +
        `💸 <b>Top Up</b> — add funds to your account`,
      {
        parse_mode: "HTML",
        reply_markup: walletKeyboard,
      },
    );
  });
}

module.exports = walletHandler;
