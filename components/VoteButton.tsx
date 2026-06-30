"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { useSession } from "next-auth/react";
import clsx from "clsx";

interface VoteButtonProps {
  hideId: string;
  initialVotes: number;
  hasVoted: boolean;
}

export default function VoteButton({ hideId, initialVotes, hasVoted: initialHasVoted }: VoteButtonProps) {
  const { data: session } = useSession();
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [loading, setLoading] = useState(false);

  async function handleVote() {
    if (!session) {
      window.location.href = `/api/steam?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/votes", {
        method: hasVoted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hideId }),
      });
      if (res.ok) {
        setVotes((v) => (hasVoted ? v - 1 : v + 1));
        setHasVoted(!hasVoted);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={clsx(
        "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 select-none",
        hasVoted
          ? "btn-primary"
          : "bg-surface border border-white/10 text-gray-300 hover:border-green-400/30 hover:text-white"
      )}
    >
      <ThumbsUp size={16} className={hasVoted ? "fill-current" : ""} />
      <span>{votes} {votes === 1 ? "vote" : "votes"}</span>
    </button>
  );
}
