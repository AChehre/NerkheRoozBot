import { Bot } from 'grammy';

const { getUSDTPrices } = require('./getPrices');
const { createTable, processATable } = require('../components/TelegramATable/optimizedATable');

async function createBot(token) {
	const bot = new Bot(token);

	await bot.init();
	return bot;
}

async function getTableData(env, page, pageSize) {
	const prices = await getUSDTPrices(env);

	const entries = Object.entries(prices);
	const totalCount = entries.length;

	// Calculate slice (pagination)
	const sliceStart = (page - 1) * pageSize;
	const sliceEnd = sliceStart + pageSize;
	const slice = entries.slice(sliceStart, sliceEnd);

	// Filter out zero prices
	const validPrices = entries.map(([_, price]) => price).filter((price) => price > 0);

	// Calculate average
	const average = validPrices.length ? validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length : 0;

	const tableData = {
		columns: ['ردیف', 'اکسچنج', 'قیمت'],

		rows: [
			// Normal rows
			...slice.map(([exchange, price], i) => ({
				key: exchange,
				cells: [
					{ value: (sliceStart + i + 1).toLocaleString('fa-IR') }, // actual row number
					{ value: exchange },
					{ value: price.toLocaleString('fa-IR') },
				],
			})),

			// Average row (last row)
			{
				key: 'average',
				cells: [{ value: '📊' }, { value: 'میانگین' }, { value: Math.round(average).toLocaleString('fa-IR') }],
			},
		],

		totalCount,
	};

	return tableData;
}

const pageSize = 4;

async function setCommands(env, bot) {
	bot.command('start', async (ctx) => {
		const tableData = await getTableData(env, 1, pageSize);
		console.log('DEBUG tableData:', JSON.stringify(tableData, null, 2));
		await ctx.reply('📊 USDT Prices', {
			reply_markup: createTable('usdt', 'list', tableData, 1, pageSize),
		});
	});

	bot.on('callback_query:data', async (ctx) => {
		await processATable(ctx, {
			getTableData: async (queryKey, page, pageSize) => {
				return await getTableData(env, page, pageSize);
			},
		});
	});

	bot.command('ping', (ctx) => ctx.reply('🏓 pong!'));
}

export { createBot, setCommands };
