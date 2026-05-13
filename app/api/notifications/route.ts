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
  const { data } = await admin
    .from("notifications")
    .select("id, title, type, read, created_at, content_id, instructor_name")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { notificationId, markAllRead } = await req.json();
  const admin = createAdminClient();

  if (markAllRead) {
    await admin.from("notifications").update({ read: true }).eq("student_id", user.id);
  } else if (notificationId) {
    await admin.from("notifications").update({ read: true })
      .eq("id", notificationId).eq("student_id", user.id);
  }

  return NextResponse.json({ success: true });
}
