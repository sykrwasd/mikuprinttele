const { Bot } = require("grammy");

const startHandler = require("./handlers/start");
const walletHandler = require("./handlers/wallet");
const printHandler = require("./handlers/print");

require("dotenv").config();
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

startHandler(bot);
walletHandler(bot);
printHandler(bot);

bot.on("message", (ctx) => {
  ctx.reply("Use /start to begin");
});

bot.start();
console.log("BOT RUNNING");