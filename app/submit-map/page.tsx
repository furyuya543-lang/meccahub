"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

type VerifyState = "idle" | "loading" | "success" | "error";

interface VerifiedMap {
  workshopId: string;
  mapName: string;
  description: string;
  previewImageUrl: string;
  creatorSteamId: string;
}

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

export default function SubmitMapPage() {
  const { data: session, status } = useSession();

  const [workshopUrl, setWorkshopUrl] = useState("");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyError, setVerifyError] = useState("");
  const [verified, setVerified] = useState<VerifiedMap | null>(null);

  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (status === "loading") return null;

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-white mb-3">Share a Map</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Sign in with Steam to share a Workshop map you&apos;ve found with the community.
        </p>
        <button
          onClick={() => { window.location.href = "/api/steam?callbackUrl=/submit-map"; }}
          className="bg-[#1b2838] hover:bg-[#213347] text-white px-6 py-3 rounded-lg text-sm font-medium border border-[#2a475e] transition-colors"
        >
          Sign in with Steam
        </button>
      </div>
    );
  }

  async function handleVerify() {
    const workshopId = extractWorkshopId(workshopUrl.trim());
    if (!workshopId) {
      setVerifyState("error");
      setVerifyError(
        "Paste a valid Steam Workshop URL — steamcommunity.com/sharedfiles/filedetails/?id=..."
      );
      return;
    }

    setVerifyState("loading");
    setVerifyError("");
    setVerified(null);

    try {
      const res = await fetch(
        `/api/verify-map?id=${encodeURIComponent(workshopUrl.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setVerifyState("error");
        setVerifyError(data.error ?? "Verification failed");
        return;
      }

      setVerified(data as VerifiedMap);
      setDescription((data as VerifiedMap).description ?? "");
      setVerifyState("success");
    } catch {
      setVerifyState("error");
      setVerifyError("Network error — please try again");
    }
  }

  async function handleSubmit() {
    if (!verified) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/map-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapName: verified.mapName,
          steamWorkshopUrl: workshopUrl.trim(),
          workshopId: verified.workshopId,
          description,
          previewImageUrl: verified.previewImageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Submission failed");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">Map Shared!</h1>
        <p className="text-gray-500 text-sm mb-6">
          This map is pending review and will appear on the Maps page once
          approved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/maps"
            className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            View Maps
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setVerified(null);
              setVerifyState("idle");
              setWorkshopUrl("");
              setDescription("");
            }}
            className="bg-[#131320] border border-gray-700 hover:border-gray-500 text-gray-300 px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            Share Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/maps"
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        Back to Maps
      </Link>

      <h1 className="text-3xl font-black text-white mb-1">Share a Map</h1>
      <p className="text-gray-500 text-sm mb-8">
        Found a great Meccha Chameleon map? Paste the Workshop URL to verify
        it, then share it with the community.
      </p>

      <div className="space-y-6">
        {/* Workshop URL input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Steam Workshop URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={workshopUrl}
              onChange={(e) => {
                setWorkshopUrl(e.target.value);
                if (verifyState !== "idle") {
                  setVerifyState("idle");
                  setVerified(null);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="https://steamcommunity.com/sharedfiles/filedetails/?id=..."
              className="flex-1 bg-[#131320] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 min-w-0"
            />
            <button
              onClick={handleVerify}
              disabled={!workshopUrl.trim() || verifyState === "loading"}
              className="flex items-center gap-2 bg-[#131320] border border-gray-700 hover:border-green-500/50 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              {verifyState === "loading" && (
                <Loader2 size={14} className="animate-spin" />
              )}
              Verify Map
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1.5">
            Browse maps on{" "}
            <a
              href="https://steamcommunity.com/workshop/browse/?appid=2440510"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500/70 hover:text-green-400 transition-colors"
            >
              the Meccha Chameleon Workshop
            </a>
          </p>
        </div>

        {/* Verify error */}
        {verifyState === "error" && (
          <div className="flex items-start gap-2.5 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3 text-sm text-red-400">
            <XCircle size={15} className="shrink-0 mt-0.5" />
            {verifyError}
          </div>
        )}

        {/* Verified preview */}
        {verifyState === "success" && verified && (
          <div className="bg-[#131320] border border-green-900/40 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800/60 bg-green-950/20">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium">
                Verified Meccha Chameleon map
              </span>
            </div>
            <div className="flex gap-4 p-4">
              {verified.previewImageUrl && (
                <div
                  className="relative rounded-lg overflow-hidden shrink-0 border border-gray-700"
                  style={{ width: 112, height: 72 }}
                >
                  <Image
                    src={verified.previewImageUrl}
                    alt={verified.mapName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">
                  {verified.mapName}
                </p>
                {verified.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                    {verified.description}
                  </p>
                )}
                <a
                  href={workshopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 mt-2 transition-colors"
                >
                  <ExternalLink size={11} />
                  View on Workshop
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Description + submit (only after verified) */}
        {verifyState === "success" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description{" "}
                <span className="text-gray-600 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe the map for the community..."
                className="w-full bg-[#131320] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 resize-none"
              />
              <p className="text-xs text-gray-600 text-right mt-1">
                {description.length}/500
              </p>
            </div>

            {submitError && (
              <div className="flex items-start gap-2.5 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3 text-sm text-red-400">
                <XCircle size={15} className="shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-lg text-sm transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Share Map for Review
            </button>
          </>
        )}
      </div>
    </div>
  );
}
