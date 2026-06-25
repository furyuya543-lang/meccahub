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
  Array.from(sp.entries()).forEach(([k, v]) => {
    verifyParams.set(k, k === "openid.mode" ? "check_authentication" : v);
  });

  let verifyText = "";
  try {
    const verifyRes = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyParams.toString(),
    });
    verifyText = await verifyRes.text();
  } catch (err) {
    console.error("[steam/callback] Steam validation fetch failed:", err);
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  if (!verifyText.includes("is_valid:true")) {
    console.error("[steam/callback] Steam validation failed. Response:", verifyText);
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  // Extract SteamID64 from openid.claimed_id
  const claimedId = sp.get("openid.claimed_id") ?? "";
  const steamId = claimedId.split("/").pop() ?? "";
  if (!/^\d{17}$/.test(steamId)) {
    console.error("[steam/callback] Invalid steamId extracted:", steamId);
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  // Fetch Steam player info (fallback to steamId as username if API key missing)
  let player: SteamPlayer = { personaname: `User_${steamId.slice(-6)}`, avatarfull: "" };
  try {
    const steamRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
    );
    const steamJson = (await steamRes.json()) as {
      response: { players: SteamPlayer[] };
    };
    const fetched = steamJson.response?.players?.[0];
    if (fetched) player = fetched;
    else console.warn("[steam/callback] No player found in Steam API response for steamId:", steamId);
  } catch (err) {
    console.warn("[steam/callback] Steam API fetch failed, using fallback username:", err);
  }

  // Upsert user in Supabase
  const supabase = createServerSupabaseClient();

  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("steam_id", steamId)
    .maybeSingle();

  if (selectError) {
    console.error("[steam/callback] Supabase select error:", selectError);
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  let userId: string;

  if (existing) {
    userId = existing.id as string;
    const { error: updateError } = await supabase
      .from("users")
      .update({ username: player.personaname, avatar_url: player.avatarfull })
      .eq("steam_id", steamId);
    if (updateError) {
      console.error("[steam/callback] Supabase update error:", updateError);
    }
  } else {
    const { data: created, error: insertError } = await supabase
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

    if (insertError) {
      console.error("[steam/callback] Supabase insert error:", insertError);
      return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
    }

    userId = (created?.id as string) ?? "";
  }

  if (!userId) {
    console.error("[steam/callback] userId is empty after upsert for steamId:", steamId);
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
