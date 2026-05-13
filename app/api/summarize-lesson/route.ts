import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { lessonTitle, content, lessonId } = await req.json();

  const prompt = `You are a concise note-taker for AtomCamp students.

Summarize this lesson in bullet points. Be extremely concise — each bullet should be one clear, memorable insight that a student can quickly scan before a quiz.

LESSON: ${lessonTitle}

CONTENT:
${content.slice(0, 3000)}

Respond with JSON only:
{
  "title": "Key Takeaways: ${lessonTitle}",
  "bullets": [
    "Bullet point 1 — the most important concept",
    "Bullet point 2",
    "Bullet point 3",
    "Bullet point 4",
    "Bullet point 5"
  ],
  "quizHint": "The most likely thing to be tested on (1 sentence)"
}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");
  return NextResponse.json({ ...result, lessonId });
}
