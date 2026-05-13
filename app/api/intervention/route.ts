import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { student } = await req.json();

  const prompt = `You are an educational psychologist advising instructors at AtomCamp.

AT-RISK STUDENT PROFILE:
- Name: ${student.name}
- Risk Score: ${student.riskScore}/100
- Last active: ${student.lastActive}
- Current streak: ${student.streak} days
- Quiz average: ${student.quizAvg}%
- Risk signals: ${student.riskReasons.join("; ")}

Write a practical intervention plan for the instructor. Include:
1. One specific outreach message template (keep it warm, not alarming)
2. Two concrete actions the instructor should take this week
3. One adjustment to the student's learning path

Format as JSON with keys: "outreachMessage", "instructorActions" (array of 2 strings), "pathAdjustment"`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");
  return NextResponse.json(result);
}
