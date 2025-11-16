const https = require('https');

const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const DEFAULT_RANGE = '1y';
const DEFAULT_INTERVAL = '1d';
const TRADING_DAYS_PER_YEAR = 252;

const buildYahooUrl = (symbol, { range = DEFAULT_RANGE, interval = DEFAULT_INTERVAL } = {}) => {
  const params = new URLSearchParams({
    range,
    interval,
    includePrePost: 'false',
    events: 'div,splits',
    lang: 'en-US',
    region: 'US',
    corsDomain: 'finance.yahoo.com',
    includeAdjustedClose: 'true'
  });

  return `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?${params.toString()}`;
};

const fetchYahooChart = (symbol, options) => {
  const url = buildYahooUrl(symbol, options);

  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'PhantaAnalytics/1.0 (+https://phanta.local)',
          Accept: 'application/json',
          'Accept-Encoding': 'identity'
        }
      },
      (res) => {
        let rawData = '';

        if (res.statusCode && res.statusCode >= 400) {
          res.resume();
          return reject(new Error(`Yahoo Finance responded with status ${res.statusCode}`));
        }

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve(parsed);
          } catch (error) {
            error.rawBody = rawData;
            reject(error);
          }
        });
      }
    );

    request.on('error', reject);
  });
};

const extractSeries = (payload) => {
  const result = payload?.chart?.result?.[0];
  if (!result) {
    const message = payload?.chart?.error?.description || 'Unknown response shape from Yahoo Finance';
    throw new Error(message);
  }

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const closes = quote.close || [];
  const opens = quote.open || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const volumes = quote.volume || [];

  const series = [];

  for (let idx = 0; idx < timestamps.length; idx += 1) {
    const close = closes[idx];
    const open = opens[idx];
    const high = highs[idx];
    const low = lows[idx];
    const volume = volumes[idx];

    if (close == null) {
      continue;
    }

    const ts = timestamps[idx] * 1000;
    series.push({
      date: new Date(ts).toISOString(),
      close,
      open: open ?? null,
      high: high ?? null,
      low: low ?? null,
      volume: volume ?? null
    });
  }

  return {
    series,
    meta: result.meta || {}
  };
};

const computeLogReturns = (series) => {
  const returns = [];

  for (let idx = 1; idx < series.length; idx += 1) {
    const prev = series[idx - 1].close;
    const current = series[idx].close;

    if (prev > 0 && current > 0) {
      returns.push(Math.log(current / prev));
    }
  }

  return returns;
};

const mean = (values) => {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
};

const sampleStdDev = (values, valuesMean = null) => {
  if (values.length < 2) return 0;
  const mu = valuesMean ?? mean(values);
  const variance = values.reduce((acc, value) => acc + ((value - mu) ** 2), 0) / (values.length - 1);
  return Math.sqrt(Math.max(variance, 0));
};

const sampleSkewness = (values) => {
  if (values.length < 3) return 0;
  const mu = mean(values);
  const sigma = sampleStdDev(values, mu);
  if (sigma === 0) return 0;

  const n = values.length;
  const sumCubed = values.reduce((acc, value) => acc + ((value - mu) ** 3), 0);
  return (n / ((n - 1) * (n - 2))) * (sumCubed / (sigma ** 3));
};

const sampleExcessKurtosis = (values) => {
  if (values.length < 4) return 0;
  const mu = mean(values);
  const sigma = sampleStdDev(values, mu);
  if (sigma === 0) return 0;

  const n = values.length;
  const sumFourth = values.reduce((acc, value) => acc + ((value - mu) ** 4), 0);

  const numerator = (n * (n + 1) * sumFourth) / (((n - 1) * (n - 2) * (n - 3)) * (sigma ** 4));
  const denominator = (3 * ((n - 1) ** 2)) / ((n - 2) * (n - 3));

  return numerator - denominator;
};

const buildMetrics = (series, returns) => {
  if (!series.length) {
    return {
      sampleSize: 0,
      historicalVolatility: 0,
      skewness: 0,
      kurtosis: 0,
      meanReturn: 0,
      stdReturn: 0,
      sharpeRatio: 0,
      priceChangePercent: 0
    };
  }

  const lastClose = series[series.length - 1].close;
  const firstClose = series[0].close;
  const priceChangePercent = firstClose > 0 ? ((lastClose / firstClose) - 1) * 100 : 0;

  if (!returns.length) {
    return {
      sampleSize: 0,
      historicalVolatility: 0,
      skewness: 0,
      kurtosis: 0,
      meanReturn: 0,
      stdReturn: 0,
      sharpeRatio: 0,
      priceChangePercent,
      lastClose
    };
  }

  const mu = mean(returns);
  const sigma = sampleStdDev(returns, mu);
  const annualisedMean = mu * TRADING_DAYS_PER_YEAR;
  const annualisedStd = sigma * Math.sqrt(TRADING_DAYS_PER_YEAR);
  const sharpeRatio = sigma === 0 ? 0 : (mu * Math.sqrt(TRADING_DAYS_PER_YEAR)) / sigma;

  return {
    sampleSize: returns.length,
    historicalVolatility: annualisedStd * 100,
    skewness: sampleSkewness(returns),
    kurtosis: sampleExcessKurtosis(returns),
    meanReturn: annualisedMean * 100,
    stdReturn: annualisedStd * 100,
    sharpeRatio,
    priceChangePercent,
    lastClose
  };
};

const formatReturnsSeries = (series) => {
  const formatted = [];

  for (let idx = 1; idx < series.length; idx += 1) {
    const current = series[idx];
    const prev = series[idx - 1];
    if (prev.close > 0 && current.close > 0) {
      formatted.push({
        date: current.date,
        value: Math.log(current.close / prev.close)
      });
    }
  }

  return formatted;
};

const computePearsonCorrelation = (xValues, yValues) => {
  const length = Math.min(xValues.length, yValues.length);
  if (length < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  let sumXY = 0;
  let count = 0;

  for (let idx = 0; idx < length; idx += 1) {
    const x = xValues[idx];
    const y = yValues[idx];

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }

    count += 1;
    sumX += x;
    sumY += y;
    sumX2 += x * x;
    sumY2 += y * y;
    sumXY += x * y;
  }

  if (count < 2) {
    return 0;
  }

  const numerator = count * sumXY - sumX * sumY;
  const denominator = Math.sqrt((count * sumX2 - sumX ** 2) * (count * sumY2 - sumY ** 2));

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
};

const intersectDateSets = (maps) => {
  if (!maps.length) return [];

  let intersection = new Set(maps[0].keys());

  for (let idx = 1; idx < maps.length; idx += 1) {
    const currentKeys = new Set(maps[idx].keys());
    intersection = new Set([...intersection].filter((date) => currentKeys.has(date)));
    if (intersection.size === 0) {
      break;
    }
  }

  return Array.from(intersection).sort();
};

const alignPairValues = (mapA, mapB, dates) => {
  const alignedDates = [];
  const xValues = [];
  const yValues = [];

  dates.forEach((date) => {
    const x = mapA.get(date);
    const y = mapB.get(date);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      alignedDates.push(date);
      xValues.push(x);
      yValues.push(y);
    }
  });

  return { dates: alignedDates, xValues, yValues };
};

const buildCorrelationMatrix = (symbols, dates, maps) => {
  if (!dates.length) {
    return null;
  }

  const matrix = symbols.map(() => symbols.map(() => 1));

  for (let row = 0; row < symbols.length; row += 1) {
    for (let col = row; col < symbols.length; col += 1) {
      if (row === col) {
        matrix[row][col] = 1;
        continue;
      }

      const { xValues, yValues } = alignPairValues(maps[row], maps[col], dates);
      const correlation = computePearsonCorrelation(xValues, yValues);
      matrix[row][col] = correlation;
      matrix[col][row] = correlation;
    }
  }

  return matrix;
};

const computeRollingCorrelationSeries = (alignedDates, xValues, yValues, window = 30) => {
  const length = Math.min(xValues.length, yValues.length, alignedDates.length);
  if (length < window) {
    return [];
  }

  const series = [];

  for (let idx = window - 1; idx < length; idx += 1) {
    const start = idx - window + 1;
    const sliceX = xValues.slice(start, idx + 1);
    const sliceY = yValues.slice(start, idx + 1);
    const correlation = computePearsonCorrelation(sliceX, sliceY);
    series.push({
      date: alignedDates[idx],
      value: correlation
    });
  }

  return series;
};

const downSampleScatter = (points, maxPoints = 400) => {
  if (points.length <= maxPoints) {
    return points;
  }

  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % step === 0);
};

const buildRegressionLine = (beta, alpha, xValues) => {
  if (!xValues.length) return [];
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  return [
    { x: minX, y: alpha + beta * minX },
    { x: maxX, y: alpha + beta * maxX }
  ];
};

const buildRegressionAnalytics = (symbols, dates, maps) => {
  if (!dates.length) {
    return [];
  }

  const results = [];

  for (let row = 0; row < symbols.length; row += 1) {
    for (let col = row + 1; col < symbols.length; col += 1) {
      const { dates: alignedDates, xValues, yValues } = alignPairValues(maps[row], maps[col], dates);
      const sampleSize = Math.min(xValues.length, yValues.length);

      if (sampleSize < 20) {
        continue;
      }

      const meanX = mean(xValues);
      const meanY = mean(yValues);
      const sigmaX = sampleStdDev(xValues, meanX);
      const sigmaY = sampleStdDev(yValues, meanY);

      if (sigmaX === 0 || sigmaY === 0) {
        continue;
      }

      let covariance = 0;
      for (let idx = 0; idx < sampleSize; idx += 1) {
        covariance += (xValues[idx] - meanX) * (yValues[idx] - meanY);
      }
      covariance /= (sampleSize - 1);

      const beta = covariance / (sigmaX ** 2);
      const alpha = meanY - beta * meanX;
      const correlation = computePearsonCorrelation(xValues, yValues);
      const rSquared = correlation ** 2;

      const scatter = downSampleScatter(
        alignedDates.map((date, index) => ({ x: xValues[index], y: yValues[index], date }))
      );

      results.push({
        pair: [symbols[row], symbols[col]],
        beta,
        alpha,
        rSquared,
        correlation,
        sampleSize,
        scatter,
        regressionLine: buildRegressionLine(beta, alpha, xValues)
      });
    }
  }

  return results;
};

const buildRollingCorrelationAnalytics = (symbols, dates, maps, window = 30) => {
  if (!dates.length) {
    return [];
  }

  const results = [];

  for (let row = 0; row < symbols.length; row += 1) {
    for (let col = row + 1; col < symbols.length; col += 1) {
      const { dates: alignedDates, xValues, yValues } = alignPairValues(maps[row], maps[col], dates);
      const length = Math.min(xValues.length, yValues.length);

      if (length < window) {
        continue;
      }

      const series = computeRollingCorrelationSeries(alignedDates.slice(-length), xValues.slice(-length), yValues.slice(-length), window);

      if (series.length) {
        results.push({
          pair: [symbols[row], symbols[col]],
          series
        });
      }
    }
  }

  return results;
};

const buildAnalytics = (data) => {
  if (data.length < 2) {
    return null;
  }

  const symbols = data.map((entry) => entry.symbol);

  const priceMaps = data.map((entry) => new Map(entry.series.map((point) => [point.date.slice(0, 10), point.close])));
  const returnMaps = data.map((entry) => new Map(entry.returns.map((point) => [point.date.slice(0, 10), point.value])));

  const alignedPriceDates = intersectDateSets(priceMaps);
  const alignedReturnDates = intersectDateSets(returnMaps);

  const priceCorrelationMatrix = buildCorrelationMatrix(symbols, alignedPriceDates, priceMaps);
  const returnsCorrelationMatrix = buildCorrelationMatrix(symbols, alignedReturnDates, returnMaps);
  const regressionAnalytics = buildRegressionAnalytics(symbols, alignedReturnDates, returnMaps);
  const rollingCorrelations = buildRollingCorrelationAnalytics(symbols, alignedReturnDates, returnMaps);

  return {
    symbols,
    priceCorrelationMatrix,
    returnsCorrelationMatrix,
    regressionAnalytics,
    rollingCorrelations
  };
};

const analyseSymbol = async (symbol, options) => {
  const payload = await fetchYahooChart(symbol, options);
  const { series, meta } = extractSeries(payload);
  const returns = computeLogReturns(series);

  return {
    symbol,
    meta,
    series,
    returns: formatReturnsSeries(series),
    metrics: buildMetrics(series, returns)
  };
};

const getStockInsights = async ({ symbols = [], range = DEFAULT_RANGE, interval = DEFAULT_INTERVAL } = {}) => {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error('Provide at least one ticker symbol.');
  }

  const analysisPromises = symbols.map((symbol) =>
    analyseSymbol(symbol.trim().toUpperCase(), { range, interval })
      .then((result) => ({ status: 'fulfilled', value: result }))
      .catch((error) => ({ status: 'rejected', reason: error, symbol }))
  );

  const settled = await Promise.all(analysisPromises);

  const data = [];
  const errors = [];

  settled.forEach((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      data.push(outcome.value);
    } else {
      errors.push({
        symbol: outcome.symbol || symbols[index],
        message: outcome.reason?.message || 'Unable to analyse symbol.'
      });
    }
  });

  if (!data.length) {
    const error = new Error('Unable to retrieve data for the requested symbols.');
    error.details = errors;
    throw error;
  }

  const analytics = buildAnalytics(data);

  return {
    range,
    interval,
    data,
    errors,
    analytics
  };
};

module.exports = {
  getStockInsights
};
