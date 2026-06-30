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

  // Log the full session.user so we can see exactly what fields exist
  console.log("[EditButton] session.user:", JSON.stringify(session?.user ?? null));
  console.log("[EditButton] hide.user_id:", hideUserId);
  console.log("[EditButton] session.user.supabaseUserId:", session?.user?.supabaseUserId);
  console.log("[EditButton] session.user.id:", session?.user?.id);

  // Try supabaseUserId first, fall back to id
  const currentUserId = session?.user?.supabaseUserId || session?.user?.id;
  console.log("[EditButton] currentUserId used for comparison:", currentUserId, "| match:", currentUserId === hideUserId);

  if (!session || currentUserId !== hideUserId) return null;

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
