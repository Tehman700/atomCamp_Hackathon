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

// GET — list instructors + subscription status for current student
export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const [{ data: instructors }, { data: mySubs }] = await Promise.all([
    admin.from("profiles").select("id, full_name, email").eq("role", "teacher").eq("status", "approved"),
    admin.from("instructor_subscriptions").select("instructor_id").eq("student_id", user.id),
  ]);

  const subSet = new Set((mySubs ?? []).map((s) => s.instructor_id));

  const withCounts = await Promise.all(
    (instructors ?? []).map(async (inst) => {
      const { count } = await admin
        .from("instructor_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", inst.id);
      return { ...inst, subscriberCount: count ?? 0, subscribed: subSet.has(inst.id) };
    })
  );

  return NextResponse.json({ instructors: withCounts });
}

// POST — subscribe to instructor
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { instructorId } = await req.json();
  const admin = createAdminClient();

  const { error } = await admin
    .from("instructor_subscriptions")
    .insert({ student_id: user.id, instructor_id: instructorId });

  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// DELETE — unsubscribe
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { instructorId } = await req.json();
  const admin = createAdminClient();

  await admin
    .from("instructor_subscriptions")
    .delete()
    .eq("student_id", user.id)
    .eq("instructor_id", instructorId);

  return NextResponse.json({ success: true });
}
