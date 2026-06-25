import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(req.url);

  const map = searchParams.get("map");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") ?? "votes";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("hides")
    .select("*, users(*)", { count: "exact" })
    .range(offset, offset + limit - 1);

  if (map) query = query.eq("map", map);
  if (category) query = query.eq("category", category);
  if (search) query = query.ilike("title", `%${search}%`);

  if (sort === "votes") {
    query = query.order("votes", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hides: data, total: count, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const body = await req.json();
  const { title, description, map, category, screenshot_url, video_url } = body;

  if (!title || !map || !category || !screenshot_url) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("hides")
    .insert({
      user_id: session.user.id,
      title,
      description,
      map,
      category,
      screenshot_url,
      video_url: video_url || null,
      votes: 0,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hide: data }, { status: 201 });
}
