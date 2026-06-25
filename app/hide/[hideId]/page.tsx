import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Map, Tag, ExternalLink, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Hide, Comment } from "@/types";
import VoteButton from "@/components/VoteButton";
import CommentSection from "@/components/CommentSection";
import ReportButton from "@/components/ReportButton";
import clsx from "clsx";

export const revalidate = 30;

export default async function HidePage({
  params,
}: {
  params: { hideId: string };
}) {
  const supabase = createServerSupabaseClient();
  const session = await getSession();

  const [{ data: hide }, { data: comments }] = await Promise.all([
    supabase
      .from("hides")
      .select("*, users(*)")
      .eq("id", params.hideId)
      .single(),

    supabase
      .from("comments")
      .select("*, users(*)")
      .eq("hide_id", params.hideId)
      .order("created_at", { ascending: false }),
  ]);

  if (!hide) notFound();

  // Check if current user voted today
  let hasVoted = false;
  if (session?.user.id) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: vote } = await supabase
      .from("votes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("hide_id", params.hideId)
      .gte("created_at", `${today}T00:00:00Z`)
      .lte("created_at", `${today}T23:59:59Z`)
      .single();
    hasVoted = !!vote;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-green-400 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/browse" className="hover:text-green-400 transition-colors">Browse</Link>
        <span>/</span>
        <span className="text-gray-300 truncate">{hide.title}</span>
      </div>

      {/* Screenshot */}
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-900 mb-6">
        <Image
          src={hide.screenshot_url}
          alt={hide.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 896px) 100vw, 896px"
        />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-3">
            {hide.title}
          </h1>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge icon={<Map size={12} />} label={hide.map} />
            <Badge icon={<Tag size={12} />} label={hide.category} purple />
          </div>
          {hide.users && (
            <Link
              href={`/profile/${hide.user_id}`}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors w-fit"
            >
              <Image
                src={hide.users.avatar_url ?? "/default-avatar.png"}
                alt={hide.users.username}
                width={24}
                height={24}
                className="rounded-full border border-gray-700"
              />
              <span>{hide.users.username}</span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-600">
                {formatDistanceToNow(new Date(hide.created_at), { addSuffix: true })}
              </span>
            </Link>
          )}
          <div className="mt-2">
            <ReportButton hideId={hide.id} />
          </div>
        </div>

        <VoteButton
          hideId={hide.id}
          initialVotes={hide.votes}
          hasVoted={hasVoted}
        />
      </div>

      {/* Description */}
      {hide.description && (
        <div className="bg-[#131320] border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h2>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {hide.description}
          </p>
        </div>
      )}

      {/* Video */}
      {hide.video_url && (
        <div className="mb-6">
          <a
            href={hide.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#131320] hover:bg-[#1a1a2e] border border-gray-700 hover:border-green-500/40 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Video size={16} className="text-red-400" />
            Watch Video
            <ExternalLink size={13} className="text-gray-500" />
          </a>
        </div>
      )}

      <hr className="border-gray-800 mb-6" />

      {/* Comments */}
      <CommentSection
        hideId={hide.id}
        initialComments={(comments ?? []) as Comment[]}
      />
    </div>
  );
}

function Badge({
  icon,
  label,
  purple,
}: {
  icon: React.ReactNode;
  label: string;
  purple?: boolean;
}) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1 text-xs px-2 py-0.5 rounded border",
        purple
          ? "text-purple-400 bg-purple-400/10 border-purple-400/20"
          : "text-gray-400 bg-gray-400/10 border-gray-700"
      )}
    >
      {icon}
      {label}
    </span>
  );
}
