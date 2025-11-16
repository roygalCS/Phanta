const env = require('../config/loadEnv');
const https = require('https');

const GEMINI_API_BASE = env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com';
const GEMINI_API_VERSION = env.GEMINI_API_VERSION || 'v1beta';
const DEFAULT_MODEL = env.GEMINI_MODEL || 'gemini-2.5-flash';

const hasNativeFetch = typeof fetch === 'function';

const buildUrl = (model) => {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const safeModel = encodeURIComponent(model || DEFAULT_MODEL);
  return `${GEMINI_API_BASE.replace(/\/$/, '')}/${GEMINI_API_VERSION}/models/${safeModel}:generateContent?key=${env.GEMINI_API_KEY}`;
};

const buildPayload = ({ contents, systemInstruction, generationConfig, safetySettings }) => {
  const payload = { contents };

  if (systemInstruction) {
    payload.systemInstruction = systemInstruction;
  }

  if (generationConfig) {
    payload.generationConfig = generationConfig;
  }

  if (safetySettings) {
    payload.safetySettings = safetySettings;
  }

  return JSON.stringify(payload);
};

const callWithFetch = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body
  });

  const raw = await response.text();
  let parsed = {};

  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch (error) {
    error.rawBody = raw;
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Gemini API responded with status ${response.status}`);
    error.status = response.status;
    error.response = parsed;
    throw error;
  }

  return parsed;
};

const callWithHttps = (url, body) => new Promise((resolve, reject) => {
  const parsedUrl = new URL(url);

  const request = https.request(
    {
      method: 'POST',
      hostname: parsedUrl.hostname,
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    },
    (response) => {
      let raw = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};

          if (response.statusCode && response.statusCode >= 400) {
            const error = new Error(`Gemini API responded with status ${response.statusCode}`);
            error.status = response.statusCode;
            error.response = parsed;
            return reject(error);
          }

          resolve(parsed);
        } catch (error) {
          error.rawBody = raw;
          error.status = response.statusCode;
          reject(error);
        }
      });
    }
  );

  request.on('error', reject);
  request.write(body);
  request.end();
});

const generateContent = async ({
  model = DEFAULT_MODEL,
  contents,
  systemInstruction,
  generationConfig,
  safetySettings
}) => {
  const url = buildUrl(model);
  const body = buildPayload({ contents, systemInstruction, generationConfig, safetySettings });

  return hasNativeFetch ? callWithFetch(url, body) : callWithHttps(url, body);
};

module.exports = {
  DEFAULT_MODEL,
  generateContent
};
