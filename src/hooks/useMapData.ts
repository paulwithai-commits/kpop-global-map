"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { GlobalData } from "@/types/data";

export function useMapData() {
  const { data, isLoading, error, setData, setError, setLoading } =
    useAppStore();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/data/latest.json");
        if (!res.ok) throw new Error("데이터를 불러올 수 없습니다");
        const json: GlobalData = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
        );
      }
    }

    fetchData();
  }, [setData, setError, setLoading]);

  return { data, isLoading, error };
}
