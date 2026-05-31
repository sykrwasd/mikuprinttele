const { createToyyibBill } = require("../../toyyib");
const { topupKeyboard } = require("../../keyboard");

function topupHandler(bot) {
  bot.callbackQuery("topup", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}

    await ctx.reply(
      `💸 <b>Top Up Wallet</b>\n━━━━━━━━━━━━━━━━━━━\n\nSend the amount you'd like to add.`,
      {
        parse_mode: "HTML",
        reply_markup: topupKeyboard,
      }
    );
  });

  async function handleTopup(ctx, amount) {
    const userId = ctx.from.id;

    try {
      const result = await createToyyibBill(amount, userId);

      if (!result?.paymentUrl) {
        return ctx.reply("❌ Failed to create payment. Try again.");
      }

      await ctx.reply(
        `💳 Pay RM${amount} here:\n${result.paymentUrl}\n\n🧾 Ref: ${result.billCode}`
      );
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Error creating payment.");
    }
  }

  bot.callbackQuery("ten", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    await handleTopup(ctx, 10);
  });

  bot.callbackQuery("five", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    await handleTopup(ctx, 5);
  });

  bot.callbackQuery("home", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}
    await ctx.reply("Cancelled.");
  });
}

module.exports = topupHandler;