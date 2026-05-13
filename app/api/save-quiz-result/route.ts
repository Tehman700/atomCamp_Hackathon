import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { courseId, quizId, score, total, percentage, answers, recommendation } = await req.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("quiz_results")
    .insert({
      user_id: user.id,
      course_id: courseId,
      quiz_id: quizId,
      score,
      total,
      percentage,
      answers: answers ?? [],
      recommendation: recommendation ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
