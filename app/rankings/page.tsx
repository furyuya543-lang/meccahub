import { createServerSupabaseClient } from "@/lib/supabase-server";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Medal, Star, ArchiveIcon, ArrowRight, User as UserIcon } from "lucide-react";
import { Hide, User } from "@/types";
import { getISOWeek, getYear, startOfISOWeek, subWeeks } from "date-fns";

export const revalidate = 120;

interface HideWithUser extends Hide {
  users: User;
}

export default async function RankingsPage() {
  const supabase = createServerSupabaseClient();
  const now = new Date();

  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const currentWeek = getISOWeek(now);
  const currentYear = getYear(now);

  // Last week's date range for archive lookup
  const lastWeekStart = startOfISOWeek(subWeeks(now, 1));
  const lastWeek = getISOWeek(lastWeekStart);
  const lastYear = getYear(lastWeekStart);

  const [
    { data: weeklyHides },
    { data: allTimeHides },
    { data: topPlayers },
    { data: lastHideArchive },
    { data: lastPlayerArchive },
  ] = await Promise.all([
    supabase
      .from("hides")
      .select("*, users(*)")
      .gte("created_at", monday.toISOString())
      .order("votes", { ascending: false })
      .limit(20),

    supabase
      .from("hides")
      .select("*, users(*)")
      .order("votes", { ascending: false })
      .limit(20),

    supabase
      .from("users")
      .select("*, hides(votes)")
      .order("reputation", { ascending: false })
      .limit(10),

    supabase
      .from("archives")
      .select("*, hides(id, title, screenshot_url, votes, users(id, username))")
      .eq("category", "hide")
      .eq("week", lastWeek)
      .eq("year", lastYear)
      .maybeSingle(),

    supabase
      .from("archives")
      .select("*, users(id, username, avatar_url)")
      .eq("category", "player")
      .eq("week", lastWeek)
      .eq("year", lastYear)
      .maybeSingle(),
  ]);

  const lastWinnerHide = lastHideArchive?.hides as
    | { id: string; title: string; screenshot_url: string; votes: number; users?: { id: string; username: string } }
    | undefined;
  const lastWinnerPlayer = lastPlayerArchive?.users as
    | { id: string; username: string; avatar_url: string }
    | undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="text-yellow-400 w-6 h-6" />
          <h1 className="text-3xl font-black text-white">Rankings</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Week {currentWeek}, {currentYear}
        </p>
      </div>

      {/* Last week's winners banner */}
      {(lastWinnerHide || lastWinnerPlayer) && (
        <div className="mb-8 bg-[#131320] border border-yellow-900/30 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-bold text-sm">
                Last Week&apos;s Winners — Week {lastWeek}, {lastYear}
              </span>
            </div>
            <Link
              href="/archives"
              className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
            >
              All archives <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800/60">
            {/* Hide winner */}
            <div className="p-5">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Trophy size={11} className="text-yellow-400" />
                Hide of the Week
              </p>
              {lastWinnerHide ? (
                <Link href={`/hide/${lastWinnerHide.id}`} className="flex items-center gap-3 group">
                  {lastWinnerHide.screenshot_url && (
                    <Image
                      src={lastWinnerHide.screenshot_url}
                      alt={lastWinnerHide.title}
                      width={72}
                      height={48}
                      className="rounded-lg object-cover border border-gray-700 shrink-0 group-hover:border-yellow-500/50 transition-colors"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
                      {lastWinnerHide.title}
                    </p>
                    {lastWinnerHide.users && (
                      <p className="text-xs text-gray-500 mt-0.5">by {lastWinnerHide.users.username}</p>
                    )}
                    <p className="text-xs text-green-400 font-bold mt-1">{lastHideArchive!.votes} votes</p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-gray-600 italic">No data</p>
              )}
            </div>

            {/* Player winner */}
            <div className="p-5">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <UserIcon size={11} className="text-green-400" />
                Player of the Week
              </p>
              {lastWinnerPlayer ? (
                <Link href={`/profile/${lastWinnerPlayer.id}`} className="flex items-center gap-3 group">
                  <Image
                    src={lastWinnerPlayer.avatar_url ?? "/default-avatar.png"}
                    alt={lastWinnerPlayer.username}
                    width={40}
                    height={40}
                    className="rounded-full border border-gray-700 group-hover:border-green-500/50 transition-colors shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">
                      {lastWinnerPlayer.username}
                    </p>
                    <p className="text-xs text-green-400 font-bold mt-0.5">
                      {lastPlayerArchive!.votes} votes earned
                    </p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-gray-600 italic">No data</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Rankings */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Medal className="text-green-400 w-5 h-5" />
              Weekly Top Hides
            </h2>
            <RankingTable hides={(weeklyHides ?? []) as HideWithUser[]} />
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star className="text-yellow-400 w-5 h-5" />
              All-Time Top Hides
            </h2>
            <RankingTable hides={(allTimeHides ?? []) as HideWithUser[]} />
          </section>

          {/* Past Winners link */}
          <Link
            href="/archives"
            className="flex items-center justify-between bg-[#131320] border border-gray-800 hover:border-green-900/50 rounded-xl px-5 py-4 group transition-colors"
          >
            <div className="flex items-center gap-3">
              <ArchiveIcon className="text-yellow-400 w-5 h-5" />
              <div>
                <p className="text-white font-semibold text-sm">Past Winners</p>
                <p className="text-xs text-gray-500">Browse every week&apos;s best hide and top player</p>
              </div>
            </div>
            <ArrowRight className="text-gray-600 group-hover:text-green-400 transition-colors" size={18} />
          </Link>
        </div>

        {/* Top Players sidebar */}
        <aside>
          <h2 className="text-lg font-bold text-white mb-4">Top Players</h2>
          <div className="bg-[#131320] border border-gray-800 rounded-xl overflow-hidden">
            {(topPlayers ?? []).map((player, i) => {
              const totalVotes = (player.hides ?? []).reduce(
                (sum: number, h: { votes: number }) => sum + (h.votes ?? 0),
                0
              );
              return (
                <Link
                  key={player.id}
                  href={`/profile/${player.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a2e] transition-colors border-b border-gray-800/50 last:border-0"
                >
                  <span
                    className={`text-sm font-bold w-6 shrink-0 ${
                      i === 0
                        ? "text-yellow-400"
                        : i === 1
                        ? "text-gray-300"
                        : i === 2
                        ? "text-amber-600"
                        : "text-gray-600"
                    }`}
                  >
                    #{i + 1}
                  </span>
                  <Image
                    src={player.avatar_url ?? "/default-avatar.png"}
                    alt={player.username}
                    width={32}
                    height={32}
                    className="rounded-full border border-gray-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{player.username}</p>
                    <p className="text-xs text-gray-500">{totalVotes} total votes</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function RankingTable({ hides }: { hides: HideWithUser[] }) {
  if (hides.length === 0) {
    return (
      <div className="bg-[#131320] border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
        No hides yet.
      </div>
    );
  }

  return (
    <div className="bg-[#131320] border border-gray-800 rounded-xl overflow-hidden">
      {hides.map((hide, i) => (
        <Link
          key={hide.id}
          href={`/hide/${hide.id}`}
          className="flex items-center gap-4 px-4 py-3 hover:bg-[#1a1a2e] transition-colors border-b border-gray-800/50 last:border-0"
        >
          <span
            className={`text-sm font-black w-7 shrink-0 text-center ${
              i === 0
                ? "text-yellow-400"
                : i === 1
                ? "text-gray-300"
                : i === 2
                ? "text-amber-600"
                : "text-gray-600"
            }`}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{hide.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">{hide.map}</span>
              {hide.users && (
                <span className="text-xs text-gray-600 truncate">
                  by {hide.users.username}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-400 font-bold text-sm shrink-0">
            <Trophy size={13} />
            {hide.votes}
          </div>
        </Link>
      ))}
    </div>
  );
}
