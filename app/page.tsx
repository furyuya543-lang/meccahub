import Link from "next/link";
import { Trophy, Clock, ArrowRight, Flame, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import HideCard from "@/components/HideCard";
import { Hide } from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const [
    { data: awardData },
    { data: topHides },
    { data: recentHides },
    { data: weeklyVoteRows },
  ] = await Promise.all([
    supabase
      .from("awards")
      .select("*, hides(*, users(*))")
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from("hides")
      .select("*, users(*)")
      .gte("created_at", monday.toISOString())
      .order("votes", { ascending: false })
      .limit(5),

    supabase
      .from("hides")
      .select("*, users(*)")
      .order("created_at", { ascending: false })
      .limit(6),

    // Votes cast this week — used to determine best player
    supabase
      .from("votes")
      .select("hide_id, hides(user_id, users(id, username, avatar_url))")
      .gte("created_at", monday.toISOString()),
  ]);

  const hideOfWeek = awardData?.hides as Hide | undefined;

  // Compute best player of the week from weekly votes
  type PlayerInfo = { id: string; username: string; avatar_url: string; count: number };

  const bestPlayer = ((): PlayerInfo | null => {
    if (!weeklyVoteRows || weeklyVoteRows.length === 0) return null;
    const counts: Record<string, PlayerInfo> = {};
    for (const row of weeklyVoteRows) {
      const hide = row.hides as unknown as { user_id: string; users?: { id: string; username: string; avatar_url: string } } | null;
      if (!hide?.users) continue;
      const u = hide.users;
      counts[u.id] = counts[u.id]
        ? { ...counts[u.id], count: counts[u.id].count + 1 }
        : { id: u.id, username: u.username, avatar_url: u.avatar_url, count: 1 };
    }
    return Object.values(counts).reduce<PlayerInfo | null>(
      (best, p) => (!best || p.count > best.count ? p : best),
      null
    );
  })();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/20 via-transparent to-purple-950/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-green-400/10 border border-green-400/20 rounded-full px-4 py-1.5 text-green-400 text-sm font-medium mb-6">
            <Flame size={14} />
            Community Rankings Live
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
            MECCA<span className="text-green-400">HUB</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            The community ranking hub for{" "}
            <span className="text-white font-semibold">Meccha Chameleon</span>.
            Discover, share, and vote on the best hides.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/browse"
              className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 rounded-lg transition-colors text-sm"
            >
              Browse Hides
            </Link>
            <Link
              href="/rankings"
              className="bg-[#131320] hover:bg-[#1a1a2e] text-white font-medium px-8 py-3 rounded-lg transition-colors border border-gray-700 text-sm"
            >
              View Rankings
            </Link>
            <Link
              href="/submit"
              className="bg-[#131320] hover:bg-[#1a1a2e] text-green-400 font-medium px-8 py-3 rounded-lg transition-colors border border-green-900/50 text-sm"
            >
              Submit a Hide
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-16">
        {/* Hide of the Week */}
        {hideOfWeek && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-yellow-400 w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Hide of the Week</h2>
              <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-xs px-2 py-0.5 rounded-full font-medium">
                Featured
              </span>
            </div>
            <div className="max-w-md">
              <HideCard hide={hideOfWeek} featured />
            </div>
          </section>
        )}

        {/* Best Player of the Week */}
        {bestPlayer !== null && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="text-green-400 w-6 h-6" />
              <h2 className="text-2xl font-bold text-white">Best Player This Week</h2>
              <span className="bg-green-400/10 text-green-400 border border-green-400/20 text-xs px-2 py-0.5 rounded-full font-medium">
                Live
              </span>
            </div>
            <Link
              href={`/profile/${bestPlayer.id}`}
              className="inline-flex items-center gap-4 bg-[#131320] border border-gray-800 hover:border-green-900/50 rounded-xl px-5 py-4 group transition-colors"
            >
              <Image
                src={bestPlayer.avatar_url ?? "/default-avatar.png"}
                alt={bestPlayer.username}
                width={52}
                height={52}
                className="rounded-full border-2 border-green-500/40 shrink-0"
              />
              <div>
                <p className="text-white font-bold text-base group-hover:text-green-400 transition-colors">
                  {bestPlayer.username}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="text-green-400 font-semibold">{bestPlayer.count}</span> votes earned this week
                </p>
              </div>
              <ArrowRight className="ml-2 text-gray-700 group-hover:text-green-400 transition-colors" size={18} />
            </Link>
          </section>
        )}

        {/* Top 5 this week */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="text-green-400 w-5 h-5" />
              <h2 className="text-2xl font-bold text-white">Top Hides This Week</h2>
            </div>
            <Link
              href="/rankings"
              className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 transition-colors"
            >
              Full rankings <ArrowRight size={14} />
            </Link>
          </div>
          {topHides && topHides.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topHides.map((hide, i) => (
                <HideCard key={hide.id} hide={hide as Hide} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div className="bg-[#131320] border border-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-500">No hides submitted this week yet.</p>
              <Link href="/submit" className="text-green-400 hover:text-green-300 text-sm mt-2 inline-block">
                Submit the first one →
              </Link>
            </div>
          )}
        </section>

        {/* Recent Submissions */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="text-gray-400 w-5 h-5" />
              <h2 className="text-2xl font-bold text-white">Recent Submissions</h2>
            </div>
            <Link
              href="/browse"
              className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 transition-colors"
            >
              Browse all <ArrowRight size={14} />
            </Link>
          </div>
          {recentHides && recentHides.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentHides.map((hide) => (
                <HideCard key={hide.id} hide={hide as Hide} />
              ))}
            </div>
          ) : (
            <div className="bg-[#131320] border border-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-500">No hides yet. Be the first to submit!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
