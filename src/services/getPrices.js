const { getPrices } = require('./GetPrices/services/getPrices');

const CACHE_KEY = 'ALL_PRICES_CACHE';
const CACHE_TTL = 60; // 1 minute

async function cachedGetPrices(env, assets = []) {
	const cacheKey = assets.length > 0 ? `PRICES_${assets.join('_')}` : CACHE_KEY;

	const cached = await env.USDT_PRICES_CACHE.get(cacheKey, { type: 'json' });
	if (cached) {
		return cached;
	}

	const freshPrices = await getPrices(assets);

	await env.USDT_PRICES_CACHE.put(cacheKey, JSON.stringify(freshPrices), { expirationTtl: CACHE_TTL });

	return freshPrices;
}

module.exports = { cachedGetPrices };
