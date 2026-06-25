"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Flag } from "lucide-react";

const REASONS = ["Inappropriate", "Fake hide", "Spam", "Wrong map", "Other"] as const;
type Reason = typeof REASONS[number];

export default function ReportButton({ hideId }: { hideId: string }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("Inappropriate");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!session) return null;

  async function submit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hideId, reason }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to submit report.");
      return;
    }
    setDone(true);
  }

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
        title="Report this hide"
      >
        <Flag size={12} />
        <span>Report</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#131320] border border-gray-700 rounded-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center py-4">
                <p className="text-green-400 font-semibold mb-1">Thanks for reporting!</p>
                <p className="text-gray-400 text-sm">We&apos;ll review this hide.</p>
                <button
                  onClick={() => { setOpen(false); setDone(false); }}
                  className="mt-4 text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-white font-semibold mb-4">Report Hide</h3>
                <label className="block text-sm text-gray-400 mb-2">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as Reason)}
                  className="w-full bg-[#0e0e1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:border-red-500/50"
                >
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {error && (
                  <p className="text-red-400 text-xs mb-3">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg py-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="flex-1 text-sm bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-lg py-2 font-medium transition-colors"
                  >
                    {loading ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
