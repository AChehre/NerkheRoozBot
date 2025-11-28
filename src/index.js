import { createBot, setCommands } from './services/botService';

export default {
	async fetch(request, env, ctx) {
		const token = env.BOT_TOKEN;
		if (!token) {
			return new Response('BOT_TOKEN not set', { status: 500 });
		}

		const bot = await createBot(token);

		await setCommands(env, bot);

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
