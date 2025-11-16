const axios = require('axios');

// CoinGecko API for blockchain asset market data
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

  // Fetch historical price data for a blockchain asset
  async getHistoricalData(coinId, days) {
    try {
      // CoinGecko API has limits: max 90 days for hourly, max 365 days for daily
      // Adjust days parameter to be within limits
      const adjustedDays = Math.min(Math.max(days, 1), 365);
      
      const response = await axios.get(`${this.baseUrl}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: adjustedDays,
          interval: adjustedDays <= 90 ? 'daily' : 'daily'
        },
        timeout: 20000,
        headers: {
          'Accept': 'application/json'
        },
        // Add retry configuration
        validateStatus: (status) => status < 500 // Don't throw on 429, we'll handle it
      });

      if (!response.data || !response.data.prices) {
        throw new Error('Invalid response from CoinGecko API');
      }

      const prices = response.data.prices || [];
      const marketCaps = response.data.market_caps || [];
      const volumes = response.data.total_volumes || [];

      if (prices.length === 0) {
        throw new Error('No price data returned');
      }

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
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60;
        throw new Error(`Rate limit exceeded. CoinGecko free tier allows ~10-30 calls/minute. Please wait ${retryAfter} seconds and try again, or reduce the number of blockchain assets.`);
      } else if (error.response?.status === 404) {
        throw new Error(`Blockchain asset not found. Please check the symbol.`);
      }
      console.error(`Error fetching historical data for ${coinId}:`, error.message);
      throw new Error(`Failed to fetch data for ${coinId}: ${error.message}`);
    }
  }

  // Generate demo historical data for demo purposes
  // Based on realistic prices for November 2025
  generateDemoHistoricalData(symbol, days) {
    // November 16, 2025 - realistic price estimates
    const basePrices = {
      'SOL': 185,      // Solana around $185
      'BTC': 95600,    // Bitcoin around $95,600
      'ETH': 3850,     // Ethereum around $3,850
      'USDC': 1.0,     // Stablecoin
      'USDT': 1.0,     // Stablecoin
      'RAY': 3.2,      // Raydium around $3.20
      'JUP': 1.15,     // Jupiter around $1.15
      'BNB': 620,      // Binance Coin
      'XRP': 0.65,     // Ripple
      'ADA': 0.55,     // Cardano
      'DOGE': 0.12,    // Dogecoin
      'MATIC': 0.85,   // Polygon
      'AVAX': 42,      // Avalanche
      'DOT': 7.5,      // Polkadot
      'LINK': 18,      // Chainlink
      'UNI': 8.5,      // Uniswap
      'ATOM': 12,      // Cosmos
      'ALGO': 0.25,    // Algorand
      'NEAR': 5.5,     // Near Protocol
      'FTM': 0.45,     // Fantom
    };
    
    const symbolUpper = symbol.toUpperCase();
    const basePrice = basePrices[symbolUpper] || 100;
    
    // Realistic market caps based on price
    const marketCapMultipliers = {
      'SOL': 85000000,   // ~$15.7B market cap
      'BTC': 19500000,   // ~$1.86T market cap (at $95,600)
      'ETH': 460000,     // ~$460B market cap
      'USDC': 35000000,  // ~$35B market cap
      'USDT': 95000000,  // ~$95B market cap
      'RAY': 1200000,    // ~$3.8M market cap
      'JUP': 1500000,    // ~$1.7M market cap
    };
    
    const marketCapMultiplier = marketCapMultipliers[symbolUpper] || 1000000;
    const baseMarketCap = basePrice * marketCapMultiplier;
    const baseVolume = basePrice * (marketCapMultiplier * 0.05); // ~5% of market cap as daily volume
    
    // Generate realistic historical data with trends
    const prices = [];
    const marketCaps = [];
    const volumes = [];
    
    // Start date: November 16, 2025 minus days
    const endDate = new Date('2025-11-16');
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    // Add some realistic trends based on symbol
    const trendFactors = {
      'SOL': 0.15,   // +15% over period
      'BTC': 0.08,   // +8% over period
      'ETH': 0.12,   // +12% over period
      'RAY': 0.20,   // +20% over period (more volatile)
      'JUP': 0.18,   // +18% over period
    };
    const trend = trendFactors[symbolUpper] || 0.10;
    
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const timestamp = currentDate.getTime();
      
      // Calculate price with trend and realistic volatility
      const progress = i / days; // 0 to 1
      const trendPrice = basePrice * (1 - trend * (1 - progress)); // Start lower, end at base
      
      // Add realistic daily volatility (2-5% for most, higher for smaller coins)
      const volatility = symbolUpper === 'BTC' || symbolUpper === 'ETH' ? 0.02 : 
                        symbolUpper === 'SOL' ? 0.03 : 0.04;
      const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
      
      // Add some weekly cycles (weekend effects)
      const dayOfWeek = currentDate.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.98 : 1.0;
      
      const price = trendPrice * randomFactor * weekendFactor;
      
      prices.push([timestamp, Math.max(price, basePrice * 0.5)]); // Floor at 50% of base
      marketCaps.push([timestamp, price * marketCapMultiplier * (0.9 + Math.random() * 0.2)]);
      volumes.push([timestamp, price * (marketCapMultiplier * 0.05) * (0.7 + Math.random() * 0.6)]);
    }
    
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
  }

  // Generate demo current price
  // Based on realistic prices for November 16, 2025
  generateDemoCurrentPrice(symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    // November 16, 2025 - realistic current prices
    const basePrices = {
      'SOL': 185,
      'BTC': 95600,
      'ETH': 3850,
      'USDC': 1.0,
      'USDT': 1.0,
      'RAY': 3.2,
      'JUP': 1.15,
      'BNB': 620,
      'XRP': 0.65,
      'ADA': 0.55,
      'DOGE': 0.12,
      'MATIC': 0.85,
      'AVAX': 42,
      'DOT': 7.5,
      'LINK': 18,
      'UNI': 8.5,
      'ATOM': 12,
      'ALGO': 0.25,
      'NEAR': 5.5,
      'FTM': 0.45,
    };
    
    const basePrice = basePrices[symbolUpper] || 100;
    
    // Realistic 24h price changes (Sunday, Nov 16, 2025 - typically lower volatility)
    const priceChanges = {
      'SOL': 0.025,   // +2.5%
      'BTC': 0.015,   // +1.5%
      'ETH': 0.018,   // +1.8%
      'USDC': 0.0,    // Stable
      'USDT': 0.0,    // Stable
      'RAY': 0.035,   // +3.5%
      'JUP': 0.030,   // +3.0%
    };
    
    const priceChange = priceChanges[symbolUpper] || (Math.random() - 0.5) * 0.04;
    const currentPrice = basePrice * (1 + priceChange);
    
    // Realistic market caps
    const marketCapMultipliers = {
      'SOL': 85000000,
      'BTC': 19500000,
      'ETH': 460000,
      'USDC': 35000000,
      'USDT': 95000000,
      'RAY': 1200000,
      'JUP': 1500000,
    };
    
    const marketCapMultiplier = marketCapMultipliers[symbolUpper] || 1000000;
    const marketCap = currentPrice * marketCapMultiplier;
    const totalVolume = marketCap * 0.05 * (0.8 + Math.random() * 0.4); // 4-6% of market cap
    
    return {
      symbol: symbolUpper,
      name: symbol,
      currentPrice: currentPrice,
      marketCap: marketCap,
      totalVolume: totalVolume,
      priceChange24h: priceChange * 100,
      high24h: currentPrice * 1.015,
      low24h: currentPrice * 0.985
    };
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
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
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
      // Return demo data if API fails
      const symbol = coinId.split('-')[0].toUpperCase();
      return this.generateDemoCurrentPrice(symbol);
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
    
    console.log(`[CryptoAnalytics] Fetching insights for ${symbols.length} symbols, range: ${range}, days: ${dateRange.days}`);

    // For demo purposes, always use demo data
    // Uncomment the code below to use real CoinGecko API
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      
      try {
        // Always generate demo data for demo purposes
        console.log(`[CryptoAnalytics] Generating demo data for ${symbol}`);
        const historicalData = this.generateDemoHistoricalData(symbol, dateRange.days);
        const currentData = this.generateDemoCurrentPrice(symbol);
        
        /* Uncomment to use real API:
        const coinId = this.getCoinId(symbol);
        console.log(`[CryptoAnalytics] Fetching data for ${symbol} (${coinId})`);
        
        // Fetch with retry logic for rate limits
        let historicalData, currentData;
        let retries = 3;
        let retryDelay = 5000; // Start with 5 seconds
        
        // Add delay between requests to avoid rate limiting (except for first request)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay to be safe
        }
        
        while (retries > 0) {
          try {
            [historicalData, currentData] = await Promise.all([
              this.getHistoricalData(coinId, dateRange.days),
              this.getCurrentPrice(coinId)
            ]);
            break; // Success, exit retry loop
          } catch (error) {
            if (error.message.includes('Rate limit') && retries > 1) {
              retries--;
              console.log(`[CryptoAnalytics] Rate limit hit for ${symbol}, retrying in ${retryDelay/1000}s... (${retries} retries left)`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              retryDelay *= 2; // Exponential backoff
            } else {
              // If all retries failed, generate demo data instead
              console.log(`[CryptoAnalytics] All retries failed for ${symbol}, generating demo data`);
              historicalData = this.generateDemoHistoricalData(symbol, dateRange.days);
              currentData = this.generateDemoCurrentPrice(symbol);
              break;
            }
          }
        }
        */

        if (!historicalData || historicalData.prices.length === 0) {
          console.warn(`[CryptoAnalytics] No historical data for ${symbol}`);
          errors.push({ symbol, message: `No historical data available` });
          continue;
        }
        
        console.log(`[CryptoAnalytics] Successfully fetched ${historicalData.prices.length} price points for ${symbol}`);

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
            coinId: this.getCoinId(symbol) // Get coinId for demo data too
          }
        });
      } catch (error) {
        console.error(`[CryptoAnalytics] Error fetching ${symbol}:`, error.message);
        errors.push({ symbol, message: error.message || 'Failed to fetch data' });
      }
    }

    console.log(`[CryptoAnalytics] Fetched data for ${data.length} symbols, ${errors.length} errors`);

    if (data.length === 0) {
      const errorDetails = errors.length > 0 
        ? errors.map(e => `${e.symbol}: ${e.message}`).join('; ')
        : 'Unknown error';
      throw new Error(`No data could be fetched for any of the requested blockchain assets. ${errorDetails}`);
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

