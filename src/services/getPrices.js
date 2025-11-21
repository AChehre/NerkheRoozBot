const { getPrices } = require('./GetPrices/services/getPrices');

const CACHE_KEY = "ALL_PRICES_CACHE";
const CACHE_TTL = 60; // 1 minute

async function cachedGetPrices(env) {
    const cached = await env.USDT_PRICES_CACHE.get(CACHE_KEY, { type: "json" });

    if (cached) {
        return cached;
    }

    const freshPrices = await getPrices();

    await env.USDT_PRICES_CACHE.put(
        CACHE_KEY,
        JSON.stringify(freshPrices),
        { expirationTtl: CACHE_TTL }
    );

    return freshPrices;
}

async function getUSDTPrices(env) {
	const allPrices = await cachedGetPrices(env);
	console.log('All prices fetched:', allPrices);
	const combined = {};
	for (const [key, result] of allPrices) {
		if (!result.success) {
			combined[key] = 0;
			continue;
		}

		const usdtItem = result.data.find((item) => item.type === 'USDTTMN');
		combined[key] = usdtItem ? usdtItem.price : 0;
	}

	return combined;
}


module.exports = { getUSDTPrices };
