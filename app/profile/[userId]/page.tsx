import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Trophy, ThumbsUp, Medal, ExternalLink } from "lucide-react";
import HideCard from "@/components/HideCard";
import { Hide, Award } from "@/types";

export const revalidate = 60;

export default async function ProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const supabase = createServerSupabaseClient();

  const [{ data: user }, { data: hides }, { data: awards }] = await Promise.all([
    supabase.from("users").select("*").eq("id", params.userId).single(),

    supabase
      .from("hides")
      .select("*, users(*)")
      .eq("user_id", params.userId)
      .order("votes", { ascending: false }),

    supabase
      .from("awards")
      .select("*, hides(*, users(*))")
      .eq("user_id", params.userId)
      .order("year", { ascending: false })
      .order("week", { ascending: false }),
  ]);

  if (!user) notFound();

  const totalVotes = (hides ?? []).reduce((sum, h) => sum + (h.votes ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile header */}
      <div className="bg-[#131320] border border-gray-800 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Image
            src={user.avatar_url ?? "/default-avatar.png"}
            alt={user.username}
            width={88}
            height={88}
            className="rounded-2xl border-2 border-green-500/30"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-white">{user.username}</h1>
              <a
                href={user.steam_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-green-400 transition-colors"
              >
                <ExternalLink size={15} />
              </a>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
            <div className="flex flex-wrap gap-4">
              <Stat icon={<Medal size={15} />} label="Hides" value={hides?.length ?? 0} />
              <Stat icon={<ThumbsUp size={15} />} label="Total Votes" value={totalVotes} />
              <Stat icon={<Trophy size={15} />} label="Awards" value={awards?.length ?? 0} color="text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submitted hides */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4">
            Submitted Hides ({hides?.length ?? 0})
          </h2>
          {hides && hides.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hides.map((hide) => (
                <HideCard key={hide.id} hide={hide as Hide} />
              ))}
            </div>
          ) : (
            <div className="bg-[#131320] border border-gray-800 rounded-xl p-10 text-center text-gray-500 text-sm">
              No hides submitted yet.
            </div>
          )}
        </div>

        {/* Awards */}
        <aside>
          <h2 className="text-lg font-bold text-white mb-4">Awards</h2>
          {awards && awards.length > 0 ? (
            <div className="space-y-3">
              {awards.map((award: Award) => (
                <div
                  key={award.id}
                  className="bg-[#131320] border border-yellow-600/20 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 font-semibold text-sm">
                      {award.award_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Week {award.week}, {award.year}
                  </p>
                  {award.hides && (
                    <Link
                      href={`/hide/${award.hide_id}`}
                      className="text-xs text-gray-300 hover:text-green-400 transition-colors truncate block"
                    >
                      {award.hides.title}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#131320] border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
              No awards yet.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  color = "text-green-400",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-[#1a1a2e] rounded-lg px-3 py-2">
      <span className={color}>{icon}</span>
      <div>
        <p className="text-white font-bold text-sm leading-none">{value}</p>
        <p className="text-gray-500 text-xs">{label}</p>
      </div>
    </div>
  );
}
