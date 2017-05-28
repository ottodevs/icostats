/* eslint-disable no-console */
import { normalize as normalizeICO } from 'lib/icos';
import icoData from 'lib/ico-data';
import { fetchCurrentPrice } from 'lib/gdax';
import { cache } from 'app';
import Ticker from 'models/ticker';

export default async function icos() {
  const tickers = await Ticker.find();
  const results = icoData.map(data => ({
    ...data,
    ...( tickers.find(t => t.ticker === data.ticker)._doc ),
    id: data.id
  }));

  // Get the current ETH price
  let ethPrice = cache.get('ethPrice');
  let btcPrice = cache.get('btcPrice');

  if (!ethPrice) {
    try {
      ethPrice = await fetchCurrentPrice('ETH');
    } catch (e) {
      const ticker = tickers.find(t => t.symbol === 'ETH');

      ethPrice = ticker.price_usd;
      console.log('Fetched fallback ETH price (%s) from db.', ethPrice);
    }
    cache.set('ethPrice', ethPrice);
  }

  if (!btcPrice) {
    try {
      btcPrice = await fetchCurrentPrice('BTC');
    } catch (e) {
      const ticker = tickers.find(t => t.symbol === 'BTC');

      btcPrice = ticker.price_usd;
      console.log('Fetched fallback BTC price (%s) from db.', btcPrice);
    }
    cache.set('btcPrice', btcPrice);
  }

  return results.map(ico => normalizeICO(ico, ethPrice, btcPrice));
}