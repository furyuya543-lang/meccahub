import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const mapId = params.id;

  const { data: existing } = await supabase
    .from("map_votes")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("map_id", mapId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  const { error: voteError } = await supabase
    .from("map_votes")
    .insert({ user_id: session.user.id, map_id: mapId });

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 });
  }

  await supabase.rpc("increment_map_votes", { map_id: mapId });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const mapId = params.id;

  const { error } = await supabase
    .from("map_votes")
    .delete()
    .eq("user_id", session.user.id)
    .eq("map_id", mapId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("decrement_map_votes", { map_id: mapId });

  return NextResponse.json({ success: true });
}
