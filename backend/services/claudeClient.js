const env = require('../config/loadEnv');
const https = require('https');

const CLAUDE_API_BASE = env.CLAUDE_API_BASE || 'https://api.anthropic.com';
const DEFAULT_MODEL = env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

const hasNativeFetch = typeof fetch === 'function';

const buildUrl = () => {
  if (!env.CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY is not configured.');
  }
  return `${CLAUDE_API_BASE.replace(/\/$/, '')}/v1/messages`;
};

const buildPayload = ({ messages, systemInstruction, maxTokens = 1024 }) => {
  const payload = {
    model: DEFAULT_MODEL,
    messages: messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : msg.content
    })),
    max_tokens: maxTokens,
  };

  if (systemInstruction) {
    payload.system = systemInstruction;
  }

  return JSON.stringify(payload);
};

const callWithFetch = async (url, body, apiKey) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
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
    const error = new Error(`Claude API responded with status ${response.status}`);
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
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
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
            const error = new Error(`Claude API responded with status ${response.statusCode}`);
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
  maxTokens = 1024
}) => {
  if (!env.CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY is not configured.');
  }

  const url = buildUrl();
  const body = buildPayload({ messages, systemInstruction, maxTokens });

  return hasNativeFetch 
    ? callWithFetch(url, body, env.CLAUDE_API_KEY)
    : callWithHttps(url, body, env.CLAUDE_API_KEY);
};

module.exports = {
  DEFAULT_MODEL,
  generateContent
};

