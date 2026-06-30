import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("hides")
    .select("*, users(*)")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Hide not found" }, { status: 404 });
  }

  return NextResponse.json({ hide: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { hideId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("hides")
    .select("user_id")
    .eq("id", params.hideId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Hide not found" }, { status: 404 });
  }

  if (existing.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, map, category, screenshot_url, video_url } = body;

  if (!title || !map || !category || !screenshot_url) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("hides")
    .update({
      title,
      description: description || null,
      map,
      category,
      screenshot_url,
      video_url: video_url || null,
    })
    .eq("id", params.hideId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hide: data });
}
