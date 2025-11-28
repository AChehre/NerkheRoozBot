const { getPrices } = require('./GetPrices/services/getPrices');

const CACHE_KEY = 'ALL_PRICES_CACHE';
const CACHE_TTL = 60; // 1 minute

async function cachedGetPrices(env, assets = []) {
	const cacheKey = assets && assets.length > 0 ? `PRICES_${assets.map((a) => a.toString().toUpperCase()).join('_')}` : CACHE_KEY;

	const cached = await env.PRICES_CACHE.get(cacheKey, { type: 'json' });
	if (cached) {
		return cached;
	}

	const freshPrices = await getPrices(assets);

	await env.PRICES_CACHE.put(cacheKey, JSON.stringify(freshPrices), { expirationTtl: CACHE_TTL });

	return freshPrices;
}

module.exports = { cachedGetPrices };
