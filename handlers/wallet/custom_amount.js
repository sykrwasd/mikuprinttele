const { createToyyibBill } = require("../../utils/toyyib");
const { customAmountKeyboard } = require("../../keyboard");
const userState = require("../../state");

function customAmountHandler(bot) {
 bot.callbackQuery("custom", async (ctx) => {
  try {
    await ctx.answerCallbackQuery();
  } catch {}

  userState.set(ctx.from.id, {
    step: "topup_amount",
  });

  await ctx.reply(
    "💸 Enter a custom amount.\n\nMinimum top-up: RM5",
    {
      reply_markup: customAmountKeyboard,
    }
  );
});

  async function handleTopup(ctx, amount) {
    const userId = ctx.from.id;


    const formattedAmount = Number(amount).toFixed(2);

    try {
      const result = await createToyyibBill(amount, userId);

      if (!result?.paymentUrl) {
        return ctx.reply(
          "❌ Couldn't create a payment link. Please try again.",
        );
      }

      await ctx.reply(
        `💳 <b>Payment — RM${formattedAmount}</b>\n` +
          `━━━━━━━━━━━━━━━━━━━\n\n` +
          `Tap the link below to complete your payment:\n` +
          `👉 ${result.paymentUrl}\n\n` +
          `🧾 Bill Ref: <code>${result.billCode}</code>\n\n` +
          `⏳ <i>Complete the payment in your browser.\nYou'll be notified here once it's done.</i>`,
        { parse_mode: "HTML" },
      );
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Couldn't create a payment link. Please try again.");
    }
  }
  bot.on("message:text", async (ctx) => {
    const state = userState.get(ctx.from.id);

    if (!state || state.step !== "topup_amount") return;

    const amount = Number(ctx.message.text);

    if (isNaN(amount)) {
      return ctx.reply("❌ Please enter a valid number.");
    }

    if (amount < 5) {
      return ctx.reply("❌ Minimum top-up is RM5.");
    }

    userState.delete(ctx.from.id);

    await handleTopup(ctx, amount);
  });

  bot.callbackQuery("home", async (ctx) => {
    try {
      await ctx.answerCallbackQuery();
    } catch {}
    await ctx.reply("Cancelled.");
  });
}

module.exports = customAmountHandler;
