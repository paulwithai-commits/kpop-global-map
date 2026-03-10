"use client";

import { useEffect } from "react";
import { useJapanStore } from "@/store/useJapanStore";

export function useJapanData() {
  const { isLoading, error, setData, setLoading, setError } = useJapanStore();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/data/japan-latest.json");
        if (!res.ok) throw new Error("데이터를 불러올 수 없습니다");
        const data = await res.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류 발생");
      }
    }
    fetchData();
  }, [setData, setLoading, setError]);

  return { isLoading, error };
}
