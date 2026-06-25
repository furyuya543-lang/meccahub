import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createSteamBridgeToken } from "@/lib/auth";

const SITE = "https://mecchachameleonhub.com";

interface SteamPlayer {
  personaname: string;
  avatarfull: string;
}

export async function GET(req: NextRequest) {
  console.log("[steam/callback] ---- LOGIN ATTEMPT START ----");

  // ── Step 0: env check ────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL    ?? "(missing)";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY   ?? "(missing)";
  const steamKey    = process.env.STEAM_API_KEY               ?? "(missing)";
  const authSecret  = process.env.NEXTAUTH_SECRET             ?? "(missing)";

  console.log("[steam/callback] STEP 0 env:");
  console.log("  NEXT_PUBLIC_SUPABASE_URL    :", supabaseUrl);
  console.log("  SUPABASE_SERVICE_ROLE_KEY   :", serviceKey  !== "(missing)" ? serviceKey.slice(0, 14)  + "..." : "(missing)");
  console.log("  STEAM_API_KEY               :", steamKey    !== "(missing)" ? steamKey.slice(0, 8)     + "..." : "(missing)");
  console.log("  NEXTAUTH_SECRET set         :", authSecret  !== "(missing)");

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
  console.log("[steam/callback] STEP 2 - steamId:", steamId);

  if (!/^\d{17}$/.test(steamId)) {
    console.error("[steam/callback] STEP 2 FAIL - not a 17-digit steamId");
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }
  console.log("[steam/callback] STEP 2 OK");

  // ── Step 2b: Supabase connection test ────────────────────────────────────
  console.log("[steam/callback] STEP 2b - Supabase connection test");
  const supabase = createServerSupabaseClient();
  console.log("[steam/callback] STEP 2b - key type:", serviceKey.startsWith("sb_secret") ? "service_role (sb_secret)" : serviceKey.startsWith("eyJ") ? "service_role (JWT)" : "UNEXPECTED");

  const { count, error: connError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (connError) {
    console.error("[steam/callback] STEP 2b FAIL:", connError.code, connError.message);
  } else {
    console.log("[steam/callback] STEP 2b OK - users table row count:", count);
  }

  // ── Step 3: Fetch Steam player info ──────────────────────────────────────
  console.log("[steam/callback] STEP 3 - fetching Steam player summary");
  let player: SteamPlayer = { personaname: `User_${steamId.slice(-6)}`, avatarfull: "" };
  try {
    const steamRes  = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
    );
    const rawText   = await steamRes.text();
    console.log("[steam/callback] STEP 3 - Steam API response:", rawText.slice(0, 300));
    const steamJson = JSON.parse(rawText) as { response: { players: SteamPlayer[] } };
    const fetched   = steamJson.response?.players?.[0];
    if (fetched) {
      player = fetched;
      console.log("[steam/callback] STEP 3 OK - personaname:", player.personaname);
    } else {
      console.warn("[steam/callback] STEP 3 WARN - no player, using fallback");
    }
  } catch (err) {
    console.warn("[steam/callback] STEP 3 WARN - Steam API error, using fallback:", err);
  }

  // ── Step 4: Upsert user in Supabase ──────────────────────────────────────
  console.log("[steam/callback] STEP 4 - checking for existing user");
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
      console.error("[steam/callback] update error (non-fatal):", updateError.message);
    }
  } else {
    // ── Step 5: Insert new user ─────────────────────────────────────────────
    const payload = {
      steam_id:          steamId,
      username:          player.personaname,
      avatar_url:        player.avatarfull,
      steam_profile_url: `https://steamcommunity.com/profiles/${steamId}`,
      reputation:        0,
    };
    console.log("[steam/callback] STEP 5 - inserting:", JSON.stringify(payload));

    const { data: created, error: insertError } = await supabase
      .from("users")
      .insert(payload)
      .select("id")
      .maybeSingle();

    console.log("[steam/callback] STEP 5 result:", JSON.stringify({ created, insertError }));

    if (insertError) {
      console.error("[steam/callback] STEP 5 FAIL - code:", insertError.code, "msg:", insertError.message, "hint:", insertError.hint);
      return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
    }

    userId = (created?.id as string) ?? "";
    console.log("[steam/callback] STEP 5 OK - new userId:", userId);
  }

  if (!userId) {
    console.error("[steam/callback] FATAL - empty userId after upsert");
    return NextResponse.redirect(`${SITE}/?error=OAuthSignin`);
  }

  // ── Step 6: Create bridge token and hand off to NextAuth ─────────────────
  // Instead of manually encoding a NextAuth JWT (which causes JWT_SESSION_ERROR
  // due to HKDF salt mismatches), we create a short-lived HMAC bridge token.
  // The client-side /steam-signin page exchanges it via signIn("steam", { token })
  // so NextAuth creates the session cookie itself — no format conflicts.
  console.log("[steam/callback] STEP 6 - creating bridge token");
  const bridgeToken = createSteamBridgeToken(steamId, userId);

  const callbackUrl = req.cookies.get("steam-callback-url")?.value ?? "/";
  const safePath    = callbackUrl.startsWith("/") ? callbackUrl : "/";

  const dest = `${SITE}/steam-signin?token=${encodeURIComponent(bridgeToken)}&callbackUrl=${encodeURIComponent(safePath)}`;
  console.log("[steam/callback] STEP 6 - redirecting to /steam-signin");
  console.log("[steam/callback] ---- CALLBACK COMPLETE ----");

  const response = NextResponse.redirect(dest);
  response.cookies.delete("steam-callback-url");
  return response;
}
