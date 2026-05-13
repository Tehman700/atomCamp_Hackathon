import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { score, total, courseTitle, lessonTitle, studentName } = await req.json();

  const percentage = Math.round((score / total) * 100);

  let tier: "struggling" | "satisfactory" | "excellent";
  if (percentage < 60) tier = "struggling";
  else if (percentage < 80) tier = "satisfactory";
  else tier = "excellent";

  const tierInstructions = {
    struggling: "The student scored below 60%. They need encouragement + a clear instruction to review the lesson before continuing. Flag that the instructor should check in.",
    satisfactory: "The student scored 60–79%. Acknowledge the progress and encourage them to keep going through the course normally.",
    excellent: "The student scored 80%+. Celebrate this and suggest they can move to the next module early or try advanced extension material.",
  };

  const prompt = `You are a supportive learning coach for AtomCamp.

Student: ${studentName ?? "the student"}
Course: ${courseTitle}
Lesson: ${lessonTitle}
Score: ${score}/${total} (${percentage}%)

${tierInstructions[tier]}

Respond with JSON only:
{
  "tier": "${tier}",
  "percentage": ${percentage},
  "headline": "Short, impactful headline (max 8 words)",
  "message": "2–3 sentences of personalized feedback. Warm, direct, action-oriented.",
  "nextAction": "Specific single action: what should the student do RIGHT NOW?",
  "flagInstructor": ${tier === "struggling"}
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
