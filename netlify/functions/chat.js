// Netlify Serverless Function for JOE AI Chat Assistant using Groq API
const fetch = require('node-fetch'); // Fallback for environments without global fetch

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
    
    const defaultPrompt = `Anda adalah JOE, AI Agent Assistant untuk JPA (JagoPakaiAI) Hub di jpa.my.id.
Jawablah dengan ramah, profesional, dan dalam bahasa Indonesia.
Tugas utama Anda adalah membantu user merencanakan proyek AI Agent mereka.
Berdasarkan deskripsi proyek user, rekomendasikan direktif yang relevan beserta link Markdown-nya:
1. SKILL.MD (Instruksi Agent) -> link: /skills.html#<kategori> (Kategori: coding, devops, design, data, writing, productivity)
2. DESIGN.MD (Desain UI/UX) -> link: /designs.html
3. MCP Server (Integrasi Tool) -> link: /mcps.html

Contoh: jika ingin membuat API Python, arahkan ke [SKILL.MD Coding](/skills.html#coding) dan [MCP Directory](/mcps.html).`;

    const systemPrompt = process.env.GROQ_SYSTEM_PROMPT || defaultPrompt;

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
