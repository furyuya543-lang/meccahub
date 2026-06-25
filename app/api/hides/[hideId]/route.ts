import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { hideId: string } }
) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("hides")
    .select("*, users(*)")
    .eq("id", params.hideId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Hide not found" }, { status: 404 });
  }

  return NextResponse.json({ hide: data });
}
