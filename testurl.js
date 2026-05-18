
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
   process.env.SUPABASE_SECRET_KEY
);


async function test() {
  const filePath =
    "811376072/1779071558274_Final_3-page_Transcript.pdf";

  const { data } = supabase.storage
    .from("pdfs")
    .getPublicUrl(filePath);

  console.log("Generated URL:");
  console.log(data.publicUrl);
}

test();