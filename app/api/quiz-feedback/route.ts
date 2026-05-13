import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { question, options, selectedIndex, correctIndex, explanation, courseTitle } = await req.json();

  const isCorrect = selectedIndex === correctIndex;
  const selectedAnswer = options[selectedIndex];
  const correctAnswer = options[correctIndex];

  const prompt = `You are an encouraging tutor for AtomCamp's ${courseTitle} course.

Question: ${question}
Student selected: "${selectedAnswer}" (${isCorrect ? "CORRECT" : "INCORRECT"})
${!isCorrect ? `Correct answer: "${correctAnswer}"` : ""}
Base explanation: ${explanation}

Write a personalized 2-3 sentence feedback message for this student.
- If correct: Reinforce WHY it's correct, add one interesting deeper insight
- If incorrect: Be kind, explain the misconception directly, clarify the concept simply

Do NOT start with "Great job!" or "Unfortunately". Be direct and educational.`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 150,
  });

  return NextResponse.json({
    feedback: completion.choices[0].message.content,
    isCorrect,
  });
}
