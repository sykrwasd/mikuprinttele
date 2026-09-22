# MikuPrint

A Telegram bot for campus printing. Users upload a PDF, pay from a prepaid wallet, and the job is queued for a physical printer.

The system has three parts:

| Part | Where | Job |
| --- | --- | --- |
| **Bot** | `bot.js` (this repo) | Telegram UI: register, top up, upload a PDF, confirm a print |
| **Webhook server** | `server.js` (this repo) | Receives ToyyibPay payment callbacks and serves the post-payment return page |
| **Print server** | separate `printserver` folder, not in this repo | Runs next to the printer and sends jobs to it |

Supabase (Postgres + Storage) is the shared database for all three.

```
Telegram user ──► Bot ───────────► Supabase (users, wallets, print, payments, pdfs bucket)
                   │                    ▲
                   │ top up             │ pending jobs
                   ▼                    │
              ToyyibPay ──callback──► Webhook server        Print server ──► Printer
```

## User flows

### Registration

`/start` looks the user up by Telegram ID. First-time users get a `users` row and a `wallets` row with a zero balance, and the admin bot is notified.

### Top-up

1. User picks RM 5, RM 10 or a custom amount (minimum RM 5).
2. The bot creates a ToyyibPay bill. The order reference is `wallet_<telegramId>_<amountRM>_<timestamp>`.
3. The user pays in the browser.
4. ToyyibPay calls `POST /payment/callback`. The server verifies the hash, then calls the `credit_wallet_payment` database function, which records the payment and credits the wallet in one transaction.
5. The user is redirected to `/payment/return`, which shows a result page and sends them a Telegram message.

### Print

1. **Print** asks for a PDF. Other file types are rejected.
2. The bot downloads the file from Telegram, counts the pages with `pdf-parse`, and stores it in the private `pdfs` bucket as `<telegramId>/<timestamp>_<filename>`.
3. The user chooses Black & White (RM 0.20/page) or Colour (RM 0.50/page).
4. **Confirm** calls the `confirm_print_job` database function. It checks the balance, deducts the cost and creates a `print` row with status `pending`, all in one transaction. The user gets a receipt.

A session lasts 10 minutes. If an upload or confirmation sits idle longer, the session is cleared and the user is told.

## Database

Tables (as the code uses them):

| Table | Columns used |
| --- | --- |
| `users` | `id`, `telegram_id`, `username` |
| `wallets` | `id`, `user_id`, `balance_cents` |
| `print` | `user_id`, `file_name`, `file_path`, `page_num`, `preference` (`bw` / `colour`), `total_price`, `print_status` |
| `payments` | `user_id`, `order_id` (unique), `billcode`, `refno`, `status`, `status_id`, `amount`, `transaction_id`, `fpx_transaction_id`, `hash`, `transaction_time` |

Storage: a **private** bucket named `pdfs`.

### Database functions (`database/*.sql`)

Both files must be run once in the Supabase SQL editor. Without them, Confirm and top-up fail.

**`confirm_print_job`** ([confirm_print_job.sql](../database/confirm_print_job.sql))
Locks the user's wallet row, checks the balance, deducts the cost and inserts the print job as `pending`. Returns `{ok: true, job_id, balance_cents}`, or `{ok: false, reason}` for `insufficient_balance`, `user_not_found` and `wallet_not_found`. Any unexpected error raises and rolls everything back.

**`credit_wallet_payment`** ([credit_wallet_payment.sql](../database/credit_wallet_payment.sql))
Inserts the payment row and increments the wallet in one transaction. A repeated `order_id` is a no-op (`duplicate: true`). If the wallet can't be updated, the payment insert is rolled back too. It also creates a unique index on `payments(order_id)`.

Both functions are executable only by `service_role`.

## Setup

Requires Node.js and a Supabase project.

```bash
npm install
```

Create a `.env` in the project root:

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Supabase service-role key (server-side only, never expose it) |
| `SUPABASE_PUBLISHABLE_TOKEN` | Supabase publishable key |
| `TOYYIBPAY_SECRET_KEY` | ToyyibPay user secret key |
| `TOYYIBPAY_CATEGORY_CODE` | ToyyibPay category code |
| `SERVER_URL` | Public base URL of the webhook server (used for the callback and return URLs) |
| `PORT` | Webhook server port (default `3000`) |
| `ADMIN_TELEGRAM_BOT` | Token of the bot that sends admin notifications |
| `ADMIN_CHAT_ID` | Admin chat ID(s), comma-separated |
| `NODE_ENV` | Set to `testing` to notify only the first admin |

Then:

1. Run both SQL files from `database/` in the Supabase SQL editor.
2. Create the private `pdfs` storage bucket.
3. Start the bot and the webhook server. They are separate processes:

```bash
npm start          # bot (node bot.js)
node server.js     # webhook server, must be publicly reachable at SERVER_URL
```

`npm run dev` runs the bot with `node --watch`.

ToyyibPay is currently pointed at the **sandbox** (`dev.toyyibpay.com`) in [utils/toyyib.js](../utils/toyyib.js). Change the host to go live.

## Project layout

```
bot.js                    Bot entry point, registers handlers
server.js                 Webhook server (payment callback + return page)
state.js                  In-memory session store with a 10-minute TTL
keyboard.js               Inline keyboards
database/
  db.js                   Supabase client (service-role key)
  confirm_print_job.sql   Atomic charge + create job
  credit_wallet_payment.sql  Atomic record payment + credit wallet
handlers/
  start.js                /start, home, user registration
  print/                  print, upload, printtype, confirm
  wallet/                 wallet, checkbal, topup, custom_amount
utils/
  toyyib.js               ToyyibPay bill creation + callback handling
  admin.js                Admin bot notifications
docs/
  README.md               This file
```

## Print server (status: partly built)

The `printserver` folder currently exposes `POST /print` and `POST /print_double_sided`, which accept a file upload and print it with `pdf-to-printer`. It does **not** yet read jobs from Supabase.

The intended design is for the print server to pull work, not be pushed to:

1. Poll (or subscribe via Realtime) for `print` rows with `print_status = 'pending'`.
2. Claim a job atomically: `update … set print_status = 'printing' where id = $1 and print_status = 'pending'`. Only one worker can win.
3. Download the PDF from the private `pdfs` bucket with the service key, print it (`monochrome` for B&W), and delete the local temp file.
4. Set `done` or `failed`, notify the user, and refund the wallet on failure.
5. Delete the PDF from the bucket after the job finishes, or after a retention period.

Polling means the print server only makes outbound calls, so the public print endpoints can be removed, and jobs queued while it was offline get picked up when it restarts.

## Known issues and to-do

- **ToyyibPay callback hash:** `verifyToyyibHash` uses `md5(secret + category + billcode + amount + status_id)`, which may not match ToyyibPay's documented formula. If real callbacks are rejected with "invalid hash", check this first.
- **Return page is unauthenticated:** `/payment/return` sends a Telegram message based only on query parameters, so anyone can trigger a fake "payment successful" message. It doesn't credit money, but it can mislead users.
- **Custom amounts:** the bill amount is computed as `amount * 100`, which can produce floating-point values, and there is no upper limit or two-decimal check.
- **Text handler swallows messages:** the `message:text` handler in `custom_amount.js` doesn't call `next()`, so the generic fallback in `bot.js` never runs for text.
- **Dead code:** the `home` handlers in `topup.js` and `custom_amount.js` are never reached because `start.js` handles `home` first.
- **Duplicated prices:** the per-page prices are defined in `printtype.js`, `confirm.js` and `keyboard.js`.
- **Print server auth:** its print endpoints have no authentication and open CORS, and uploaded files are never deleted.
- **Print queue not connected:** nothing consumes `pending` jobs yet, and users are told they'll be notified when a print is ready.
