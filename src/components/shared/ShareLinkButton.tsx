"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface ShareLinkButtonProps {
  /** URL penuh atau path relatif (otomatis diprefix origin saat di browser) */
  getUrl?: () => string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function ShareLinkButton({
  getUrl,
  label = "Bagikan Link",
  copiedLabel = "Link Tersalin!",
  className,
  disabled = false,
}: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (disabled || typeof window === "undefined") return;
    const raw = getUrl ? getUrl() : window.location.href;
    const fullUrl = raw.startsWith("http")
      ? raw
      : `${window.location.origin}${raw.startsWith("/") ? "" : "/"}${raw}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const input = document.createElement("input");
        input.value = fullUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback bila clipboard diblokir
      window.prompt("Salin link berikut:", fullUrl);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleCopy}
      className={cn(
        "font-display inline-flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-40",
        copied
          ? "border-[#4ADE80] bg-[#4ADE80]/15 text-[#4ADE80]"
          : "border-[#22D3EE]/40 bg-[#101830] text-[#22D3EE] hover:border-[#F5B83D] hover:text-[#F5B83D]",
        className,
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
