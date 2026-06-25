import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getISOWeek, getYear, startOfISOWeek, subWeeks } from "date-fns";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const now = new Date();
  const lastWeekStart = startOfISOWeek(subWeeks(now, 1));
  const thisWeekStart = startOfISOWeek(now);

  const week = getISOWeek(lastWeekStart);
  const year = getYear(lastWeekStart);

  // Idempotency guard
  const { data: existing } = await supabase
    .from("archives")
    .select("id")
    .eq("week", week)
    .eq("year", year)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: "Already archived", week, year });
  }

  const errors: string[] = [];

  // --- Top hide of the week (submitted this week, most votes) ---
  const { data: topHide, error: hideErr } = await supabase
    .from("hides")
    .select("id, user_id, votes")
    .gte("created_at", lastWeekStart.toISOString())
    .lt("created_at", thisWeekStart.toISOString())
    .order("votes", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (hideErr) {
    errors.push(`hide query: ${hideErr.message}`);
  } else if (topHide) {
    const { error: insertErr } = await supabase.from("archives").insert({
      week,
      year,
      category: "hide",
      hide_id: topHide.id,
      user_id: topHide.user_id,
      votes: topHide.votes,
    });
    if (insertErr) errors.push(`hide insert: ${insertErr.message}`);
  }

  // --- Best player of the week (most votes received from votes cast this week) ---
  const { data: weekVotes, error: votesErr } = await supabase
    .from("votes")
    .select("hide_id, hides(user_id)")
    .gte("created_at", lastWeekStart.toISOString())
    .lt("created_at", thisWeekStart.toISOString());

  if (votesErr) {
    errors.push(`votes query: ${votesErr.message}`);
  } else if (weekVotes && weekVotes.length > 0) {
    const playerCounts: Record<string, number> = {};
    for (const row of weekVotes) {
      const hide = row.hides as unknown as { user_id: string } | null;
      const userId = hide?.user_id;
      if (userId) {
        playerCounts[userId] = (playerCounts[userId] ?? 0) + 1;
      }
    }

    let topUserId = "";
    let topCount = 0;
    Object.entries(playerCounts).forEach(([userId, count]) => {
      if (count > topCount) {
        topCount = count;
        topUserId = userId;
      }
    });

    if (topUserId) {
      const { error: insertErr } = await supabase.from("archives").insert({
        week,
        year,
        category: "player",
        user_id: topUserId,
        votes: topCount,
      });
      if (insertErr) errors.push(`player insert: ${insertErr.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 500 });
  }

  return NextResponse.json({ success: true, week, year });
}
