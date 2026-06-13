import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt, useDeepSeek } = await request.json();

    // Select the model based on your toggle
    const selectedModel = useDeepSeek ? 'deepseek-r1:8b' : 'qwen2.5-coder:7b';

    // Talk to the local Ollama service using the full localhost port address
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt: prompt,
        stream: false, // Set to false for a clean, single response block
      }),
    });

    const data = await response.json();
    return NextResponse.json({ text: data.response });

  } catch (error) {
    console.error('Ollama Connection Error:', error);
    return NextResponse.json(
      { error: 'Could not connect to local AI. Ensure "ollama serve" is running in PowerShell.' },
      { status: 500 }
    );
  }
}
