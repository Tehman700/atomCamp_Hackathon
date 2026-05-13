import { NextRequest } from "next/server";
import { openai, MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { messages, lessonTitle, lessonContext } = await req.json();

  const systemPrompt = `You are AtomBot, an expert AI tutor for AtomCamp — a tech education platform.
You are helping a student who is currently studying: "${lessonTitle}".

LESSON CONTEXT (for reference):
${lessonContext?.slice(0, 1500) ?? ""}

Your role:
- Answer questions clearly and concisely
- Use examples relevant to Pakistan's tech industry when helpful
- Explain concepts at the appropriate level — never condescend, never overwhelm
- When a student is confused, try a different explanation approach
- Celebrate correct understanding with brief encouragement
- If asked something outside this lesson, gently redirect

Keep responses under 200 words unless the student explicitly asks for depth.`;

  const stream = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    stream: true,
    temperature: 0.6,
    max_tokens: 500,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
