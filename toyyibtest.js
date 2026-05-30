require("dotenv").config();
const supabase = require("./database/db");

async function createToyyibBill(amountRM, telegramId) {
  try {
    const callbackUrl = `${process.env.SERVER_URL}/payment/callback`;
    const returnUrl = `${process.env.SERVER_URL}/payment/return`;

    const response = await fetch(
      "https://dev.toyyibpay.com/index.php/api/createBill",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          userSecretKey: process.env.TOYYIBPAY_SECRET_KEY,
          categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE,

          billName: "Wallet Topup",
          billDescription: `Wallet topup RM${amountRM}`,

          billPriceSetting: "1",
          billPayorInfo: "1",

          billAmount: String(amountRM * 100),

          // Store telegramId and amount in the reference so callback can use it
          billExternalReferenceNo: `wallet_${telegramId}_${amountRM}_${Date.now()}`,

          billTo: "Telegram User",
          billEmail: "test@example.com",
          billPhone: "0123456789",

          // ✅ ToyyibPay will POST to this URL after payment
          billCallbackUrl: callbackUrl,

          // ✅ User will be redirected here after the payment page
          billReturnUrl: returnUrl,

          // ✅ Charge buyer (not seller)
          billChargeToCustomer: "1",
        }),
      }
    );

    const data = await response.json();

    console.log("ToyyibPay response:", data);

    if (!data[0]?.BillCode) {
      throw new Error(data[0]?.msg || "ToyyibPay bill creation failed");
    }

    return {
      billCode: data[0].BillCode,
      paymentUrl: `https://dev.toyyibpay.com/${data[0].BillCode}`,
    };
  } catch (err) {
    console.error("ToyyibPay error:", err);
  }
}

// ✅ Called by ToyyibPay via POST /payment/callback after payment
// ToyyibPay sends multipart/form-data with these fields:
// status / status_id, order_id, amount, refno, billcode, reason, hash, transaction_time
async function paymentCallback(req, res) {
  console.log("📩 CALLBACK RECEIVED:");
  console.log(req.body);

  const { status, order_id, amount } = req.body;

  // status "1" = successful payment
  if (status == "1" && order_id) {
    try {
      // Reference format: wallet_{telegramId}_{amountRM}_{timestamp}
      const parts = order_id.split("_");
      const telegramId = parts[1];
      const amountRM = parseFloat(amount);

      console.log(`✅ Payment success for Telegram ID: ${telegramId}, RM${amountRM}`);

      // Credit the wallet in Supabase
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("balance")
        .eq("telegram_id", telegramId)
        .single();

      if (fetchError) {
        console.error("❌ User not found:", fetchError);
        return res.send("OK");
      }

      const newBalance = (user.balance || 0) + amountRM;

      const { error: updateError } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("telegram_id", telegramId);

      if (updateError) {
        console.error("❌ Balance update failed:", updateError);
      } else {
        console.log(`✅ Wallet credited! New balance: RM${newBalance}`);
      }
    } catch (err) {
      console.error("❌ Callback processing error:", err);
    }
  } else {
    console.log("❌ Payment NOT successful. Status:", status);
  }

  // ToyyibPay requires a 200 OK response
  res.send("OK");
}

// ✅ export both properly
module.exports = {
  createToyyibBill,
  paymentCallback,
};