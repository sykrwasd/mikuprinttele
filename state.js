require("dotenv").config();

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Steps that are "active" flows — we notify the user when these expire.
const ACTIVE_STEPS = ["awaiting_upload", "choose_print_type", "confirm"];

/**
 * TTL-aware session store, drop-in replacement for Map.
 * Each entry auto-deletes after SESSION_TTL_MS and sends
 * the user a Telegram message if they were mid-flow.
 */
class SessionStore {
  constructor() {
    this._data = new Map();    // userId → value
    this._timers = new Map();  // userId → setTimeout handle
  }

  set(userId, value) {
    // Clear any existing timer for this user
    this._clearTimer(userId);

    this._data.set(userId, value);

    // Start a fresh 10-minute countdown
    const timer = setTimeout(() => this._expire(userId), SESSION_TTL_MS);
    // Allow Node to exit even if timer is still pending
    if (timer.unref) timer.unref();
    this._timers.set(userId, timer);
  }

  get(userId) {
    return this._data.get(userId);
  }

  has(userId) {
    return this._data.has(userId);
  }

  delete(userId) {
    this._clearTimer(userId);
    return this._data.delete(userId);
  }

  // ── internals ──────────────────────────────────────────────

  _clearTimer(userId) {
    const existing = this._timers.get(userId);
    if (existing) {
      clearTimeout(existing);
      this._timers.delete(userId);
    }
  }

  async _expire(userId) {
    const session = this._data.get(userId);
    this._data.delete(userId);
    this._timers.delete(userId);

    console.log(`⏰ Session expired for user ${userId}`, session);

    // Only notify if they were actively doing something
    if (session && ACTIVE_STEPS.includes(session.step)) {
      try {
        await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: userId,
              text:
                "⏰ *Session expired*\n\nYour session timed out after 10 minutes of inactivity.\n\nTap below to start a new one.",
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🏠 Back to Menu", callback_data: "home" }],
                ],
              },
            }),
          }
        );
      } catch (err) {
        console.error("Failed to send session expiry notification:", err);
      }
    }
  }
}

const userState = new SessionStore();

module.exports = userState;
