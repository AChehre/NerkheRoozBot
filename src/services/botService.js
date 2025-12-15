import { Bot } from 'grammy';

const { GetPrices, GetAveragePrices } = require('./getPrices');
const { createTable, processATable } = require('../components/TelegramATable/optimizedATable');
const { AssetType } = require('../services/assetTypes');

async function createBot(token) {
	const bot = new Bot(token);

	await bot.init();
	return bot;
}

const pageSize = 4;

const commands = {
	USDT: {
		button: 'asset_USDT',
		queryKey: 'USDT',
		assets: [AssetType.USDT.symbol],
	},

	BITCOIN: {
		button: 'asset_BITCOIN',
		queryKey: 'BITCOIN',
		assets: [AssetType.BTC.symbol],
	},

	GOLD: {
		button: 'asset_GOLD',
		queryKey: 'GOLD',
		assets: [AssetType.USD.symbol, AssetType.COIN.symbol, AssetType.GOLD18.symbol],
	},
};

const commandByQueryKey = Object.fromEntries(Object.values(commands).map((cmd) => [cmd.queryKey, cmd]));

async function setCommands(env, bot) {
	await bot.api.setMyCommands([
		{ command: 'start', description: 'شروع' },
		{ command: 'about', description: 'درباره' },
	]);

	bot.command('start', async (ctx) => {
		const averages = await GetAveragePrices(env);

		const tehranDateTime = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
			timeZone: 'Asia/Tehran',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(new Date());

		await ctx.reply(
			`📅 ${tehranDateTime}\n\n` +
				'قیمت‌ها به‌صورت میانگین محاسبه شده‌اند.\n' +
				'برای مشاهده جزئیات و ریز قیمت‌ها، روی هر گزینه کلیک کنید.',
			{
				reply_markup: {
					inline_keyboard: [
						// USD
						[
							{ text: 'دلار', callback_data: commands.GOLD.button },
							{ text: averages.USD.toLocaleString('fa-IR'), callback_data: 'noop' },
						],

						// USDT
						[
							{ text: 'تتر (USDT)', callback_data: commands.USDT.button },
							{ text: averages.USDT.toLocaleString('fa-IR'), callback_data: 'noop' },
						],

						// Gold
						[
							{ text: 'طلای ۱۸ عیار', callback_data: commands.GOLD.button },
							{ text: averages.GOLD18.toLocaleString('fa-IR'), callback_data: 'noop' },
						],

						// Coin
						[
							{ text: 'سکه', callback_data: commands.GOLD.button },
							{ text: averages.COIN.toLocaleString('fa-IR'), callback_data: 'noop' },
						],

						// Bitcoin
						[
							{ text: 'بیت‌کوین (BTC)', callback_data: commands.BITCOIN.button },
							{ text: averages.BTC.toLocaleString('fa-IR'), callback_data: 'noop' },
						],
					],
				},
			}
		);
	});

	setAboutCommand(bot);

	bot.callbackQuery(/asset_.+/, async (ctx) => {
		const asset = ctx.callbackQuery.data.replace('asset_', '');

		const assetsToLoad = commandByQueryKey[asset]?.assets || [];

		const tableName = asset + 'Table';
		const queryKey = asset;

		const tableData = await getTableData(env, 1, pageSize, assetsToLoad, asset);

		await ctx.reply('نرخ روز:', {
			reply_markup: createTable(tableName, queryKey, tableData, 1, pageSize),
		});
	});

	bot.on('callback_query:data', async (ctx) => {
		const data = ctx.callbackQuery.data;

		if (!data.startsWith('A;')) return;

		const parts = data.split(';');
		if (parts.length < 4) return;

		const queryKey = parts[2];
		const cmd = commandByQueryKey[queryKey];
		if (!cmd) return;

		const handler = createQueryHandler(env, cmd.assets, cmd.queryKey);

		return processATable(ctx, handler);
	});

	// Test command
	bot.command('ping', (ctx) => ctx.reply('🏓 pong!'));
}

function createQueryHandler(env, assetList, queryKey) {
	return {
		async getTableData(_, page, size, rowKey) {
			return await getTableData(env, page, size, assetList, queryKey);
		},
	};
}

function setAboutCommand(bot) {
	bot.command('about', async (ctx) => {
		const text = `
درود بر شما!
این بات برای نمایش قیمت لحظه‌ای ارزهای دیجیتال و طلا ساخته شده است.
منبع داده‌ها از چندین اکسچنج معتبر جمع‌آوری می‌شود تا بهترین قیمت‌ها را ارائه دهد.

اگر سوال یا پیشنهادی دارید، خوشحال می‌شوم بشنوم!

با تشکر از حمایت شما 🙏
		`;
		await ctx.reply(text);
	});
}

async function getTableData(env, page, pageSize, assets = []) {
	// Fetch all prices for these assets
	const all = await GetPrices(env, assets);
	// all = [ [exchangeName, {result, provider, assets}], ... ]

	// Flatten into rows
	const flatRows = [];

	for (const [exchange, { result, provider }] of all) {
		if (!result.success) continue;

		for (const item of result.data) {
			if (assets.includes(item.type.symbol)) {
				flatRows.push({
					asset: item.type.title,
					exchange: provider.title,
					price: item.price,
				});
			}
		}
	}

	// Total count BEFORE pagination
	const totalCount = flatRows.length;

	// Pagination
	const sliceStart = (page - 1) * pageSize;
	const slice = flatRows.slice(sliceStart, sliceStart + pageSize);

	// Average price per asset
	const grouped = {};
	for (const row of flatRows) {
		if (!grouped[row.asset]) grouped[row.asset] = [];
		grouped[row.asset].push(row.price);
	}

	const averageRows = Object.entries(grouped)
		.filter(([_, arr]) => arr.length > 1)
		.map(([asset, arr]) => ({
			asset,
			avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
		}));

	const tableData = {
		columns: ['ردیف', 'دارایی', 'اکسچنج', 'قیمت'],

		rows: [
			...slice.map((row, i) => ({
				key: `${row.asset}_${row.exchange}`,
				cells: [
					{ value: (sliceStart + i + 1).toLocaleString('fa-IR') },
					{ value: row.asset },
					{ value: row.exchange },
					{ value: row.price.toLocaleString('fa-IR') },
				],
			})),

			// Average rows (one per asset)
			...averageRows.map((avg) => ({
				key: `avg_${avg.asset}`,
				cells: [{ value: '📊' }, { value: avg.asset }, { value: 'میانگین' }, { value: avg.avg.toLocaleString('fa-IR') }],
			})),
		],

		totalCount,
	};

	return tableData;
}

export { createBot, setCommands };
