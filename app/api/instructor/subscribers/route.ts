import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

async function getSessionUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Verify user is an approved instructor
  const { data: profile } = await admin
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher" || profile?.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get subscribers
  const { data: subs } = await admin
    .from("instructor_subscriptions")
    .select("student_id, created_at")
    .eq("instructor_id", user.id);

  if (!subs?.length) return NextResponse.json({ subscribers: [] });

  const studentIds = subs.map((s) => s.student_id);

  // Fetch student profiles
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", studentIds);

  // Fetch quiz results for each student
  const { data: quizResults } = await admin
    .from("quiz_results")
    .select("user_id, percentage, created_at")
    .in("user_id", studentIds)
    .order("created_at", { ascending: false });

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const subDateMap = Object.fromEntries(subs.map((s) => [s.student_id, s.created_at]));

  const subscribers = studentIds.map((sid) => {
    const p = profileMap[sid];
    const results = (quizResults ?? []).filter((r) => r.user_id === sid);
    const quizAvg = results.length
      ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length)
      : null;
    const lastActive = results[0]?.created_at ?? subDateMap[sid];
    return {
      id: sid,
      name: p?.full_name ?? "Student",
      email: p?.email ?? "",
      quizAvg,
      quizCount: results.length,
      lastActive,
      subscribedAt: subDateMap[sid],
    };
  });

  return NextResponse.json({ subscribers });
}
