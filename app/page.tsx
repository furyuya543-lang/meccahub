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
    supabase.from("awards").select("*, hides(*, users(*))").order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("hides").select("*, users(*)").gte("created_at", monday.toISOString()).order("votes", { ascending: false }).limit(5),
    supabase.from("hides").select("*, users(*)").order("created_at", { ascending: false }).limit(6),
    supabase.from("votes").select("hide_id, hides(user_id, users(id, username, avatar_url))").gte("created_at", monday.toISOString()),
  ]);

  const hideOfWeek = awardData?.hides as Hide | undefined;

  type PlayerInfo = { id: string; username: string; avatar_url: string; count: number };
  const bestPlayer = ((): PlayerInfo | null => {
    if (!weeklyVoteRows?.length) return null;
    const counts: Record<string, PlayerInfo> = {};
    for (const row of weeklyVoteRows) {
      const hide = row.hides as unknown as { user_id: string; users?: { id: string; username: string; avatar_url: string } } | null;
      if (!hide?.users) continue;
      const u = hide.users;
      counts[u.id] = counts[u.id]
        ? { ...counts[u.id], count: counts[u.id].count + 1 }
        : { id: u.id, username: u.username, avatar_url: u.avatar_url, count: 1 };
    }
    return Object.values(counts).reduce<PlayerInfo | null>((best, p) => (!best || p.count > best.count ? p : best), null);
  })();

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden hero-bg">
        {/* Glow orbs */}
        <div className="hero-orb w-[500px] h-[500px] bg-green-500 top-[-120px] left-[-100px]" />
        <div className="hero-orb w-[400px] h-[400px] bg-teal-500 bottom-[-80px] right-[-60px]" />
        <div className="hero-orb w-[300px] h-[300px] bg-purple-600 top-[20%] right-[20%]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-green-400/10 border border-green-400/20 rounded-full px-4 py-1.5 text-green-400 text-xs font-semibold mb-8 backdrop-blur-sm">
            <Flame size={13} />
            Community Rankings Live
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-3 tracking-tight leading-none">
            MECCHA CHAMELEON
            <span className="block text-gradient mt-1">HUB</span>
          </h1>

          <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            The community ranking hub for{" "}
            <span className="text-white font-semibold">Meccha Chameleon</span>.
            Discover, share, and vote on the best hides.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/browse" className="btn-primary px-8 py-3 text-sm">
              Browse Hides
            </Link>
            <Link href="/rankings" className="btn-secondary px-8 py-3 text-sm">
              View Rankings
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 text-sm font-medium px-8 py-3 rounded-lg border border-green-400/20 text-green-400 hover:bg-green-400/10 transition-all"
            >
              Submit a Hide
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-14 flex flex-wrap justify-center gap-8 text-sm">
            {[
              { label: "Hides submitted", value: "∞" },
              { label: "Community votes", value: "🔥" },
              { label: "Maps supported", value: "20+" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-gradient">{value}</div>
                <div className="text-gray-500 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-20 pt-16">

        {/* Hide of the Week */}
        {hideOfWeek && (
          <section>
            <SectionHeader icon={<Trophy className="text-yellow-400" size={20} />} title="Hide of the Week">
              <span className="inline-flex items-center gap-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-xs px-2.5 py-1 rounded-full font-semibold">
                ★ Featured
              </span>
            </SectionHeader>
            <div className="max-w-sm">
              <HideCard hide={hideOfWeek} featured />
            </div>
          </section>
        )}

        {/* Best Player */}
        {bestPlayer && (
          <section>
            <SectionHeader icon={<UserIcon className="text-teal-400" size={20} />} title="Best Player This Week">
              <span className="inline-flex items-center gap-1 bg-teal-400/10 text-teal-400 border border-teal-400/20 text-xs px-2.5 py-1 rounded-full font-semibold">
                Live
              </span>
            </SectionHeader>
            <Link
              href={`/profile/${bestPlayer.id}`}
              className="inline-flex items-center gap-4 bg-surface/80 backdrop-blur-sm border border-white/5 hover:border-teal-400/25 rounded-xl px-5 py-4 group transition-all hover:shadow-glow-teal"
            >
              <Image
                src={bestPlayer.avatar_url ?? "/default-avatar.png"}
                alt={bestPlayer.username}
                width={52}
                height={52}
                className="rounded-full border-2 border-teal-400/30 shrink-0"
              />
              <div>
                <p className="text-white font-bold text-base group-hover:text-gradient transition-all">
                  {bestPlayer.username}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  <span className="text-teal-400 font-semibold">{bestPlayer.count}</span> votes earned this week
                </p>
              </div>
              <ArrowRight className="ml-2 text-gray-700 group-hover:text-teal-400 transition-colors" size={18} />
            </Link>
          </section>
        )}

        {/* Top Hides This Week */}
        <section>
          <SectionHeader icon={<Trophy className="text-green-400" size={20} />} title="Top Hides This Week">
            <Link href="/rankings" className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 transition-colors">
              Full rankings <ArrowRight size={13} />
            </Link>
          </SectionHeader>
          {topHides?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topHides.map((hide, i) => (
                <HideCard key={hide.id} hide={hide as Hide} rank={i + 1} />
              ))}
            </div>
          ) : (
            <EmptyState msg="No hides submitted this week yet.">
              <Link href="/submit" className="text-green-400 hover:text-green-300 text-sm mt-1 inline-block">Submit the first one →</Link>
            </EmptyState>
          )}
        </section>

        {/* Recent Submissions */}
        <section>
          <SectionHeader icon={<Clock className="text-gray-400" size={20} />} title="Recent Submissions">
            <Link href="/browse" className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 transition-colors">
              Browse all <ArrowRight size={13} />
            </Link>
          </SectionHeader>
          {recentHides?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentHides.map((hide) => (
                <HideCard key={hide.id} hide={hide as Hide} />
              ))}
            </div>
          ) : (
            <EmptyState msg="No hides yet. Be the first to submit!" />
          )}
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

function EmptyState({ msg, children }: { msg: string; children?: React.ReactNode }) {
  return (
    <div className="bg-surface/80 border border-white/5 rounded-xl p-12 text-center">
      <p className="text-gray-500 text-sm">{msg}</p>
      {children}
    </div>
  );
}
