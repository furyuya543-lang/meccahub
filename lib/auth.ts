import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";
import { createServerSupabaseClient } from "./supabase-server";

// ── Bridge token ──────────────────────────────────────────────────────────────
// /api/steam/callback creates a short-lived HMAC-signed token after validating
// Steam OpenID. /steam-signin (client page) exchanges it via signIn("steam").
// This lets NextAuth own the JWT — no manual encode/decode conflicts.

function hmac(data: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function createSteamBridgeToken(steamId: string, userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + 120; // valid for 2 minutes
  const data = `${steamId}|${userId}|${exp}`;
  const sig = hmac(data);
  return Buffer.from(`${data}|${sig}`).toString("base64url");
}

export function verifySteamBridgeToken(tokenB64: string): { steamId: string; userId: string } | null {
  try {
    const raw = Buffer.from(tokenB64, "base64url").toString("utf8");
    const lastPipe = raw.lastIndexOf("|");
    if (lastPipe === -1) return null;
    const data = raw.slice(0, lastPipe);
    const sig  = raw.slice(lastPipe + 1);
    if (hmac(data) !== sig) return null;
    const parts = data.split("|");
    if (parts.length !== 3) return null;
    const [steamId, userId, expStr] = parts;
    if (Date.now() / 1000 > parseInt(expStr, 10)) return null;
    return { steamId, userId };
  } catch {
    return null;
  }
}

// ── NextAuth config ───────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "steam",
      name: "Steam",
      credentials: { token: { type: "text" } },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        const verified = verifySteamBridgeToken(credentials.token);
        if (!verified) {
          console.error("[auth] bridge token invalid or expired");
          return null;
        }

        const supabase = createServerSupabaseClient();
        const { data: user, error } = await supabase
          .from("users")
          .select("id, username, avatar_url, steam_id")
          .eq("id", verified.userId)
          .maybeSingle();

        if (error || !user) {
          console.error("[auth] user lookup failed:", error?.message);
          return null;
        }

        return {
          id:     user.steam_id as string,
          name:   user.username as string,
          email:  `${user.steam_id}@steamcommunity.com`,
          image:  (user.avatar_url as string) ?? "",
          userId: user.id as string,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.steamId = user.id;                    // SteamID64
        token.userId  = user.userId ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id      = token.userId  as string;
      session.user.steamId = token.steamId as string;
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages:   { signIn: "/" },
};

export async function getSession() {
  return getServerSession(authOptions);
}
