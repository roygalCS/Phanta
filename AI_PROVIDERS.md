# AI Providers Setup Guide

Phanta supports **6 AI providers** for maximum flexibility and redundancy. Add API keys to `backend/.env` to enable them.

## Supported Providers

### 1. 🔮 Google Gemini (Default)
- **API Key**: Get from https://aistudio.google.com/app/apikey
- **Free tier**: Yes, generous free tier
- **Speed**: Fast
- **Quality**: Excellent
- **Setup**: `GEMINI_API_KEY=your_key_here`

### 2. 🤖 OpenAI ChatGPT
- **API Key**: Get from https://platform.openai.com/api-keys
- **Free tier**: $5 credit on signup
- **Speed**: Fast
- **Quality**: Excellent
- **Setup**: `CHATGPT_API_KEY=your_key_here`

### 3. 🧠 Anthropic Claude
- **API Key**: Get from https://console.anthropic.com/settings/keys
- **Free tier**: $5 credit on signup
- **Speed**: Fast
- **Quality**: Excellent, great for analysis
- **Setup**: `CLAUDE_API_KEY=your_key_here`

### 4. ⚡ Groq (NEW - Very Fast!)
- **API Key**: Get from https://console.groq.com/keys
- **Free tier**: Yes, very generous
- **Speed**: Extremely fast (uses specialized hardware)
- **Quality**: Very good
- **Setup**: `GROQ_API_KEY=your_key_here`
- **Why use it**: Fastest inference, great for real-time chat

### 5. 🌊 Mistral AI (NEW)
- **API Key**: Get from https://console.mistral.ai/api-keys/
- **Free tier**: Limited free tier
- **Speed**: Fast
- **Quality**: Excellent, open-source models
- **Setup**: `MISTRAL_API_KEY=your_key_here`
- **Why use it**: Open-source models, good for European data compliance

### 6. 🤝 Together AI (NEW)
- **API Key**: Get from https://api.together.xyz/settings/api-keys
- **Free tier**: $25 credit on signup
- **Speed**: Fast
- **Quality**: Very good, access to many open models
- **Setup**: `TOGETHER_API_KEY=your_key_here`
- **Why use it**: Access to many open-source models (Llama, Mixtral, etc.)

## Quick Setup

Add to `backend/.env`:

```env
# Required for AI features (at least one)
GEMINI_API_KEY=your_gemini_key
CHATGPT_API_KEY=your_openai_key
CLAUDE_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key
MISTRAL_API_KEY=your_mistral_key
TOGETHER_API_KEY=your_together_key
```

## Usage

1. **In AI Assistant Panel**: Select provider from dropdown
2. **In Group Chat**: Mention `@gemini`, `@chatgpt`, `@claude`, `@groq`, `@mistral`, or `@together`
3. **Automatic Fallback**: If selected provider fails, system tries others

## Recommended Setup for Hackathon

**Minimum (Free):**
- Gemini (free tier)
- Groq (free tier, fastest)

**Best (Mix of free + paid):**
- Gemini (free)
- Groq (free, fastest)
- ChatGPT (paid, best quality)
- Claude (paid, best analysis)

## API Key Links

- **Gemini**: https://aistudio.google.com/app/apikey
- **ChatGPT**: https://platform.openai.com/api-keys
- **Claude**: https://console.anthropic.com/settings/keys
- **Groq**: https://console.groq.com/keys
- **Mistral**: https://console.mistral.ai/api-keys/
- **Together**: https://api.together.xyz/settings/api-keys

## Notes

- All providers work in both **AI Assistant** and **Group Chat**
- Provider logos and colors are shown in the UI
- System automatically falls back if a provider is unavailable
- Each provider has different strengths (speed, quality, cost)

