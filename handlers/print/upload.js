const axios = require("axios");
const path = require("path");
const pdf = require("pdf-parse");
const userState = require("../../state");
const supabase = require("../../database/db");
const {
  printKeyboard,
  homeKeyboard,
  cancelKeyboard,
} = require("../../keyboard");

function uploadHandler(bot) {
  // Handle document uploads
  bot.on("message:document", async (ctx) => {
    const userId = ctx.from.id;

    // Only process if user is expected to upload
    const state = userState.get(ctx.from.id) || {};
    if (!state || state.step !== "awaiting_upload") return;

    const file = ctx.message.document;

    // Validate: must be a PDF
    if (file.mime_type !== "application/pdf") {
      await ctx.reply(
        `❌ <b>Wrong file type.</b>\n\n` +
          `Only <b>PDF</b> files are supported.\n` +
          `Please send a <code>.pdf</code> document.`,
        { parse_mode: "HTML", reply_markup: cancelKeyboard },
      );
      return;
    }

    try {
      // Get file info from Telegram
      const telegramFile = await ctx.api.getFile(file.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${telegramFile.file_path}`;

      // Download the PDF as a raw buffer
      const response = await axios({
        url: fileUrl,
        method: "GET",
        responseType: "arraybuffer",
      });

      const fileBuffer = Buffer.from(response.data);

      // Count pages before uploading
      const pdfData = await pdf(fileBuffer);
      const pagenum = pdfData.numpages;
      console.log("Total pages:", pagenum);

      // Build a unique storage path: userId/timestamp_filename.pdf
      const safeFileName = path
        .basename(file.file_name)
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${userId}/${Date.now()}_${safeFileName}`;

      // Upload to Supabase Storage bucket called "pdfs"
      const { error: uploadError } = await supabase.storage
        .from("pdfs")
        .upload(storagePath, fileBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        userState.delete(userId);
        await ctx.reply("❌ Failed to store your file. Please try again.", {
          reply_markup: homeKeyboard,
        });
        return;
      }

      console.log("Uploaded to Supabase Storage:", storagePath);

      userState.set(ctx.from.id, {
        ...state,
        step: "choose_print_type",
        pages: pagenum,
        fileName: safeFileName,
        storagePath,                          
      });


      await ctx.reply(
        `✅ <b>File received!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━\n\n` +
          `📄 <code>${safeFileName}</code>\n` +
          `📑 Pages: <b>${pagenum}</b>\n\n` +
          `Great! Now choose how you'd like to print it ⬇️`,
        { parse_mode: "HTML", reply_markup: printKeyboard },
      );
    } catch (err) {
      console.error("Upload handler error:", err);
      userState.delete(userId);
      await ctx.reply("❌ Upload failed. Please try again.", {
        reply_markup: homeKeyboard,
      });
    }
  });

  // Nudge users who send a photo/other file while awaiting PDF
  bot.on("message:photo", async (ctx) => {
    const photoState = userState.get(ctx.from.id);
    if (!photoState || photoState.step !== "awaiting_upload") return;
    await ctx.reply(
      `📸 That's a photo, not a PDF.\n\nPlease send your file as a <b>.pdf document</b>.`,
      { parse_mode: "HTML", reply_markup: cancelKeyboard },
    );
  });
}

module.exports = uploadHandler;
