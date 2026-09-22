require("dotenv").config();
const crypto = require("crypto");
const supabase = require("../database/db");
const notifyAdmin = require("./admin");

// ToyyibPay signs each callback as md5(secretKey + categoryCode + billcode + amount + status_id).
// Reject anything that doesn't match — this is the primary defence against fake callbacks.
function verifyToyyibHash(body) {
  const { billcode, amount, status_id, hash } = body;
  if (!hash) return false;
  const expected = crypto
    .createHash("md5")
    .update(
      process.env.TOYYIBPAY_SECRET_KEY +
        process.env.TOYYIBPAY_CATEGORY_CODE +
        billcode +
        amount +
        status_id,
    )
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(hash, "utf8"),
  );
}

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

  // Fix 1: reject any callback whose signature doesn't match
  if (!verifyToyyibHash(req.body)) {
    console.warn("⚠️ Rejected callback with invalid hash");
    return res.send("OK");
  }

  // status "1" = successful payment
  if (status == "1" && order_id) {
    try {
      const parts = order_id.split("_");
      const telegramId = parts[1];

      // Fix 2: use the amount we encoded at bill-creation time, not the
      // attacker-controllable req.body.amount field.
      const amountRM = parseFloat(parts[2]);
      const amount_in_cents = Math.round(amountRM * 100);

      if (!/^\d+$/.test(telegramId || "") || isNaN(amountRM) || amountRM <= 0) {
        console.error("❌ Malformed order_id:", order_id);
        return res.send("OK");
      }

      // Fix 3: record the payment and credit the wallet in ONE transaction.
      // The unique index on payments.order_id makes a duplicate callback a
      // no-op, and the credit is an in-DB increment so callbacks can't race.
      const { data: result, error: creditError } = await supabase.rpc(
        "credit_wallet_payment",
        {
          p_telegram_id: telegramId,
          p_amount_cents: amount_in_cents,
          p_payment: {
            order_id,
            billcode,
            refno,
            status,
            status_id,
            amount: amountRM,
            transaction_id,
            fpx_transaction_id,
            hash,
            transaction_time,
          },
        },
      );

      if (creditError) {
        // Nothing was committed, but the user HAS paid — tell the admin.
        console.error("❌ credit_wallet_payment failed:", creditError);
        try {
          await notifyAdmin(
            `🚨 <b>Payment received but wallet NOT credited</b>\n\n` +
              `Telegram ID: <code>${telegramId}</code>\n` +
              `Amount: <b>RM ${amountRM.toFixed(2)}</b>\n` +
              `Order ID: <code>${order_id}</code>\n` +
              `Bill Code: <code>${billcode}</code>\n\n` +
              `Credit manually or ask ToyyibPay to resend the callback.`,
          );
        } catch (notifyErr) {
          console.error("❌ Failed to alert admin:", notifyErr);
        }
        return res.send("OK");
      }

      if (!result.ok) {
        console.error("❌ Payment not credited:", result.reason, order_id);
        return res.send("OK");
      }

      if (result.duplicate) {
        console.log("⚠️ Duplicate callback ignored for order_id:", order_id);
        return res.send("OK");
      }

      const timeStr = transaction_time
        ? new Date(transaction_time).toLocaleString("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }) + " MYT"
        : "—";

  await notifyAdmin(
`💰 <b>New Payment Received</b>
━━━━━━━━━━━━━━━━━━━━━━

👤 <b>User</b>
└ Telegram ID: <code>${telegramId}</code>

💵 <b>Transaction</b>
└ Amount: <b>RM ${amountRM.toFixed(2)}</b>

🧾 <b>Reference</b>
└ Order ID: <code>${order_id}</code>
└ Bill Code: <code>${billcode}</code>
└ FPX Ref: <code>${fpx_transaction_id ?? "—"}</code>

🕐 <b>Time</b>
└ ${timeStr}

━━━━━━━━━━━━━━━━━━━━━━
✅ Status: <b>SUCCESS</b>`
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
