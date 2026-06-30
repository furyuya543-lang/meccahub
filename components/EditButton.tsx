"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Pencil } from "lucide-react";

export default function EditButton({
  hideId,
  hideUserId,
}: {
  hideId: string;
  hideUserId: string;
}) {
  const { data: session } = useSession();

  console.log(
    "[EditButton] session.user.supabaseUserId:",
    session?.user?.supabaseUserId ?? "(no session)",
    "| hide.user_id:",
    hideUserId,
    "| match:",
    session?.user?.supabaseUserId === hideUserId
  );

  if (!session || session.user.supabaseUserId !== hideUserId) return null;

  return (
    <Link
      href={`/hide/${hideId}/edit`}
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-400 transition-colors"
    >
      <Pencil size={12} />
      <span>Edit</span>
    </Link>
  );
}
