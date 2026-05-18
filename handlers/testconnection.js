const supabase = require("../database/db")


async function testConnection() {
  try {
        const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log("❌ Connection failed");
      console.log(error);
      return;
    }

    console.log("✅ Supabase connected!");
    console.log(data);
  } catch (err) {
    console.log("❌ Unexpected error");
    console.log(err);
  }
}

testConnection();