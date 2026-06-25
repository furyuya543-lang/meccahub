import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const VALID_REASONS = ["Inappropriate", "Fake hide", "Spam", "Wrong map", "Other"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hideId, reason } = await req.json();

  if (!hideId || !reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("reports")
    .insert({
      hide_id: hideId,
      user_id: session.user.id,
      reason,
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You have already reported this hide." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
