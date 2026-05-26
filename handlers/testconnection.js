const supabase = require("../database/db");

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("wallets")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.log("❌ Connection failed");
      console.log(error);
      return;
    }

    const { data:wallet, error:errorwallet } = await supabase
  .from("wallets")
  .select("*")
  .eq("user_id", "f31f8cd4-a5e6-4a04-93b4-c0c9d4e97ef8")
  .single();

  console.log(wallet)

    console.log("✅ Supabase connected!");
  } catch (err) {
    console.log("❌ Unexpected error");
    console.log(err);
  }
}

testConnection();