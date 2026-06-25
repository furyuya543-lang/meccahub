import { createServerSupabaseClient } from "@/lib/supabase-server";
import Image from "next/image";
import Link from "next/link";
import { Trophy, User as UserIcon, ArchiveIcon } from "lucide-react";

export const revalidate = 3600;

interface PageProps {
  searchParams: { year?: string };
}

interface HideArchiveRow {
  id: string;
  week: number;
  year: number;
  votes: number;
  hides: {
    id: string;
    title: string;
    screenshot_url: string;
    users: { id: string; username: string } | null;
  } | null;
}

interface PlayerArchiveRow {
  id: string;
  week: number;
  year: number;
  votes: number;
  users: { id: string; username: string; avatar_url: string } | null;
}

export default async function ArchivesPage({ searchParams }: PageProps) {
  const supabase = createServerSupabaseClient();
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : undefined;

  const { data: yearRows } = await supabase
    .from("archives")
    .select("year")
    .order("year", { ascending: false });

  const allYears = (yearRows ?? []).map((r) => r.year as number);
  const years = allYears.filter((y, i) => allYears.indexOf(y) === i);

  const [{ data: rawHideArchives }, { data: rawPlayerArchives }] = await Promise.all([
    selectedYear
      ? supabase
          .from("archives")
          .select("id, week, year, votes, hides(id, title, screenshot_url, users(id, username))")
          .eq("category", "hide")
          .eq("year", selectedYear)
          .order("year", { ascending: false })
          .order("week", { ascending: false })
      : supabase
          .from("archives")
          .select("id, week, year, votes, hides(id, title, screenshot_url, users(id, username))")
          .eq("category", "hide")
          .order("year", { ascending: false })
          .order("week", { ascending: false }),

    selectedYear
      ? supabase
          .from("archives")
          .select("id, week, year, votes, users(id, username, avatar_url)")
          .eq("category", "player")
          .eq("year", selectedYear)
          .order("year", { ascending: false })
          .order("week", { ascending: false })
      : supabase
          .from("archives")
          .select("id, week, year, votes, users(id, username, avatar_url)")
          .eq("category", "player")
          .order("year", { ascending: false })
          .order("week", { ascending: false }),
  ]);

  const hideArchives = (rawHideArchives ?? []) as unknown as HideArchiveRow[];
  const playerArchives = (rawPlayerArchives ?? []) as unknown as PlayerArchiveRow[];

  // Merge into week buckets
  const weekMap: Record<string, { week: number; year: number; hide?: HideArchiveRow; player?: PlayerArchiveRow }> = {};

  for (const entry of hideArchives) {
    const key = `${entry.year}-${entry.week}`;
    weekMap[key] = { ...(weekMap[key] ?? { week: entry.week, year: entry.year }), hide: entry };
  }
  for (const entry of playerArchives) {
    const key = `${entry.year}-${entry.week}`;
    weekMap[key] = { ...(weekMap[key] ?? { week: entry.week, year: entry.year }), player: entry };
  }

  const weeks = Object.values(weekMap).sort(
    (a, b) => b.year - a.year || b.week - a.week
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <ArchiveIcon className="text-yellow-400 w-6 h-6" />
          <h1 className="text-3xl font-black text-white">Weekly Archives</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Hall of fame — every week&apos;s best hide and top player, preserved forever
        </p>
      </div>

      {/* Year filter */}
      {years.length > 1 && (
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <Link
            href="/archives"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedYear
                ? "bg-green-500 text-black"
                : "bg-[#131320] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            All Years
          </Link>
          {years.map((year) => (
            <Link
              key={year}
              href={`/archives?year=${year}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedYear === year
                  ? "bg-green-500 text-black"
                  : "bg-[#131320] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {year}
            </Link>
          ))}
        </div>
      )}

      {/* Archive list */}
      {weeks.length === 0 ? (
        <div className="bg-[#131320] border border-gray-800 rounded-xl p-16 text-center">
          <ArchiveIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No archives yet. Winners are saved every Monday at midnight.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {weeks.map(({ week, year, hide, player }) => (
            <div
              key={`${year}-${week}`}
              className="bg-[#131320] border border-gray-800 rounded-xl overflow-hidden"
            >
              {/* Week header */}
              <div className="px-5 py-3 border-b border-gray-800/60 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">
                  Week {week},{" "}
                  <span className="text-gray-400 font-normal">{year}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800/60">
                {/* Hide of the week */}
                <div className="p-5">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Trophy size={11} className="text-yellow-400" />
                    Hide of the Week
                  </p>
                  {hide?.hides ? (
                    <Link href={`/hide/${hide.hides.id}`} className="flex items-center gap-3 group">
                      {hide.hides.screenshot_url && (
                        <Image
                          src={hide.hides.screenshot_url}
                          alt={hide.hides.title}
                          width={80}
                          height={52}
                          className="rounded-lg object-cover border border-gray-700 shrink-0 group-hover:border-green-500/50 transition-colors"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors truncate">
                          {hide.hides.title}
                        </p>
                        {hide.hides.users && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            by{" "}
                            <Link
                              href={`/profile/${hide.hides.users.id}`}
                              className="hover:text-gray-300 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {hide.hides.users.username}
                            </Link>
                          </p>
                        )}
                        <p className="text-xs text-green-400 font-bold mt-1">
                          {hide.votes} votes
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-600 italic">No submissions that week</p>
                  )}
                </div>

                {/* Player of the week */}
                <div className="p-5">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <UserIcon size={11} className="text-green-400" />
                    Player of the Week
                  </p>
                  {player?.users ? (
                    <Link href={`/profile/${player.users.id}`} className="flex items-center gap-3 group">
                      <Image
                        src={player.users.avatar_url ?? "/default-avatar.png"}
                        alt={player.users.username}
                        width={44}
                        height={44}
                        className="rounded-full border border-gray-700 group-hover:border-green-500/50 transition-colors shrink-0"
                      />
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">
                          {player.users.username}
                        </p>
                        <p className="text-xs text-green-400 font-bold mt-0.5">
                          {player.votes} votes earned
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-600 italic">No votes cast that week</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
