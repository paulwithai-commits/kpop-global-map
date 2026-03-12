"use client";

import { useEffect } from "react";
import { useJapanStore } from "@/store/useJapanStore";

export function useJapanData() {
  const { isLoading, error, setData, setLoading, setError, fetchContent } =
    useJapanStore();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/data/japan-latest.json");
        if (!res.ok) throw new Error("데이터를 불러올 수 없습니다");
        const data = await res.json();
        setData(data);
        // 첫 트렌딩 키워드 자동 로드 → 우측 콘텐츠 패널 디폴트 노출
        if (data.trendingKeywords?.length > 0) {
          const firstKw = data.trendingKeywords[0];
          fetchContent(firstKw, firstKw);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류 발생");
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoading, error };
}
