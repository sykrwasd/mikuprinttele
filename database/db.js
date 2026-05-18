require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
   process.env.SUPABASE_SECRET_KEY
);

module.exports = supabase


// async function testConnection() {
//   try {
//     // simplest test: ask Supabase for auth session
//     const { data, error } = await supabase.auth.getSession();

//     if (error) {
//       console.log("❌ Connection failed");
//       console.log(error);
//       return;
//     }

//     console.log("✅ Supabase connected!");
//     console.log(data);
//   } catch (err) {
//     console.log("❌ Unexpected error");
//     console.log(err);
//   }
// }

// testConnection();