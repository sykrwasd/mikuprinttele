const { Bot } = require("grammy");

const startHandler = require("./handlers/start");
const walletHandler = require("./handlers/wallet/wallet");
const printHandler = require("./handlers/print/print");
const uploadHandler = require("./handlers/print/upload");
const printTypeHandler = require("./handlers/print/printtype");
const topupHandler = require("./handlers/wallet/topup")
const checkBalHandler = require("./handlers/wallet/checkbal")
const testHandler = require("./handlers/test")

require("dotenv").config();
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

startHandler(bot);
walletHandler(bot);
printHandler(bot);
uploadHandler(bot);
printTypeHandler(bot);
topupHandler(bot)
checkBalHandler(bot)
testHandler(bot)

const userState = require("./state");
const { mainKeyboard, cancelKeyboard } = require("./keyboard");

// Generic fallback — must be last so it doesn't swallow document/photo messages
bot.on("message", (ctx) => {
  if (userState.get(ctx.from.id) === "awaiting_upload") {
    ctx.reply(
      `📎 Please upload your <b>PDF file</b> to continue.`,
      { parse_mode: "HTML", reply_markup: cancelKeyboard }
    );
  } else {
    ctx.reply(
      `👋 Use /start to begin or tap below.`,
      { parse_mode: "HTML", reply_markup: mainKeyboard }
    );
  }
});

bot.start();
console.log("BOT RUNNING");