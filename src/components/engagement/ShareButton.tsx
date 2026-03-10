"use client";

import { Share2, Check } from "lucide-react";
import { useState, useCallback } from "react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = "https://kpop-global-map.vercel.app";

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: 구형 브라우저
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <button
      onClick={handleShare}
      className="p-1.5 rounded-lg hover:bg-[#3B2667]/50 transition-colors relative"
      title="URL 복사"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Share2 className="w-4 h-4 text-[#9B8DB8]" />
      )}
    </button>
  );
}
