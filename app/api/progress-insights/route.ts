import { NextRequest, NextResponse } from "next/server";
import { openai, MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { students, courseTitle } = await req.json();

  const studentSummaries = students
    .map(
      (s: { name: string; riskScore: number; quizAvg: number; streak: number; progress: Record<string, number>; lastActive: string; riskReasons: string[] }) =>
        `- ${s.name}: risk=${s.riskScore}/100, quizAvg=${s.quizAvg}%, streak=${s.streak}d, lastActive="${s.lastActive}", flags=[${s.riskReasons.join("; ")}]`
    )
    .join("\n");

  const atRisk = students.filter((s: { riskScore: number }) => s.riskScore >= 70).length;
  const avgQuiz = Math.round(
    students.reduce((a: number, s: { quizAvg: number }) => a + s.quizAvg, 0) / students.length
  );

  const prompt = `You are an AI educational analyst for AtomCamp instructors.

COURSE: ${courseTitle ?? "All Courses"}
TOTAL STUDENTS: ${students.length}
HIGH RISK STUDENTS: ${atRisk}
CLASS QUIZ AVERAGE: ${avgQuiz}%

STUDENT DATA:
${studentSummaries}

Analyze this data and generate an instructor intelligence report. Be specific with names and numbers.

Respond with JSON only:
{
  "summary": "1-sentence overall class health statement",
  "insights": [
    "Specific, data-backed insight 1 (mention student names where relevant)",
    "Specific insight 2",
    "Specific insight 3"
  ],
  "urgentAction": "The single most important thing the instructor should do today (be specific)",
  "positiveHighlight": "Something genuinely positive happening in this class",
  "recommendedFocus": "Which concept or module the class struggles with most and why"
}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");
  return NextResponse.json(result);
}
