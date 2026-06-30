"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Upload, Link as LinkIcon, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { CATEGORIES } from "@/types";
import { MAPS } from "@/lib/utils";

export default function EditHidePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const hideId = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    map: "",
    category: "",
    video_url: "",
  });

  const [existingScreenshotUrl, setExistingScreenshotUrl] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }

    fetch(`/api/hides/${hideId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.hide) { setNotFound(true); return; }
        const h = data.hide;
        const currentUserId = session.user.supabaseUserId || session.user.id;
        if (h.user_id !== currentUserId) { setForbidden(true); return; }
        setForm({
          title: h.title ?? "",
          description: h.description ?? "",
          map: h.map ?? "",
          category: h.category ?? "",
          video_url: h.video_url ?? "",
        });
        setExistingScreenshotUrl(h.screenshot_url ?? "");
        setPageLoading(false);
      })
      .catch(() => setNotFound(true));
  }, [status, session, hideId, router]);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, WEBP, or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File must be under 10MB.");
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

    let screenshotUrl = existingScreenshotUrl;

    if (screenshot) {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", screenshot);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      setUploading(false);
      if (!uploadRes.ok) {
        setError(uploadData.error ?? "Upload failed.");
        return;
      }
      screenshotUrl = uploadData.url;
    }

    setSaving(true);
    const res = await fetch(`/api/hides/${hideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, screenshot_url: screenshotUrl }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Save failed.");
      return;
    }

    router.push(`/hide/${hideId}`);
  }

  if (status === "loading" || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-green-400" size={32} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">Hide not found.</p>
        <Link href="/browse" className="text-green-400 hover:underline text-sm mt-3 inline-block">
          Back to Browse
        </Link>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">You can only edit your own hides.</p>
        <Link href={`/hide/${hideId}`} className="text-green-400 hover:underline text-sm mt-3 inline-block">
          Back to Hide
        </Link>
      </div>
    );
  }

  const isLoading = uploading || saving;
  const currentScreenshot = screenshotPreview || existingScreenshotUrl;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href={`/hide/${hideId}`}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        Back to Hide
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Edit Hide</h1>
        <p className="text-gray-500 text-sm">Update your hide details.</p>
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
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-[#131320] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 resize-none"
          />
        </div>

        {/* Screenshot */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Screenshot
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {currentScreenshot ? (
            <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-900">
              <Image src={currentScreenshot} alt="Screenshot" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
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

        {/* Video URL */}
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
          {saving && <><Loader2 size={16} className="animate-spin" /> Saving...</>}
          {!isLoading && <><CheckCircle size={16} /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
