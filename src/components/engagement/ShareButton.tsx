"use client";

import { Share2, Check, Copy } from "lucide-react";
import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";

export function ShareButton() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data, selectedArtist } = useAppStore();

  const handleShare = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      // html2canvas 동적 import (코드 분할)
      const html2canvas = (await import("html2canvas")).default;

      // 지도 영역 캡처
      const mapEl = document.querySelector(".leaflet-container") as HTMLElement;
      if (!mapEl) {
        setIsCapturing(false);
        return;
      }

      const canvas = await html2canvas(mapEl, {
        backgroundColor: "#0F0B1A",
        scale: 2,
        useCORS: true,
        logging: false,
        width: mapEl.offsetWidth,
        height: mapEl.offsetHeight,
      });

      // 오버레이 추가 (아티스트명 + 날짜 + 브랜드)
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const w = canvas.width;
        const h = canvas.height;

        // 하단 그라데이션 바
        const grad = ctx.createLinearGradient(0, h - 120, 0, h);
        grad.addColorStop(0, "rgba(18,14,31,0)");
        grad.addColorStop(1, "rgba(18,14,31,0.95)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, h - 120, w, 120);

        // 브랜드명
        ctx.font = "bold 28px -apple-system, sans-serif";
        ctx.fillStyle = "#FF6AC1";
        ctx.fillText("K-pop World Pulse", 24, h - 50);

        // 날짜
        ctx.font = "14px -apple-system, sans-serif";
        ctx.fillStyle = "#9B8DB8";
        ctx.fillText(data?.date ?? "", 24, h - 24);

        // 선택된 아티스트
        if (selectedArtist && data) {
          const artist = data.topArtists.find((a) => a.id === selectedArtist);
          if (artist) {
            ctx.font = "bold 22px -apple-system, sans-serif";
            ctx.fillStyle = "#E8E0F0";
            ctx.textAlign = "right";
            ctx.fillText(artist.nameKo, w - 24, h - 50);
            ctx.textAlign = "left";
          }
        }
      }

      // Blob 변환
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );

      // Web Share API 시도
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "kpop-world-pulse.png", { type: "image/png" });
        const shareData = {
          title: "K-pop World Pulse",
          text: `K-pop World Pulse - ${data?.date ?? ""} 글로벌 인기 현황`,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setIsCapturing(false);
          return;
        }
      }

      // Fallback: 클립보드 복사
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, data, selectedArtist]);

  return (
    <button
      onClick={handleShare}
      disabled={isCapturing}
      className="p-1.5 rounded-lg hover:bg-[#3B2667]/50 transition-colors relative"
      title="공유하기"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : isCapturing ? (
        <div className="w-4 h-4 border-2 border-[#9B5DE5] border-t-transparent rounded-full animate-spin" />
      ) : (
        <Share2 className="w-4 h-4 text-[#9B8DB8]" />
      )}
    </button>
  );
}
