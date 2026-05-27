
require("dotenv").config();
async function notifyAdmin(message) {
  await fetch(
    `https://api.telegram.org/bot${process.env.ADMIN_TELEGRAM_BOT}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: process.env.ADMIN_CHAT_ID,
        text: message,
      }),
    }
  );
}

module.exports = notifyAdmin