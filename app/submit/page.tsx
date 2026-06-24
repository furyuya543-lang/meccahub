"use client";

import { useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Link as LinkIcon, Loader2, CheckCircle } from "lucide-react";
import { MAPS, CATEGORIES } from "@/types";

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    map: "",
    category: "",
    video_url: "",
  });

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-green-400" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">Sign In Required</h1>
        <p className="text-gray-400 mb-6 text-sm">
          You need to sign in with Steam to submit a hide.
        </p>
        <button
          onClick={() => signIn("steam")}
          className="bg-[#1b2838] hover:bg-[#213347] text-white px-6 py-3 rounded-lg font-medium border border-[#2a475e] transition-colors"
        >
          Sign in with Steam
        </button>
      </div>
    );
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setError("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title || !form.map || !form.category) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!screenshot) {
      setError("Please upload a screenshot.");
      return;
    }

    setUploading(true);

    // Upload screenshot
    const fd = new FormData();
    fd.append("file", screenshot);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      setError(uploadData.error ?? "Upload failed.");
      setUploading(false);
      return;
    }

    setUploading(false);
    setSubmitting(true);

    // Submit hide
    const res = await fetch("/api/hides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        screenshot_url: uploadData.url,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Submission failed.");
      return;
    }

    router.push(`/hide/${data.hide.id}`);
  }

  const isLoading = uploading || submitting;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Submit a Hide</h1>
        <p className="text-gray-500 text-sm">Share your best Meccha Chameleon spot with the community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Title <span className="text-green-400">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={80}
            placeholder="Give your hide a catchy name"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-[#131320] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {/* Map / Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Map <span className="text-green-400">*</span>
            </label>
            <select
              required
              value={form.map}
              onChange={(e) => setForm({ ...form, map: e.target.value })}
              className="w-full bg-[#131320] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50"
            >
              <option value="">Select map</option>
              {MAPS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Category <span className="text-green-400">*</span>
            </label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-[#131320] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="Describe your hide spot, any tips, or context..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-[#131320] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 resize-none"
          />
        </div>

        {/* Screenshot upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Screenshot <span className="text-green-400">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {screenshotPreview ? (
            <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-900">
              <Image src={screenshotPreview} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => { setScreenshot(null); setScreenshotPreview(""); }}
                className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded hover:bg-black transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 hover:border-green-500/50 rounded-xl p-10 text-center cursor-pointer transition-colors"
            >
              <Upload size={32} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">
                Drag & drop a screenshot or{" "}
                <span className="text-green-400 font-medium">browse files</span>
              </p>
              <p className="text-gray-600 text-xs mt-1">PNG, JPG up to 10MB</p>
            </div>
          )}
        </div>

        {/* Video URL (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <LinkIcon size={14} /> Video URL <span className="text-gray-500 font-normal">(optional)</span>
            </span>
          </label>
          <input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={form.video_url}
            onChange={(e) => setForm({ ...form, video_url: e.target.value })}
            className="w-full bg-[#131320] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/40 text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition-colors text-sm"
        >
          {uploading && <><Loader2 size={16} className="animate-spin" /> Uploading screenshot...</>}
          {submitting && <><Loader2 size={16} className="animate-spin" /> Submitting...</>}
          {!isLoading && <><CheckCircle size={16} /> Submit Hide</>}
        </button>
      </form>
    </div>
  );
}
