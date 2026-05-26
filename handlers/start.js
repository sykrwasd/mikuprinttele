const { mainKeyboard } = require("../keyboard");
const supabase = require("../database/db");

async function checkDB(ctx) {
  const name = ctx.from?.first_name ?? "there";

  const telegramId = ctx.from.id;
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

    console.log("dah add mamat/minah ni dalam database");
  } else {
    console.log("dah ada data mamat/minah ni");
  }

  return user;
}

function startHandler(bot) {
  // /start command
  bot.command("start", async (ctx) => {
    const name = ctx.from?.first_name ?? "there";

    const user = await checkDB(ctx);
    ctx.reply(
      `🖨️ <b>MikuPrint</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `Hey <b>${name}</b>! Welcome to your campus print service.\n\n` +
        `📄 <b>Print</b> — upload a file & get it printed\n` +
        `💼 <b>Wallet</b> — manage your balance\n\n` +
        `<i>What would you like to do?</i>`,
      {
        parse_mode: "HTML",
        reply_markup: mainKeyboard,
      },
    );
  });

  // "Home" callback — same as /start
  bot.callbackQuery("home", async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
    } catch (e) {}
    const name = ctx.from?.first_name ?? "there";
    const user = await checkDB(ctx);

    ctx.reply(
      `🖨️ <b>MikuPrint</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `Hey <b>${name}</b>! Welcome to your campus print service.\n\n` +
        `📄 <b>Print</b> — upload a file & get it printed\n` +
        `💼 <b>Wallet</b> — manage your balance\n\n` +
        `<i>What would you like to do?</i>`,
      {
        parse_mode: "HTML",
        reply_markup: mainKeyboard,
      },
    );
  });
}

module.exports = startHandler;
