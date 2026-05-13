import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { topicTitle, topicDescription, numQuestions = 5 } = await req.json();

  const prompt = `You are an expert quiz designer. Generate ${numQuestions} high-quality multiple-choice questions specifically about: "${topicTitle}".

Context: ${topicDescription ?? ""}

Rules:
- Every question MUST be directly about "${topicTitle}" — no off-topic questions
- Mix easy (2), medium (2), and hard (1) difficulty
- Each question has exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Write clear, specific distractors (wrong answers that are plausible but clearly wrong to someone who studied)
- Explanation must teach WHY the correct answer is right

Respond ONLY with raw JSON (no markdown):
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct and the others are wrong",
      "difficulty": "easy"
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}");
    return NextResponse.json({ questions: result.questions ?? [], topicTitle });
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate questions", questions: [] }, { status: 500 });
  }
}
