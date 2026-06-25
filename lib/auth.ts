import { NextAuthOptions, getServerSession } from "next-auth";
import SteamProvider from "./steam-provider";
import { createServerSupabaseClient } from "./supabase-server";

// Ensure NextAuth never sees an http:// base URL — Netlify can inject http://
// into NEXTAUTH_URL even when the site runs on HTTPS.
if (process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL.replace(
    /^http:\/\//,
    "https://"
  );
}

export const authOptions: NextAuthOptions = {
  providers: [SteamProvider()],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.steamId = user.id;

        const supabase = createServerSupabaseClient();

        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("steam_id", user.id)
          .single();

        if (existing) {
          token.userId = existing.id;
          await supabase
            .from("users")
            .update({ username: user.name ?? "", avatar_url: user.image ?? "" })
            .eq("steam_id", user.id);
        } else {
          const { data: created } = await supabase
            .from("users")
            .insert({
              steam_id: user.id,
              username: user.name ?? "",
              avatar_url: user.image ?? "",
              steam_profile_url: `https://steamcommunity.com/profiles/${user.id}`,
              reputation: 0,
            })
            .select("id")
            .single();
          token.userId = created?.id ?? "";
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.steamId = token.steamId;
      return session;
    },
  },
  session: { strategy: "jwt" },
};

export async function getSession() {
  return getServerSession(authOptions);
}
