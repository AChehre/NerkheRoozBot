import { Bot } from 'grammy';
require('dotenv').config();

export default {
	async fetch(request, env, ctx) {
		const token = process.env.BOT_TOKEN;
		if (!token) {
			return new Response('BOT_TOKEN not set', { status: 500 });
		}

		const bot = new Bot(token);

		await bot.init();

		bot.command('start', (ctx) => ctx.reply('👋 Hello from Cloudflare Worker!'));
		bot.command('ping', (ctx) => ctx.reply('🏓 pong!'));
		bot.on('message', (ctx) => ctx.reply('You said: ' + ctx.message.text));

		if (request.method === 'POST') {
			try {
				const update = await request.json();
				await bot.handleUpdate(update);
				return new Response('OK');
			} catch (err) {
				console.error('⚠️ Telegram update error:', err);
				return new Response('Error handling update', { status: 500 });
			}
		}

		return new Response('✅ Bot is running fine');
	},
};
