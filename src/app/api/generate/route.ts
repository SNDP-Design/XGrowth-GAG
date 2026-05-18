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
    const { role, topic, tone } = await req.json();

    if (!topic || !role) {
      return NextResponse.json({ error: 'Role and topic are required' }, { status: 400 });
    }

    const toneInstructions = {
      friendly: "Warm, approachable, and encouraging. Use more conversational flow.",
      'like a story': "Narrative-driven, cinematic, and descriptive. Build suspense and resolution.",
      emotional: "Deeply human, vulnerable, and passionate. Focus on the 'why' and the feeling."
    };

    const toneText = toneInstructions[tone as 'friendly' | 'like a story' | 'emotional'] || toneInstructions.friendly;

    const systemInstruction = `You are a professional X (Twitter) ghostwriter for Silicon Valley startup founders. 
Your goal is to help founders turn ideas into viral-potential tweets and threads. 
Avoid buzzword spam, generic "hustle culture" tropes, and excessive emojis.

TASK:
1. Generate exactly 10-15 short tweet ideas.
2. Label each tweet: Hook, Story, or Lesson.
3. Generate exactly 3 short "thread-start" options.

OUTPUT FORMAT:
You MUST return a JSON object with the following structure:
{
  "header": "Here are tweet ideas for a [Role] writing about [Topic]",
  "ideas": [
    { "type": "Hook", "content": "..." },
    { "type": "Story", "content": "..." },
    { "type": "Lesson", "content": "..." },
    { "type": "Thread-start", "content": "..." }
  ]
}

Tone Guidance: ${toneText}
Role: ${role}
Topic: ${topic}`;

    let lastError = null;

    // Try models in fallback order
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Attempting structured generation with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Generate ideas for: a ${role} exploring "${topic}"`,
          config: {
            systemInstruction,
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);

        console.log(`Successfully generated structured content using ${modelName}`);
        return NextResponse.json(parsed);
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
