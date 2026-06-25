import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const SITE = "https://mecchachameleonhub.com";
const COOKIE_NAME = "__Secure-next-auth.session-token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

interface SteamPlayer {
  personaname: string;
  avatarfull: string;
}

export async function GET(req: NextRequest) {
  console.log("[steam/callback] ---- LOGIN ATTEMPT START ----");

  // ── Step 0: env var sanity check ─────────────────────────────────────────
  const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL    ?? "(missing)";
  const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY   ?? "(missing)";
  const anonKey       = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "(missing)";
  const steamApiKey   = process.env.STEAM_API_KEY               ?? "(missing)";
  const nextAuthSecret = process.env.NEXTAUTH_SECRET            ?? "(missing)";

  console.log("[steam/callback] STEP 0 env:");
  console.log("  NEXT_PUBLIC_SUPABASE_URL    :", supabaseUrl);
  console.log("  SUPABASE_SERVICE_ROLE_KEY   :", serviceKey   === "(missing)" ? "(missing)" : serviceKey.slice(0, 14) + "...");
  console.log("  NEXT_PUBLIC_SUPABASE_ANON_KEY:", anonKey     === "(missing)" ? "(missing)" : anonKey.slice(0, 14) + "...");
  console.log("  STEAM_API_KEY               :", steamApiKey  === "(missing)" ? "(missing)" : steamApiKey.slice(0, 8) + "...");
  console.log("  NEXTAUTH_SECRET set         :", nextAuthSecret !== "(missing)");

  const sp = req.nextUrl.searchParams;

  // ── Step 1: Steam OpenID validation ──────────────────────────────────────
  console.log("[steam/callback] STEP 1 - validating Steam OpenID assertion");
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
    console.log("[steam/callback] STEP 1 - Steam response:", verifyText.trim());
  } catch (err) {
    console.error("[steam/callback] STEP 1 FAIL - fetch threw:", err);
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  if (!verifyText.includes("is_valid:true")) {
    console.error("[steam/callback] STEP 1 FAIL - is_valid:true not found");
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }
  console.log("[steam/callback] STEP 1 OK");

  // ── Step 2: Extract SteamID64 ────────────────────────────────────────────
  const claimedId = sp.get("openid.claimed_id") ?? "";
  const steamId   = claimedId.split("/").pop() ?? "";
  console.log("[steam/callback] STEP 2 - claimed_id:", claimedId);
  console.log("[steam/callback] STEP 2 - steamId:", steamId);

  if (!/^\d{17}$/.test(steamId)) {
    console.error("[steam/callback] STEP 2 FAIL - not a 17-digit steamId");
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }
  console.log("[steam/callback] STEP 2 OK");

  // ── Step 2b: Supabase connection test ────────────────────────────────────
  // Fires immediately after Steam validation to confirm the DB client works
  // before we attempt any user insert.
  console.log("[steam/callback] STEP 2b - Supabase connection test");
  const supabase = createServerSupabaseClient();
  console.log("[steam/callback] STEP 2b - client created with URL:", supabaseUrl);
  console.log("[steam/callback] STEP 2b - using key type:", serviceKey.startsWith("sb_secret") ? "service_role (sb_secret_...)" : serviceKey.startsWith("eyJ") ? "service_role (JWT)" : "UNEXPECTED — likely anon key");

  const { count, error: connError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (connError) {
    console.error("[steam/callback] STEP 2b FAIL - connection test error:", JSON.stringify(connError));
    console.error("[steam/callback] STEP 2b - code:", connError.code, "message:", connError.message);
  } else {
    console.log("[steam/callback] STEP 2b OK - users table accessible, row count:", count);
  }

  // ── Step 3: Fetch Steam player info ──────────────────────────────────────
  console.log("[steam/callback] STEP 3 - fetching Steam player summary");
  let player: SteamPlayer = { personaname: `User_${steamId.slice(-6)}`, avatarfull: "" };
  try {
    const steamRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
    );
    const rawText = await steamRes.text();
    console.log("[steam/callback] STEP 3 - Steam API response (first 300 chars):", rawText.slice(0, 300));
    const steamJson = JSON.parse(rawText) as { response: { players: SteamPlayer[] } };
    const fetched = steamJson.response?.players?.[0];
    if (fetched) {
      player = fetched;
      console.log("[steam/callback] STEP 3 OK - personaname:", player.personaname);
    } else {
      console.warn("[steam/callback] STEP 3 WARN - no player returned, using fallback name");
    }
  } catch (err) {
    console.warn("[steam/callback] STEP 3 WARN - Steam API threw, using fallback name:", err);
  }

  // ── Step 4: Check for existing user ──────────────────────────────────────
  console.log("[steam/callback] STEP 4 - select user by steam_id:", steamId);
  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("id")
    .eq("steam_id", steamId)
    .maybeSingle();

  console.log("[steam/callback] STEP 4 result:", JSON.stringify({ existing, selectError }));

  if (selectError) {
    console.error("[steam/callback] STEP 4 FAIL:", selectError.code, selectError.message);
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  let userId: string;

  if (existing) {
    userId = existing.id as string;
    console.log("[steam/callback] STEP 4 - existing user, userId:", userId);

    const { error: updateError } = await supabase
      .from("users")
      .update({ username: player.personaname, avatar_url: player.avatarfull })
      .eq("steam_id", steamId);

    if (updateError) {
      console.error("[steam/callback] STEP 4 update error (non-fatal):", JSON.stringify(updateError));
    } else {
      console.log("[steam/callback] STEP 4 OK - profile updated");
    }
  } else {
    // ── Step 5: Insert new user ───────────────────────────────────────────
    const payload = {
      steam_id:          steamId,
      username:          player.personaname,
      avatar_url:        player.avatarfull,
      steam_profile_url: `https://steamcommunity.com/profiles/${steamId}`,
      reputation:        0,
    };
    console.log("[steam/callback] STEP 5 - inserting new user:", JSON.stringify(payload));

    const { data: created, error: insertError } = await supabase
      .from("users")
      .insert(payload)
      .select("id")
      .maybeSingle();

    console.log("[steam/callback] STEP 5 result:", JSON.stringify({ created, insertError }));

    if (insertError) {
      console.error("[steam/callback] STEP 5 FAIL");
      console.error("  code   :", insertError.code);
      console.error("  message:", insertError.message);
      console.error("  details:", insertError.details);
      console.error("  hint   :", insertError.hint);
      return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
    }

    userId = (created?.id as string) ?? "";
    console.log("[steam/callback] STEP 5 OK - new user created, userId:", userId);
  }

  if (!userId) {
    console.error("[steam/callback] FATAL - userId empty after upsert, steamId:", steamId);
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  // ── Step 6: Encode JWT + set session cookie ───────────────────────────────
  console.log("[steam/callback] STEP 6 - encoding JWT, userId:", userId);
  const jwt = await encode({
    token: {
      name:    player.personaname,
      email:   `${steamId}@steamcommunity.com`,
      picture: player.avatarfull,
      sub:     steamId,
      steamId,
      userId,
    },
    secret:  process.env.NEXTAUTH_SECRET!,
    salt:    COOKIE_NAME,
    maxAge:  MAX_AGE,
  });

  const callbackUrl = req.cookies.get("steam-callback-url")?.value ?? "/";
  const safePath    = callbackUrl.startsWith("/") ? callbackUrl : "/";

  console.log("[steam/callback] STEP 6 OK - redirecting to:", safePath);
  console.log("[steam/callback] ---- LOGIN COMPLETE ----");

  const response = NextResponse.redirect(`${SITE}${safePath}`);
  response.cookies.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure:   true,
    sameSite: "lax",
    path:     "/",
    maxAge:   MAX_AGE,
  });
  response.cookies.delete("steam-callback-url");

  return response;
}
