const { Bot } = require("grammy");

const startHandler = require("./handlers/start");
const walletHandler = require("./handlers/wallet/wallet");
const printHandler = require("./handlers/print");
const topupHandler = require("./handlers/wallet/topup")
const checkBalHandler = require("./handlers/wallet/checkbal")

require("dotenv").config();
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

startHandler(bot);
walletHandler(bot);
printHandler(bot);
topupHandler(bot)
checkBalHandler(bot)

bot.on("message", (ctx) => {
  ctx.reply("Use /start to begin");
});

bot.start();
console.log("BOT RUNNING");