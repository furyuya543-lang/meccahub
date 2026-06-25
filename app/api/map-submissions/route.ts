import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("map_submissions")
    .select("*, users(*)")
    .eq("status", "approved")
    .order("votes", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ maps: data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const body = await req.json();
  const { mapName, steamWorkshopUrl, workshopId, description, previewImageUrl } = body;

  if (!mapName || !steamWorkshopUrl || !workshopId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Duplicate check
  const { data: existing } = await supabase
    .from("map_submissions")
    .select("id")
    .eq("workshop_id", workshopId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This map has already been submitted" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("map_submissions")
    .insert({
      user_id: session.user.id,
      map_name: mapName,
      steam_workshop_url: steamWorkshopUrl,
      workshop_id: workshopId,
      description: description || null,
      preview_image_url: previewImageUrl || null,
      status: "pending",
      votes: 0,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ map: data }, { status: 201 });
}
