import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODELS_TO_TRY = [
  'gemini-2.5-pro',
  'gemini-1.5-pro',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash'
];

export async function POST(req: Request) {
  try {
    const { topic, tone } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `
      You are an expert X/Twitter ghostwriter.
      Write a viral Twitter thread about the following topic: "${topic}"
      The tone of the thread should be: ${tone}.
      
      Rules:
      1. Keep it engaging and actionable.
      2. Limit the thread to 3-5 tweets.
      3. Do NOT include numbers like "1/5" at the start of tweets.
      4. Use formatting like line breaks to make it readable.
      5. Separate each tweet with the exact string "---TWEET_SEPARATOR---".
    `;

    let lastError = null;

    // Try models in fallback order
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Attempting generation with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        const text = response.text || '';
        const tweets = text.split('---TWEET_SEPARATOR---').map(t => t.trim()).filter(t => t.length > 0);

        console.log(`Successfully generated content using ${modelName}`);
        return NextResponse.json({ tweets });
      } catch (error: any) {
        console.warn(`Model ${modelName} failed:`, error.message);
        lastError = error;
        // Continue to the next model in the list
      }
    }

    // If we've exhausted all models
    console.error('All Gemini models exhausted. Last error:', lastError);
    return NextResponse.json({ error: 'Failed to generate content: quota exhausted on all fallback models.' }, { status: 500 });
    
  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
