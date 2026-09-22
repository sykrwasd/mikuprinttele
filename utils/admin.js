require("dotenv").config();

const isTesting = process.env.NODE_ENV === "testing";

const allChatIds = (process.env.ADMIN_CHAT_ID || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// In testing mode only notify the first admin (you), skip the rest
const chatIds = isTesting ? allChatIds.slice(0, 1) : allChatIds;


async function notifyAdmin(message) {
  await Promise.all(
    chatIds.map((chat_id) =>
      fetch(
        `https://api.telegram.org/bot${process.env.ADMIN_TELEGRAM_BOT}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text: message, parse_mode: "HTML" }),
        }
      )
    )
  );
}

module.exports = notifyAdmin;
