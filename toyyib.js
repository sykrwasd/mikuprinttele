require("dotenv").config();
const supabase = require("./database/db");
const notifyAdmin = require("./admin");

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

          billCallbackUrl: callbackUrl,

          billReturnUrl: returnUrl,

          billChargeToCustomer: "1",
        }),
      },
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

async function paymentCallback(req, res) {
  console.log("📩 CALLBACK RECEIVED:");
  console.log(req.body);

  const {
    refno,
    status,
    reason,
    billcode,
    order_id,
    amount,
    status_id,
    msg,
    transaction_id,
    fpx_transaction_id,
    hash,
    transaction_time,
  } = req.body;

  // status "1" = successful payment
  if (status == "1" && order_id) {
    try {
      const parts = order_id.split("_");
      const telegramId = parts[1];

      const amountRM = parseFloat(amount);
      const amount_in_cents = Math.round(amountRM * 100);

      let { data: user, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", telegramId)
        .single();

      if (fetchError || !user) {
        console.error("❌ User not found");
        return res.send("OK");
      }

      const { data: existing } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", order_id)
        .single();

      if (existing) {
        console.log("⚠️ Duplicate callback ignored");
        return res.send("OK");
      }

      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (walletError || !wallet) {
        console.error("❌ Wallet not found");
        return res.send("OK");
      }

      const newBalance = (wallet.balance_cents || 0) + amount_in_cents;

      await supabase
        .from("wallets")
        .update({ balance_cents: newBalance })
        .eq("user_id", user.id);

      await supabase.from("payments").insert({
        user_id: user.id,
        order_id,
        billcode,
        refno,
        status,
        status_id,
        amount: parseFloat(amount),
        transaction_id,
        fpx_transaction_id,
        hash,
        transaction_time,
      });

      const timeStr = transaction_time
        ? new Date(transaction_time).toLocaleString("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }) + " MYT"
        : "—";

      await notifyAdmin(
`💰 *New Payment Received*
━━━━━━━━━━━━━━━━━━━

👤 Telegram ID:  \`${telegramId}\`
💵 Amount:       *RM ${amountRM.toFixed(2)}*

━━━━━━━━━━━━━━━━━━━
🧾 Order ID:     \`${order_id}\`
💳 Bill Code:    \`${billcode}\`
🏦 FPX Ref:      \`${fpx_transaction_id ?? "—"}\`

━━━━━━━━━━━━━━━━━━━
🕐 Time: ${timeStr}`
      );

      console.log(`✅ Wallet credited RM${amountRM}`);
    } catch (err) {
      console.error("❌ Callback error:", err);
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
