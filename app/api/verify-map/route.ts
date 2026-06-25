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

  let steamData: Record<string, unknown>;
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
    if (!res.ok) throw new Error("upstream");
    steamData = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Steam API unavailable — please try again" },
      { status: 502 }
    );
  }

  const details = steamData?.response as Record<string, unknown> | undefined;
  const items = details?.publishedfiledetails as Record<string, unknown>[] | undefined;
  const detail = items?.[0];

  if (!detail || detail.result !== 1) {
    return NextResponse.json({ error: "Workshop item not found" }, { status: 404 });
  }

  if (detail.consumer_appid !== MECCHA_APP_ID) {
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
