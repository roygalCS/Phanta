const axios = require('axios');

// CoinGecko API for cryptocurrency market data
class CryptoAnalyticsService {
  constructor() {
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    // Common crypto IDs mapping
    this.cryptoMap = {
      'SOL': 'solana',
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'ATOM': 'cosmos',
      'ALGO': 'algorand',
      'NEAR': 'near',
      'FTM': 'fantom',
      'SAND': 'the-sandbox',
      'MANA': 'decentraland',
      'APE': 'apecoin',
      'GMT': 'stepn',
      'RAY': 'raydium',
      'ORCA': 'orca',
      'JUP': 'jupiter-exchange-solana',
    };
  }

  // Convert symbol to CoinGecko ID
  getCoinId(symbol) {
    const upperSymbol = symbol.toUpperCase();
    return this.cryptoMap[upperSymbol] || upperSymbol.toLowerCase();
  }

  // Get date range parameters
  getDateRange(range) {
    const now = Math.floor(Date.now() / 1000);
    const ranges = {
      '1mo': 30 * 24 * 60 * 60,
      '3mo': 90 * 24 * 60 * 60,
      '6mo': 180 * 24 * 60 * 60,
      '1y': 365 * 24 * 60 * 60,
      '2y': 730 * 24 * 60 * 60,
    };
    const days = ranges[range] || ranges['6mo'];
    return {
      from: now - days,
      to: now,
      days: Math.floor(days / (24 * 60 * 60))
    };
  }

  // Fetch historical price data for a cryptocurrency
  async getHistoricalData(coinId, days) {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        },
        timeout: 10000
      });

      const prices = response.data.prices || [];
      const marketCaps = response.data.market_caps || [];
      const volumes = response.data.total_volumes || [];

      return {
        prices: prices.map(([timestamp, price]) => ({
          date: new Date(timestamp).toISOString(),
          close: price,
          timestamp
        })),
        marketCaps: marketCaps.map(([timestamp, cap]) => ({
          date: new Date(timestamp).toISOString(),
          value: cap,
          timestamp
        })),
        volumes: volumes.map(([timestamp, volume]) => ({
          date: new Date(timestamp).toISOString(),
          value: volume,
          timestamp
        }))
      };
    } catch (error) {
      console.error(`Error fetching historical data for ${coinId}:`, error.message);
      throw new Error(`Failed to fetch data for ${coinId}: ${error.message}`);
    }
  }

  // Get current price and metadata
  async getCurrentPrice(coinId) {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        },
        timeout: 10000
      });

      const data = response.data;
      return {
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        currentPrice: data.market_data?.current_price?.usd || 0,
        marketCap: data.market_data?.market_cap?.usd || 0,
        totalVolume: data.market_data?.total_volume?.usd || 0,
        priceChange24h: data.market_data?.price_change_percentage_24h || 0,
        high24h: data.market_data?.high_24h?.usd || 0,
        low24h: data.market_data?.low_24h?.usd || 0,
      };
    } catch (error) {
      console.error(`Error fetching current price for ${coinId}:`, error.message);
      return null;
    }
  }

  // Calculate metrics from price series
  calculateMetrics(series) {
    if (!series || series.length < 2) {
      return {
        lastClose: 0,
        priceChangePercent: 0,
        historicalVolatility: 0,
        meanReturn: 0,
        stdReturn: 0,
        sharpeRatio: 0,
        skewness: 0,
        kurtosis: 0,
        sampleSize: 0
      };
    }

    const closes = series.map(p => p.close).filter(v => v > 0);
    if (closes.length < 2) {
      return {
        lastClose: closes[0] || 0,
        priceChangePercent: 0,
        historicalVolatility: 0,
        meanReturn: 0,
        stdReturn: 0,
        sharpeRatio: 0,
        skewness: 0,
        kurtosis: 0,
        sampleSize: closes.length
      };
    }

    const firstClose = closes[0];
    const lastClose = closes[closes.length - 1];
    const priceChangePercent = firstClose > 0 ? ((lastClose / firstClose) - 1) * 100 : 0;

    // Calculate log returns
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
      if (closes[i - 1] > 0) {
        returns.push(Math.log(closes[i] / closes[i - 1]));
      }
    }

    if (returns.length === 0) {
      return {
        lastClose,
        priceChangePercent,
        historicalVolatility: 0,
        meanReturn: 0,
        stdReturn: 0,
        sharpeRatio: 0,
        skewness: 0,
        kurtosis: 0,
        sampleSize: closes.length
      };
    }

    // Annualize returns (assuming daily data)
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const annualizedMean = meanReturn * 365;

    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdReturn = Math.sqrt(variance);
    const annualizedStd = stdReturn * Math.sqrt(365);
    const historicalVolatility = annualizedStd * 100;

    // Sharpe ratio (assuming risk-free rate of 0 for crypto)
    const sharpeRatio = annualizedStd > 0 ? annualizedMean / annualizedStd : 0;

    // Skewness
    const skewness = returns.length > 2
      ? returns.reduce((sum, r) => sum + Math.pow((r - meanReturn) / stdReturn, 3), 0) / returns.length
      : 0;

    // Kurtosis
    const kurtosis = returns.length > 2
      ? returns.reduce((sum, r) => sum + Math.pow((r - meanReturn) / stdReturn, 4), 0) / returns.length - 3
      : 0;

    return {
      lastClose,
      priceChangePercent,
      historicalVolatility,
      meanReturn: annualizedMean * 100,
      stdReturn: annualizedStd * 100,
      sharpeRatio,
      skewness,
      kurtosis,
      sampleSize: returns.length
    };
  }

  // Build correlation matrix
  buildCorrelationMatrix(symbols, alignedDates, priceMaps) {
    const matrix = symbols.map(() => symbols.map(() => 0));

    for (let i = 0; i < symbols.length; i++) {
      for (let j = 0; j < symbols.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const returnsI = [];
          const returnsJ = [];
          const mapI = priceMaps[i];
          const mapJ = priceMaps[j];

          for (let k = 1; k < alignedDates.length; k++) {
            const priceI = mapI.get(alignedDates[k]);
            const priceIPrev = mapI.get(alignedDates[k - 1]);
            const priceJ = mapJ.get(alignedDates[k]);
            const priceJPrev = mapJ.get(alignedDates[k - 1]);

            if (priceI && priceIPrev && priceJ && priceJPrev && priceIPrev > 0 && priceJPrev > 0) {
              returnsI.push(Math.log(priceI / priceIPrev));
              returnsJ.push(Math.log(priceJ / priceJPrev));
            }
          }

          if (returnsI.length > 1 && returnsJ.length > 1) {
            const meanI = returnsI.reduce((a, b) => a + b, 0) / returnsI.length;
            const meanJ = returnsJ.reduce((a, b) => a + b, 0) / returnsJ.length;

            let covariance = 0;
            let varI = 0;
            let varJ = 0;

            for (let k = 0; k < returnsI.length; k++) {
              const diffI = returnsI[k] - meanI;
              const diffJ = returnsJ[k] - meanJ;
              covariance += diffI * diffJ;
              varI += diffI * diffI;
              varJ += diffJ * diffJ;
            }

            covariance /= returnsI.length;
            const stdI = Math.sqrt(varI / returnsI.length);
            const stdJ = Math.sqrt(varJ / returnsJ.length);

            if (stdI > 0 && stdJ > 0) {
              matrix[i][j] = covariance / (stdI * stdJ);
            }
          }
        }
      }
    }

    return matrix;
  }

  // Get crypto insights with analytics
  async getCryptoInsights({ symbols, range, interval }) {
    const errors = [];
    const data = [];
    const dateRange = this.getDateRange(range);

    // Fetch data for all symbols
    for (const symbol of symbols) {
      try {
        const coinId = this.getCoinId(symbol);
        const [historicalData, currentData] = await Promise.all([
          this.getHistoricalData(coinId, dateRange.days),
          this.getCurrentPrice(coinId)
        ]);

        if (!historicalData || historicalData.prices.length === 0) {
          errors.push({ symbol, message: `No historical data available` });
          continue;
        }

        const series = historicalData.prices.map(p => ({
          date: p.date,
          close: p.close
        }));

        const metrics = this.calculateMetrics(series);

        data.push({
          symbol: currentData?.symbol || symbol.toUpperCase(),
          name: currentData?.name || symbol,
          series,
          metrics: {
            ...metrics,
            marketCap: currentData?.marketCap || 0,
            volume24h: currentData?.totalVolume || 0,
            high24h: currentData?.high24h || 0,
            low24h: currentData?.low24h || 0,
          },
          meta: {
            currency: 'USD',
            coinId
          }
        });
      } catch (error) {
        errors.push({ symbol, message: error.message || 'Failed to fetch data' });
      }
    }

    if (data.length === 0) {
      throw new Error('No data could be fetched for any of the requested cryptocurrencies');
    }

    // Build correlation analytics
    const priceMaps = data.map((entry) => 
      new Map(entry.series.map((point) => [point.date.slice(0, 10), point.close]))
    );

    // Get aligned dates
    const dateSets = priceMaps.map(map => new Set(map.keys()));
    const alignedDates = dateSets.reduce((intersection, set) => {
      return new Set([...intersection].filter(date => set.has(date)));
    }, dateSets[0] || new Set());

    const sortedDates = Array.from(alignedDates).sort();

    const returnsCorrelationMatrix = this.buildCorrelationMatrix(
      data.map(d => d.symbol),
      sortedDates,
      priceMaps
    );

    // Rolling correlations (30-day window)
    const rollingCorrelations = [];
    if (data.length >= 2) {
      for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
          const seriesI = data[i].series;
          const seriesJ = data[j].series;
          const rolling = [];

          for (let k = 29; k < sortedDates.length; k++) {
            const window = sortedDates.slice(k - 29, k + 1);
            const returnsI = [];
            const returnsJ = [];

            for (let w = 1; w < window.length; w++) {
              const priceI = priceMaps[i].get(window[w]);
              const priceIPrev = priceMaps[i].get(window[w - 1]);
              const priceJ = priceMaps[j].get(window[w]);
              const priceJPrev = priceMaps[j].get(window[w - 1]);

              if (priceI && priceIPrev && priceJ && priceJPrev && priceIPrev > 0 && priceJPrev > 0) {
                returnsI.push(Math.log(priceI / priceIPrev));
                returnsJ.push(Math.log(priceJ / priceJPrev));
              }
            }

            if (returnsI.length > 1 && returnsJ.length > 1) {
              const meanI = returnsI.reduce((a, b) => a + b, 0) / returnsI.length;
              const meanJ = returnsJ.reduce((a, b) => a + b, 0) / returnsJ.length;

              let covariance = 0;
              let varI = 0;
              let varJ = 0;

              for (let w = 0; w < returnsI.length; w++) {
                const diffI = returnsI[w] - meanI;
                const diffJ = returnsJ[w] - meanJ;
                covariance += diffI * diffJ;
                varI += diffI * diffI;
                varJ += diffJ * diffJ;
              }

              const stdI = Math.sqrt(varI / returnsI.length);
              const stdJ = Math.sqrt(varJ / returnsJ.length);

              if (stdI > 0 && stdJ > 0) {
                const correlation = (covariance / returnsI.length) / (stdI * stdJ);
                rolling.push({
                  date: window[window.length - 1],
                  value: correlation
                });
              }
            }
          }

          if (rolling.length > 0) {
            rollingCorrelations.push({
              pair: [data[i].symbol, data[j].symbol],
              series: rolling
            });
          }
        }
      }
    }

    // Regression analytics
    const regressionAnalytics = [];
    if (data.length >= 2) {
      for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
          const returnsI = [];
          const returnsJ = [];
          const scatter = [];

          for (let k = 1; k < sortedDates.length; k++) {
            const priceI = priceMaps[i].get(sortedDates[k]);
            const priceIPrev = priceMaps[i].get(sortedDates[k - 1]);
            const priceJ = priceMaps[j].get(sortedDates[k]);
            const priceJPrev = priceMaps[j].get(sortedDates[k - 1]);

            if (priceI && priceIPrev && priceJ && priceJPrev && priceIPrev > 0 && priceJPrev > 0) {
              const retI = Math.log(priceI / priceIPrev);
              const retJ = Math.log(priceJ / priceJPrev);
              returnsI.push(retI);
              returnsJ.push(retJ);
              scatter.push({ x: retI, y: retJ });
            }
          }

          if (returnsI.length > 1 && returnsJ.length > 1) {
            const meanI = returnsI.reduce((a, b) => a + b, 0) / returnsI.length;
            const meanJ = returnsJ.reduce((a, b) => a + b, 0) / returnsJ.length;

            let sumXY = 0;
            let sumX2 = 0;

            for (let k = 0; k < returnsI.length; k++) {
              const diffI = returnsI[k] - meanI;
              const diffJ = returnsJ[k] - meanJ;
              sumXY += diffI * diffJ;
              sumX2 += diffI * diffI;
            }

            const beta = sumX2 > 0 ? sumXY / sumX2 : 0;
            const alpha = meanJ - beta * meanI;

            const stdI = Math.sqrt(returnsI.reduce((sum, r) => sum + Math.pow(r - meanI, 2), 0) / returnsI.length);
            const stdJ = Math.sqrt(returnsJ.reduce((sum, r) => sum + Math.pow(r - meanJ, 2), 0) / returnsJ.length);
            const correlation = stdI > 0 && stdJ > 0
              ? returnsI.reduce((sum, r, idx) => sum + ((r - meanI) * (returnsJ[idx] - meanJ)), 0) / (returnsI.length * stdI * stdJ)
              : 0;

            const ssRes = returnsJ.reduce((sum, r, idx) => {
              const predicted = alpha + beta * returnsI[idx];
              return sum + Math.pow(r - predicted, 2);
            }, 0);

            const ssTot = returnsJ.reduce((sum, r) => sum + Math.pow(r - meanJ, 2), 0);
            const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

            const minX = Math.min(...returnsI);
            const maxX = Math.max(...returnsI);
            const regressionLine = [
              { x: minX, y: alpha + beta * minX },
              { x: maxX, y: alpha + beta * maxX }
            ];

            regressionAnalytics.push({
              pair: [data[i].symbol, data[j].symbol],
              beta,
              alpha,
              correlation,
              rSquared,
              sampleSize: returnsI.length,
              scatter: scatter.slice(0, 500), // Limit scatter points for performance
              regressionLine
            });
          }
        }
      }
    }

    return {
      range,
      interval,
      data,
      analytics: {
        symbols: data.map(d => d.symbol),
        returnsCorrelationMatrix,
        rollingCorrelations,
        regressionAnalytics
      },
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

module.exports = new CryptoAnalyticsService();

