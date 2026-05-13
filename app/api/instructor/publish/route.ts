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

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role, status, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher" || profile?.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, type, description } = await req.json();
  if (!title || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Create content record
  const { data: content, error: contentErr } = await admin
    .from("instructor_content")
    .insert({ instructor_id: user.id, instructor_name: profile.full_name, title, type, description: description ?? "" })
    .select()
    .single();

  if (contentErr || !content) {
    return NextResponse.json({ error: contentErr?.message ?? "Insert failed" }, { status: 500 });
  }

  // Get all subscribers
  const { data: subs } = await admin
    .from("instructor_subscriptions")
    .select("student_id")
    .eq("instructor_id", user.id);

  if (subs?.length) {
    const notifications = subs.map((s) => ({
      student_id: s.student_id,
      content_id: content.id,
      instructor_name: profile.full_name,
      title: `${profile.full_name} posted: ${title}`,
      type,
      read: false,
    }));
    await admin.from("notifications").insert(notifications);
  }

  return NextResponse.json({ success: true, content, notified: subs?.length ?? 0 });
}
