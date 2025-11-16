const env = require('../config/loadEnv');
const https = require('https');

const CHATGPT_API_BASE = env.CHATGPT_API_BASE || 'https://api.openai.com';
const DEFAULT_MODEL = env.CHATGPT_MODEL || 'gpt-4o-mini';

const hasNativeFetch = typeof fetch === 'function';

const buildUrl = () => {
  if (!env.CHATGPT_API_KEY) {
    throw new Error('CHATGPT_API_KEY is not configured.');
  }
  return `${CHATGPT_API_BASE.replace(/\/$/, '')}/v1/chat/completions`;
};

const buildPayload = ({ messages, systemInstruction, temperature = 0.7, maxTokens = 1000 }) => {
  const payload = {
    model: DEFAULT_MODEL,
    messages: [],
    temperature,
    max_tokens: maxTokens,
  };

  if (systemInstruction) {
    payload.messages.push({
      role: 'system',
      content: systemInstruction
    });
  }

  payload.messages.push(...messages);

  return JSON.stringify(payload);
};

const callWithFetch = async (url, body, apiKey) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
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
    const error = new Error(`ChatGPT API responded with status ${response.status}`);
    error.status = response.status;
    error.response = parsed;
    throw error;
  }

  return parsed;
};

const callWithHttps = (url, body, apiKey) => new Promise((resolve, reject) => {
  const parsedUrl = new URL(url);

  const request = https.request(
    {
      method: 'POST',
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
            const error = new Error(`ChatGPT API responded with status ${response.statusCode}`);
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
  messages,
  systemInstruction,
  temperature = 0.7,
  maxTokens = 1000
}) => {
  if (!env.CHATGPT_API_KEY) {
    throw new Error('CHATGPT_API_KEY is not configured.');
  }

  const url = buildUrl();
  const body = buildPayload({ messages, systemInstruction, temperature, maxTokens });

  return hasNativeFetch 
    ? callWithFetch(url, body, env.CHATGPT_API_KEY)
    : callWithHttps(url, body, env.CHATGPT_API_KEY);
};

module.exports = {
  DEFAULT_MODEL,
  generateContent
};

