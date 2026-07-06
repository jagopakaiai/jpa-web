// Netlify Serverless Function for JOE AI Chat Assistant using Groq API
const fs = require('fs');
const path = require('path');

// Parse local .env file manually if it exists (for local development runner convenience)
try {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const delimiterIdx = trimmed.indexOf('=');
      if (delimiterIdx > 0) {
        const key = trimmed.substring(0, delimiterIdx).trim();
        let val = trimmed.substring(delimiterIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (err) {
  console.warn('Could not parse local .env file:', err);
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);
    const apiKey = process.env.GROQ_API_KEY;

    // Local/development fallback if API key is not configured
    if (!apiKey) {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices: [{
            message: {
              role: 'assistant',
              content: 'Halo! Saya **JOE**, AI Agent Assistant dari JagoPakaiAI. \n\n(Catatan: `GROQ_API_KEY` belum dikonfigurasi di Netlify/lokal, jadi ini adalah respons simulasi). \n\nSilakan konfigurasikan `GROQ_API_KEY` di dashboard Netlify Anda untuk mengaktifkan kecerdasan penuh saya menggunakan Llama-3.3-70b-versatile!'
            }
          }]
        })
      };
    }

    // Call Groq API
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    
    const systemPrompt = process.env.GROQ_SYSTEM_PROMPT;
    if (!systemPrompt) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GROQ_SYSTEM_PROMPT environment variable is not set.' })
      };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages
        ]
      })
    });

    const data = await response.json();
    return {
      statusCode: response.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
