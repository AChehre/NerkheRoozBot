# <img src="./images/NerkheRooz.png" width="40" height="40" style="vertical-align:middle;"> NerkheRooz Telegram Bot

<img src="./images/telegram.png" width="25" height="25" style="vertical-align:middle;"> **Telegram Bot:** [@NerkheRooz_bot](https://t.me/NerkheRooz_bot)

A Cloudflare Worker that fetches USDT→Toman prices from multiple
exchanges, caches them in Cloudflare KV for 1 minute, and exposes the
data through a Telegram bot webhook.

## 1. Create the KV Namespace

    npx wrangler kv namespace create PRICES_CACHE

Copy the generated KV namespace ID and add it to your `wrangler.jsonc`
under `kv_namespaces`.

## 2. Deploy to Cloudflare

    npm run deploy

After deployment, Wrangler will show the Cloudflare Worker URL --- keep
it for the next step.

## 3. Set the Telegram Webhook

    curl.exe -F "url=[YOUR_WORKER_URL]" https://api.telegram.org/bot[BOT_TOKEN]/setWebhook

Replace: - \[YOUR_WORKER_URL\] with your Worker endpoint\
- \[BOT_TOKEN\] with your bot token

## 4. Debugging (Cloudflare)

    npx wrangler tail

## 5. Debugging (Telegram)

    curl.exe https://api.telegram.org/bot[BOT_TOKEN]/getWebhookInfo
