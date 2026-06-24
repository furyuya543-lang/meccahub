import type { OAuthConfig } from "next-auth/providers";

export interface SteamProfile extends Record<string, unknown> {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
}

export default function SteamProvider(): OAuthConfig<SteamProfile> {
  return {
    id: "steam",
    name: "Steam",
    type: "oauth",
    // NextAuth's OAuth flow requires clientId/clientSecret even though Steam
    // OpenID 2.0 does not use them. Steam ignores these extra OAuth params.
    clientId: "steam",
    clientSecret: "steam_secret",
    checks: [],
    authorization: {
      url: "https://steamcommunity.com/openid/login",
      params: {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": `${process.env.NEXTAUTH_URL}/api/auth/callback/steam`,
        "openid.realm": process.env.NEXTAUTH_URL ?? "",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
      },
    },
    token: {
      url: "https://steamcommunity.com/openid/login",
      async request(ctx) {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(ctx.params)) {
          if (k !== "openid.mode") params.set(k, String(v ?? ""));
        }
        params.set("openid.mode", "check_authentication");

        const res = await fetch("https://steamcommunity.com/openid/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        });

        const text = await res.text();
        if (!text.includes("is_valid:true")) {
          throw new Error("Steam OpenID assertion invalid");
        }

        const claimedId = ctx.params["openid.claimed_id"] as string | undefined;
        const steamId = claimedId?.split("/").pop();
        if (!steamId) throw new Error("Could not extract SteamID64");

        return { tokens: { access_token: steamId } };
      },
    },
    userinfo: {
      url: "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
      async request({ tokens }) {
        const res = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${tokens.access_token}`
        );
        const json = (await res.json()) as {
          response: { players: SteamProfile[] };
        };
        return json.response.players[0] ?? {};
      },
    },
    profile(profile) {
      return {
        id: profile.steamid,
        name: profile.personaname,
        email: `${profile.steamid}@steamcommunity.com`,
        image: profile.avatarfull,
      };
    },
  };
}
