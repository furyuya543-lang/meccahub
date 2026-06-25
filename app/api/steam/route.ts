import { NextRequest, NextResponse } from "next/server";

const SITE = "https://mecchachameleonhub.com";

export async function GET(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") ?? "/";
  const safePath = callbackUrl.startsWith("/") ? callbackUrl : "/";

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${SITE}/api/steam/callback`,
    "openid.realm": SITE,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const response = NextResponse.redirect(
    `https://steamcommunity.com/openid/login?${params}`
  );

  response.cookies.set("steam-callback-url", safePath, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  return response;
}
