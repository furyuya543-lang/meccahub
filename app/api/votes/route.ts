import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hideId } = await req.json();
  if (!hideId) {
    return NextResponse.json({ error: "Missing hideId" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  // Check for existing vote today
  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("hide_id", hideId)
    .gte("created_at", `${today}T00:00:00Z`)
    .lte("created_at", `${today}T23:59:59Z`)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already voted today" }, { status: 409 });
  }

  // Insert vote
  const { error: voteError } = await supabase.from("votes").insert({
    user_id: session.user.id,
    hide_id: hideId,
  });

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  // Increment hide vote count
  await supabase.rpc("increment_votes", { hide_id: hideId });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hideId } = await req.json();
  if (!hideId) {
    return NextResponse.json({ error: "Missing hideId" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("votes")
    .delete()
    .eq("user_id", session.user.id)
    .eq("hide_id", hideId)
    .gte("created_at", `${today}T00:00:00Z`)
    .lte("created_at", `${today}T23:59:59Z`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("decrement_votes", { hide_id: hideId });

  return NextResponse.json({ success: true });
}
