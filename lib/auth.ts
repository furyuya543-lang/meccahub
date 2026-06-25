import { NextAuthOptions, getServerSession } from "next-auth";
import { createServerSupabaseClient } from "./supabase-server";

// Steam sign-in is handled by /api/steam + /api/steam/callback (custom OpenID 2.0 flow).
// NextAuth is used only for session reading/writing via its JWT cookie.
export const authOptions: NextAuthOptions = {
  providers: [],
  callbacks: {
    async jwt({ token }) {
      // On first sign-in the token comes pre-populated by /api/steam/callback.
      // On subsequent refreshes just pass it through unchanged.
      if (token.steamId && !token.userId) {
        // Fallback: look up userId if somehow missing (shouldn't happen normally)
        const supabase = createServerSupabaseClient();
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("steam_id", token.steamId as string)
          .maybeSingle();
        if (data) token.userId = data.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.steamId = token.steamId as string;
      return session;
    },
  },
  session: { strategy: "jwt" },
};

export async function getSession() {
  return getServerSession(authOptions);
}
