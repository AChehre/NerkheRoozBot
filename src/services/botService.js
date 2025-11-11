import { Bot } from 'grammy';

async function createBot(token) {
	const bot = new Bot(token);

	await bot.init();
	return bot;
}

async function setCommands(bot) {
	bot.command('start', (ctx) => ctx.reply('👋 Hello from Cloudflare Worker!'));
	bot.command('ping', (ctx) => ctx.reply('🏓 pong!'));
	bot.on('message', (ctx) => ctx.reply('You said: ' + ctx.message.text));
}

export { createBot, setCommands };
