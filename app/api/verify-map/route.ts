import { NextRequest, NextResponse } from "next/server";

function extractWorkshopId(input: string): string | null {
  try {
    const url = new URL(input);
    if (
      url.hostname === "steamcommunity.com" &&
      url.pathname === "/sharedfiles/filedetails/"
    ) {
      const id = url.searchParams.get("id");
      if (id && /^\d+$/.test(id)) return id;
    }
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

  // Try to fetch title/preview from Steam to pre-fill the form, but never reject based on the result
  let mapName = "";
  let description = "";
  let previewImageUrl = "";
  let creatorSteamId = "";

  try {
    const body = new URLSearchParams({
      itemcount: "1",
      "publishedfileids[0]": workshopId,
    });
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
      const detail = items?.[0];
      if (detail && detail.result === 1) {
        mapName = (detail.title as string) ?? "";
        description = (detail.description as string) ?? "";
        previewImageUrl = (detail.preview_url as string) ?? "";
        creatorSteamId = (detail.creator as string) ?? "";
      }
    }
  } catch {
    // Steam API unreachable — still accept the URL
  }

  return NextResponse.json({ workshopId, mapName, description, previewImageUrl, creatorSteamId });
}
