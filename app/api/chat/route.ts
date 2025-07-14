import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    // For now, we'll just simulate a response.
    const lastMessage = messages[messages.length - 1];
    const alinaResponse = `You said: "${lastMessage.text}"`;

    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({ reply: alinaResponse });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}