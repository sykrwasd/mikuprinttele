async function fetchData() {
  try {
    const response = await fetch("https://mikuprinterserver.xyz/test");

    const data = await response.json();

    console.log(data);

    return data;
  } catch (err) {
    console.error("API Error:", err);
    return null;
  }
}

function testHandler(bot) {

  bot.callbackQuery("test", async (ctx) => {

    ctx.answerCallbackQuery();

    const apiData = await fetchData();

    ctx.reply(
      `💰 <b>Your Balance</b>\n\n` +
      `┌─────────────────┐\n` +
      `│  <b>RM 0.00</b>          │\n` +
      `└─────────────────┘\n\n` +
      `<i>Top up to start printing!</i>\n\n` +
      `<code>${JSON.stringify(apiData)}</code>`,
      { parse_mode: "HTML" }
    );

  });
}

module.exports = testHandler;