"use client";

import { Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function SteamSignInInner() {
  const params = useSearchParams();

  useEffect(() => {
    const token       = params.get("token") ?? "";
    const callbackUrl = params.get("callbackUrl") ?? "/";

    if (!token) {
      window.location.href = "/?error=AuthFailed";
      return;
    }

    // Let NextAuth create the session cookie — this avoids JWT_SESSION_ERROR
    // caused by manually encoding JWTs outside NextAuth's internal flow.
    signIn("steam", { token, callbackUrl });
  }, [params]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="animate-spin text-green-400" size={28} />
      <p className="text-gray-400 text-sm">Signing you in…</p>
    </div>
  );
}

export default function SteamSignInPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-green-400" size={28} />
      </div>
    }>
      <SteamSignInInner />
    </Suspense>
  );
}
