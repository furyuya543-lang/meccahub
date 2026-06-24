"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useSession, signIn } from "next-auth/react";
import { Send } from "lucide-react";
import { Comment } from "@/types";

interface CommentSectionProps {
  hideId: string;
  initialComments: Comment[];
}

export default function CommentSection({
  hideId,
  initialComments,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      signIn("steam");
      return;
    }
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hideId, content: content.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setContent("");
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-white mb-4">
        Comments ({comments.length})
      </h2>

      {/* Input */}
      {session ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <Image
            src={session.user.image ?? "/default-avatar.png"}
            alt={session.user.name ?? ""}
            width={36}
            height={36}
            className="rounded-full border border-gray-700 shrink-0"
          />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a comment..."
              maxLength={500}
              className="flex-1 bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
            />
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black px-4 py-2 rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-[#131320] border border-gray-800 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Sign in to leave a comment</p>
          <button
            onClick={() => signIn("steam")}
            className="text-green-400 hover:text-green-300 text-sm font-medium"
          >
            Sign in with Steam
          </button>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {comment.users && (
                <Link href={`/profile/${comment.user_id}`} className="shrink-0">
                  <Image
                    src={comment.users.avatar_url}
                    alt={comment.users.username}
                    width={36}
                    height={36}
                    className="rounded-full border border-gray-700"
                  />
                </Link>
              )}
              <div className="flex-1 bg-[#131320] border border-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <Link
                    href={`/profile/${comment.user_id}`}
                    className="text-sm font-medium text-green-400 hover:text-green-300"
                  >
                    {comment.users?.username ?? "Unknown"}
                  </Link>
                  <span className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
