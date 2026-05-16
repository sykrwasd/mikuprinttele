const fs = require("fs");
const path = require("path");
const axios = require("axios");
const userState = require("../state");
const pdf = require("pdf-parse");
const { homeKeyboard, cancelKeyboard } = require("../keyboard");

function uploadHandler(bot) {
  // Handle document uploads
  bot.on("message:document", async (ctx) => {
    const userId = ctx.from.id;

    // Only process if user is expected to upload
    if (userState.get(userId) !== "awaiting_upload") return;

    const file = ctx.message.document;

    // Validate: must be a PDF
    if (file.mime_type !== "application/pdf") {
      await ctx.reply(
        `❌ <b>Invalid file type.</b>\n\n` +
          `Only <b>PDF</b> files are accepted.\n` +
          `Please upload a <code>.pdf</code> file.`,
        { parse_mode: "HTML", reply_markup: cancelKeyboard },
      );
      return;
    }

    try {
      // Get file info from Telegram
      const telegramFile = await ctx.api.getFile(file.file_id);

      // Build download URL
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${telegramFile.file_path}`;

      console.log(fileUrl);

      const safeFileName = path
        .basename(file.file_name)
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const savePath = path.join(__dirname, "../uploads", safeFileName);

      const response = await axios({
        url: fileUrl,
        method: "GET",
        responseType: "stream",
      });

      const writer = fs.createWriteStream(savePath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        try {
          const dataBuffer = fs.readFileSync(savePath);
          const data = await pdf(dataBuffer);

          const pagenum = data.numpages;

          console.log("Total pages:", pagenum);

          userState.delete(userId);

          

          await ctx.reply(
            `✅ <b>File received!</b>\n` +
              `━━━━━━━━━━━━━━━━━━━\n\n` +
              `📄 <code>${safeFileName}</code>\n` +
              `📑 Pages: <b>${pagenum}</b>\n\n` +
              `Your print job has been queued.\n` +
              `<i>We’ll notify you when it’s ready!</i>`,
            { parse_mode: "HTML", reply_markup: homeKeyboard },
          );
        } catch (err) {
          console.error("PDF parse error:", err);
          userState.delete(userId);
          await ctx.reply("\u274c Could not read PDF file. Please try again.", { reply_markup: homeKeyboard });
        }
      });

      writer.on("error", async () => {
        userState.delete(userId);
        await ctx.reply("❌ Failed to save your file. Please try again.", { reply_markup: homeKeyboard });
      });
    } catch (err) {
      console.error(err);
      userState.delete(userId);
      await ctx.reply("❌ Upload failed. Please try again.", { reply_markup: homeKeyboard });
    }
  });

  // Nudge users who send a photo/other file while awaiting PDF
  bot.on("message:photo", async (ctx) => {
    if (userState.get(ctx.from.id) !== "awaiting_upload") return;
    await ctx.reply(
      `❌ Photos are not accepted.\n\nPlease send your file as a <b>PDF document</b>.`,
      { parse_mode: "HTML", reply_markup: cancelKeyboard },
    );
  });
}

module.exports = uploadHandler;
