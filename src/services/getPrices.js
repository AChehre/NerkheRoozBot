const { getPrices } = require('./GetPrices/services/getPrices');

async function getUSDTPrices() {
	const allPrices = await getPrices();

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
