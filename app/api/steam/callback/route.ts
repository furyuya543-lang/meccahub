import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const SITE = "https://mecchachameleonhub.com";
// NextAuth v4.22+ uses the cookie name as the JWT salt.
// Must match exactly so getServerSession can decode our token.
const COOKIE_NAME = "__Secure-next-auth.session-token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

interface SteamPlayer {
  personaname: string;
  avatarfull: string;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // Re-post to Steam for check_authentication validation
  const verifyParams = new URLSearchParams();
  for (const [k, v] of sp.entries()) {
    verifyParams.set(k, k === "openid.mode" ? "check_authentication" : v);
  }

  const verifyRes = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });

  const verifyText = await verifyRes.text();
  if (!verifyText.includes("is_valid:true")) {
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  // Extract SteamID64 from openid.claimed_id
  const claimedId = sp.get("openid.claimed_id") ?? "";
  const steamId = claimedId.split("/").pop() ?? "";
  if (!/^\d{17}$/.test(steamId)) {
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  // Fetch Steam player info
  const steamRes = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
  );
  const steamJson = (await steamRes.json()) as {
    response: { players: SteamPlayer[] };
  };
  const player = steamJson.response?.players?.[0];
  if (!player) {
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  // Upsert user in Supabase
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("steam_id", steamId)
    .maybeSingle();

  let userId: string;

  if (existing) {
    userId = existing.id as string;
    await supabase
      .from("users")
      .update({ username: player.personaname, avatar_url: player.avatarfull })
      .eq("steam_id", steamId);
  } else {
    const { data: created } = await supabase
      .from("users")
      .insert({
        steam_id: steamId,
        username: player.personaname,
        avatar_url: player.avatarfull,
        steam_profile_url: `https://steamcommunity.com/profiles/${steamId}`,
        reputation: 0,
      })
      .select("id")
      .maybeSingle();
    userId = (created?.id as string) ?? "";
  }

  if (!userId) {
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  // Encode a NextAuth-compatible JWT.
  // salt must equal the cookie name — NextAuth v4.22+ verifies this on decode.
  const jwt = await encode({
    token: {
      name: player.personaname,
      email: `${steamId}@steamcommunity.com`,
      picture: player.avatarfull,
      sub: steamId,
      steamId,
      userId,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: COOKIE_NAME,
    maxAge: MAX_AGE,
  });

  const callbackUrl = req.cookies.get("steam-callback-url")?.value ?? "/";
  const safePath = callbackUrl.startsWith("/") ? callbackUrl : "/";

  const response = NextResponse.redirect(`${SITE}${safePath}`);

  response.cookies.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  response.cookies.delete("steam-callback-url");

  return response;
}
