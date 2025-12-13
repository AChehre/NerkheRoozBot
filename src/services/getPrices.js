const BASE_URL = 'https://internal/api/v1/prices';
const CACHE_TTL = 60; // 1 minute

async function GetPrices(env, assets = []) {
	const allPricesCacheKey = 'ALL_PRICES_CACHE';
	const cacheKey = assets && assets.length > 0 ? `PRICES_${assets.map((a) => a.toString().toUpperCase()).join('_')}` : allPricesCacheKey;

	const cached = await env.PRICES_CACHE.get(cacheKey, { type: 'json' });
	if (cached) {
		return cached;
	}

	const url = assets && assets.length > 0 ? `${BASE_URL}?assets=${assets.join(',')}` : BASE_URL;

	const response = await env.NERKHE_ROOZ_API.fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch prices: ${response.status}`);
	}

	const prices = await response.json();

	await env.PRICES_CACHE.put(cacheKey, JSON.stringify(prices), { expirationTtl: CACHE_TTL });

	return prices;
}

async function GetAveragePrices(env, assets = []) {
	const averagePricesCacheKey = 'AVERAGE_PRICES_CACHE';
	const cacheKey =
		assets && assets.length > 0 ? `AVERAGE_PRICES_${assets.map((a) => a.toString().toUpperCase()).join('_')}` : averagePricesCacheKey;
	const cached = await env.PRICES_CACHE.get(cacheKey, { type: 'json' });

	if (cached) {
		return cached;
	}

	const averagePriceUrl = BASE_URL + '/average';
	const url = assets && assets.length > 0 ? `${averagePriceUrl}?assets=${assets.join(',')}` : averagePriceUrl;
	const response = await env.NERKHE_ROOZ_API.fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch average prices: ${response.status}`);
	}

	const averagePrices = await response.json();

	await env.PRICES_CACHE.put(cacheKey, JSON.stringify(averagePrices), { expirationTtl: CACHE_TTL });

	return averagePrices;
}

module.exports = {
	GetPrices,
	GetAveragePrices,
};
