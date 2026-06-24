import { createServerSupabaseClient } from "@/lib/supabase-server";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Medal, Star } from "lucide-react";
import { Hide, User, DIFFICULTY_COLORS } from "@/types";
import { getISOWeek, getYear } from "date-fns";

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

  const [{ data: weeklyHides }, { data: allTimeHides }, { data: topPlayers }] =
    await Promise.all([
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
    ]);

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
              <span className={`text-xs px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[hide.difficulty]}`}>
                {hide.difficulty}
              </span>
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
