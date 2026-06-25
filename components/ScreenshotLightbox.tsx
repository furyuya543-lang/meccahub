"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface Props {
  src: string;
  alt: string;
}

export default function ScreenshotLightbox({ src, alt }: Props) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden aspect-video bg-gray-900 mb-6 cursor-zoom-in group"
        onClick={() => setOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          priority
          sizes="(max-width: 896px) 100vw, 896px"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-full">
            Click to expand
          </span>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div
            className="relative w-full max-w-6xl"
            style={{ maxHeight: "90vh", aspectRatio: "16/9" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
