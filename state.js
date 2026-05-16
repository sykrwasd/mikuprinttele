// Simple in-memory state store keyed by Telegram user ID.
// Values: "awaiting_upload" | null
const userState = new Map();

module.exports = userState;
