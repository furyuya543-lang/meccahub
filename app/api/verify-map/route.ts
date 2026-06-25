import { NextRequest, NextResponse } from "next/server";

const MECCHA_APP_ID = 2440510;

function extractWorkshopId(input: string): string | null {
  try {
    const url = new URL(input);
    const id = url.searchParams.get("id");
    if (id && /^\d+$/.test(id)) return id;
  } catch {
    // not a URL
  }
  if (/^\d+$/.test(input.trim())) return input.trim();
  return null;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("id") ?? "";
  const workshopId = extractWorkshopId(raw);

  if (!workshopId) {
    return NextResponse.json(
      { error: "Paste a valid Steam Workshop URL (steamcommunity.com/sharedfiles/filedetails/?id=...)" },
      { status: 400 }
    );
  }

  const body = new URLSearchParams({
    itemcount: "1",
    "publishedfileids[0]": workshopId,
  });

  let detail: Record<string, unknown> | null = null;
  try {
    const res = await fetch(
      "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        cache: "no-store",
      }
    );
    if (res.ok) {
      const json = await res.json();
      const items = json?.response?.publishedfiledetails as Record<string, unknown>[] | undefined;
      detail = items?.[0] ?? null;
    }
  } catch {
    // Steam API unreachable — fall through to URL-only validation below
  }

  // If Steam returned data, validate it
  if (detail !== null) {
    if (detail.result !== 1) {
      return NextResponse.json({ error: "Workshop item not found" }, { status: 404 });
    }

    // Coerce to number — the Steam API returns numeric JSON but TS types it as unknown
    const consumerAppId = Number(detail.consumer_appid);
    const creatorAppId = Number(detail.creator_appid);

    // Only hard-reject if the API returned real app IDs that definitively don't match
    const appIdKnown = consumerAppId > 0 || creatorAppId > 0;
    const matchesMeccha = consumerAppId === MECCHA_APP_ID || creatorAppId === MECCHA_APP_ID;

    if (appIdKnown && !matchesMeccha) {
      return NextResponse.json(
        { error: "This doesn't appear to be a valid Meccha Chameleon map" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      workshopId,
      mapName: (detail.title as string) ?? "",
      description: (detail.description as string) ?? "",
      previewImageUrl: (detail.preview_url as string) ?? "",
      creatorSteamId: (detail.creator as string) ?? "",
    });
  }

  // Steam API unavailable or returned no data — accept any valid workshop URL
  return NextResponse.json({
    workshopId,
    mapName: "",
    description: "",
    previewImageUrl: "",
    creatorSteamId: "",
  });
}
