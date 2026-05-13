import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { content, courseTitle, numQuestions = 5 } = await req.json();

  const prompt = `You are an expert instructional designer for AtomCamp, a tech education platform.

Generate ${numQuestions} multiple-choice quiz questions based on this lesson content:

CONTENT:
${content.slice(0, 3000)}

COURSE: ${courseTitle ?? "Technology"}

Rules:
- Each question must test understanding, not just recall
- Each question must have exactly 4 options
- Exactly one correct answer per question
- Mix difficulty: 2 easy, 2 medium, 1 hard
- Make wrong options plausible (not obviously wrong)

Respond with a JSON object (raw JSON only, no markdown):
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct",
      "difficulty": "easy"
    }
  ],
  "title": "Auto-generated quiz title"
}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");
  return NextResponse.json(result);
}
