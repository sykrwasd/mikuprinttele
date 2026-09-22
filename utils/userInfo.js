const supabase = require("../database/db");

async function getUserInfo(ctx) {
  const telegramId = typeof ctx === "object" ? ctx.from.id : ctx;

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  

  if (error || !user) {
    console.error("❌ getUserInfo error:", error);
    return null;
  }

  console.log(user);
  return user;
}

getUserInfo(811376072); // works for testing
module.exports = getUserInfo;