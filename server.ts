import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Health check endpoint (100% offline-ready & deterministic)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: 'offline_mathematical',
    brand: 'Aliyah',
    version: '1.0.0',
  });
});

// AI Food Photo Analysis endpoint
app.post('/api/analyze-food-photo', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt = '' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Imagem não fornecida' });
    }

    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI();

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: `Você é um nutricionista especialista em estimativa visual de refeições e contagem de macronutrientes.
Analise a imagem da refeição e estime com máxima precisão os alimentos presentes, porções, calorias totais e macronutrientes (proteínas, carboidratos, gorduras, fibras).
${prompt ? `Observação adicional do usuário: "${prompt}"` : ''}

Retorne ESTRITAMENTE um objeto JSON válido com este formato exato:
{
  "name": "Nome descritivo da refeição em português",
  "portion": "Estimativa geral do peso/porção (ex: 1 prato aprox. 350g)",
  "calories": 450,
  "protein": 35.0,
  "carbs": 48.0,
  "fat": 12.0,
  "fiber": 5.0,
  "aiConfidence": 0.9,
  "healthTip": "Breve dica ou avaliação nutricional da refeição em português",
  "items": [
    {
      "name": "Nome do item",
      "portion": "120g",
      "calories": 180,
      "protein": 30.0,
      "carbs": 0.0,
      "fat": 2.5
    }
  ]
}`,
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({ success: true, modelUsed: model, data: parsed });
        }
      } catch (err: any) {
        console.warn(`Model ${model} failed for food photo:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error('Falha ao processar imagem da comida com a IA');
  } catch (error: any) {
    console.error('Error analyzing food photo:', error);
    res.status(500).json({
      error: 'Não foi possível analisar a foto no momento com a IA.',
      details: error?.message,
    });
  }
});

// AI Food Text Description Analysis endpoint
app.post('/api/analyze-food-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Texto não fornecido' });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI();

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Você é um nutricionista especialista em cálculo de macronutrientes.
Analise a refeição descrita pelo usuário em linguagem natural: "${text.trim()}".
Identifique cada alimento mencionado, estime gramaturas e porções realistas, e calcule as calorias totais e macronutrientes (proteínas, carboidratos, gorduras, fibras).

Retorne ESTRITAMENTE um objeto JSON válido com este formato exato:
{
  "name": "Nome descritivo da refeição em português",
  "portion": "Estimativa geral da porção (ex: 2 ovos + 2 fatias de pão)",
  "calories": 320,
  "protein": 22.0,
  "carbs": 26.0,
  "fat": 14.0,
  "fiber": 4.0,
  "aiConfidence": 0.95,
  "healthTip": "Breve comentário nutricional construtivo em português",
  "items": [
    {
      "name": "Nome do alimento",
      "portion": "2 unidades (100g)",
      "calories": 160,
      "protein": 13.0,
      "carbs": 1.0,
      "fat": 11.0
    }
  ]
}`,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({ success: true, modelUsed: model, data: parsed });
        }
      } catch (err: any) {
        console.warn(`Model ${model} failed for food text:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error('Falha ao processar texto com a IA');
  } catch (error: any) {
    console.error('Error analyzing food text:', error);
    res.status(500).json({
      error: 'Não foi possível analisar o texto com a IA.',
      details: error?.message,
    });
  }
});

// Vite dev server middleware or static production serve
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Aliyah server listening on port ${port} (Offline Mathematical Engine)`);
  });
}

startServer();
