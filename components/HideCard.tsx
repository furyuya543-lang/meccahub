import Image from "next/image";
import Link from "next/link";
import { ThumbsUp, Map } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Hide } from "@/types";
import clsx from "clsx";
import ReportButton from "./ReportButton";

interface HideCardProps {
  hide: Hide;
  rank?: number;
  featured?: boolean;
}

export default function HideCard({ hide, rank, featured }: HideCardProps) {
  return (
    <div
      className={clsx(
        "group relative bg-[#131320] border rounded-xl overflow-hidden hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-900/10",
        featured ? "border-yellow-600/30" : "border-gray-800/60"
      )}
    >
      <Link href={`/hide/${hide.id}`} className="block">
        <div className="relative aspect-video bg-gray-900 overflow-hidden">
          <Image
            src={hide.screenshot_url}
            alt={hide.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {rank && (
            <div className="absolute top-2 left-2 bg-black/70 text-green-400 font-bold text-sm px-2 py-0.5 rounded">
              #{rank}
            </div>
          )}

          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white text-sm px-2 py-0.5 rounded">
            <ThumbsUp size={12} />
            <span>{hide.votes}</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-white font-semibold text-sm mb-2 line-clamp-1 group-hover:text-green-400 transition-colors">
            {hide.title}
          </h3>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 rounded border text-purple-400 bg-purple-400/10 border-purple-400/20">
              {hide.category}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Map size={11} />
                {hide.map}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {hide.users && (
                <span className="text-gray-600 truncate max-w-[100px]">
                  {hide.users.username}
                </span>
              )}
              <span className="text-gray-700">·</span>
              <span>
                {formatDistanceToNow(new Date(hide.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-3 pt-2 border-t border-gray-800/40 flex justify-end">
        <ReportButton hideId={hide.id} />
      </div>
    </div>
  );
}
