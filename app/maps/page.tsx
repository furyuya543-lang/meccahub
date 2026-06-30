import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, Plus } from "lucide-react";
import MapVoteButton from "@/components/MapVoteButton";
import { MapSubmission, User } from "@/types";

export const revalidate = 60;

type MapWithUser = MapSubmission & { users: User | null };

export default async function MapsPage() {
  const supabase = createServerSupabaseClient();
  const session = await getSession();

  const [{ data: maps }, { data: userVoteRows }] = await Promise.all([
    supabase
      .from("map_submissions")
      .select("*, users(*)")
      .eq("status", "approved")
      .order("votes", { ascending: false }),

    session?.user.id
      ? supabase
          .from("map_votes")
          .select("map_id")
          .eq("user_id", session.user.id)
      : Promise.resolve({ data: [] as { map_id: string }[] }),
  ]);

  const votedIds = new Set((userVoteRows ?? []).map((r) => r.map_id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <MapPin className="text-green-400 w-6 h-6" />
            <h1 className="text-3xl font-black text-white">Community Maps</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Steam Workshop maps shared and voted on by the community
          </p>
        </div>
        <Link
          href="/submit-map"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-colors shrink-0"
        >
          <Plus size={15} />
          Share a Map
        </Link>
      </div>

      {/* Grid / empty state */}
      {!maps || maps.length === 0 ? (
        <div className="bg-[#131320] border border-gray-800 rounded-xl p-16 text-center">
          <MapPin className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold mb-1">No maps yet</p>
          <p className="text-gray-600 text-sm mb-6">
            Share a Steam Workshop map you found to get it listed here.
          </p>
          <Link
            href="/submit-map"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus size={15} />
            Share a Map
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(maps as MapWithUser[]).map((map) => (
            <MapCard key={map.id} map={map} hasVoted={votedIds.has(map.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MapCard({ map, hasVoted }: { map: MapWithUser; hasVoted: boolean }) {
  return (
    <div className="group bg-[#131320] border border-gray-800 hover:border-green-500/40 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-green-900/10 flex flex-col">
      {/* Preview image */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden shrink-0">
        {map.preview_image_url ? (
          <Image
            src={map.preview_image_url}
            alt={map.map_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <MapPin className="w-10 h-10 text-gray-700" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
          {map.map_name}
        </h3>
        {map.description && (
          <p className="text-gray-500 text-xs line-clamp-2 mb-3">
            {map.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/60">
          <div className="flex items-center gap-3 min-w-0">
            {map.users && (
              <a
                href={`https://steamcommunity.com/profiles/${map.users.steam_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors min-w-0"
              >
                {map.users.avatar_url && (
                  <Image
                    src={map.users.avatar_url}
                    alt={map.users.username}
                    width={16}
                    height={16}
                    className="rounded-full border border-gray-700 shrink-0"
                  />
                )}
                <span className="text-gray-600 shrink-0">Shared by</span>
                <span className="truncate max-w-[80px]">{map.users.username}</span>
              </a>
            )}
            <a
              href={map.steam_workshop_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors shrink-0"
            >
              <ExternalLink size={11} />
              Workshop
            </a>
          </div>
          <MapVoteButton
            mapId={map.id}
            initialVotes={map.votes}
            hasVoted={hasVoted}
          />
        </div>
      </div>
    </div>
  );
}
