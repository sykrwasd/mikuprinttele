const { createToyyibBill } = require("../../toyyib");
const { topupKeyboard } = require("../../keyboard");

function topupHandler(bot) {
  bot.callbackQuery("topup", async (ctx) => {
    try { await ctx.answerCallbackQuery(); } catch {}

    await ctx.reply(
      `💸 <b>Top Up Wallet</b>\n━━━━━━━━━━━━━━━━━━━\n\nAdd credit to your MikuPrint wallet.\n\nChoose an amount below ⬇️`,
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
        return ctx.reply("❌ Couldn't create a payment link. Please try again.");
      }

      await ctx.reply(
        `💳 <b>Payment — RM${amount}.00</b>\n` +
        `━━━━━━━━━━━━━━━━━━━\n\n` +
        `Tap the link below to complete your payment:\n` +
        `👉 ${result.paymentUrl}\n\n` +
        `🧾 Bill Ref: <code>${result.billCode}</code>\n\n` +
        `⏳ <i>Complete the payment in your browser.\nYou'll be notified here once it's done.</i>`,
        { parse_mode: "HTML" }
      );
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Couldn't create a payment link. Please try again.");
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