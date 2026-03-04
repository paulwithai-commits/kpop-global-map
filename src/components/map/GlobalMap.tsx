"use client";

import dynamic from "next/dynamic";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Leaflet은 SSR 미지원이라 dynamic import 필요
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });
const MapboxMap = dynamic(() => import("./MapboxMap"), { ssr: false });

export function GlobalMap() {
  if (MAPBOX_TOKEN) {
    return <MapboxMap token={MAPBOX_TOKEN} />;
  }
  return <LeafletMap />;
}
