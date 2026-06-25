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
        "group relative bg-surface/80 backdrop-blur-sm border rounded-xl overflow-hidden",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-card",
        featured
          ? "border-yellow-400/25 hover:border-yellow-400/50"
          : "border-white/5 hover:border-green-400/25"
      )}
    >
      <Link href={`/hide/${hide.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-video bg-surface-2 overflow-hidden">
          <Image
            src={hide.screenshot_url}
            alt={hide.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {rank && (
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-green-400 font-black text-xs px-2.5 py-1 rounded-lg border border-green-400/20">
              #{rank}
            </div>
          )}

          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg border border-white/10">
            <ThumbsUp size={11} className="text-green-400" />
            <span className="font-semibold">{hide.votes}</span>
          </div>

          {featured && (
            <div className="absolute bottom-2 left-2 bg-yellow-400/20 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-yellow-400/30">
              ★ Featured
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-white font-bold text-sm mb-2.5 line-clamp-1 group-hover:text-gradient transition-all">
            {hide.title}
          </h3>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-xs px-2 py-0.5 rounded-md border text-purple-400 bg-purple-400/10 border-purple-400/20 font-medium">
              {hide.category}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Map size={11} className="text-teal-500" />
              {hide.map}
            </span>
            <div className="flex items-center gap-1.5">
              {hide.users && (
                <span className="text-gray-600 truncate max-w-[90px]">
                  {hide.users.username}
                </span>
              )}
              <span className="text-gray-800">·</span>
              <span>{formatDistanceToNow(new Date(hide.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-3 pt-1.5 border-t border-white/5 flex justify-end">
        <ReportButton hideId={hide.id} />
      </div>
    </div>
  );
}
