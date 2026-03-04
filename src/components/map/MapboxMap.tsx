"use client";

import { useCallback, useMemo, useState } from "react";
import Map, { Layer, Source, type MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppStore } from "@/store/useAppStore";
import { MapTooltip } from "./MapTooltip";
import type { CountryScore } from "@/types/data";

const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

const SCORE_COLORS: [number, string][] = [
  [0, "#1A1432"],
  [20, "#2D1B69"],
  [40, "#3B2667"],
  [60, "#7B2FBE"],
  [80, "#E91E8C"],
  [100, "#FF6AC1"],
];

interface HoverInfo {
  x: number;
  y: number;
  country: CountryScore;
}

export default function MapboxMap({ token }: { token: string }) {
  const { filteredCountries, setSelectedCountry, selectedCountry } =
    useAppStore();
  const countries = filteredCountries();
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const geojsonData = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: countries.map((c) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
      properties: { code: c.code, name: c.name, nameKo: c.nameKo, score: c.score, change: c.change },
    })),
  }), [countries]);

  const onHover = useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (feature) {
      const country = countries.find((c) => c.code === feature.properties?.code);
      if (country) { setHoverInfo({ x: event.point.x, y: event.point.y, country }); return; }
    }
    setHoverInfo(null);
  }, [countries]);

  const onClick = useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (feature) {
      const country = countries.find((c) => c.code === feature.properties?.code);
      if (country) { setSelectedCountry(selectedCountry?.code === country.code ? null : country); return; }
    }
    setSelectedCountry(null);
  }, [countries, selectedCountry, setSelectedCountry]);

  return (
    <div className="flex-1 relative">
      <Map
        initialViewState={{ longitude: 20, latitude: 20, zoom: 1.8 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={token}
        interactiveLayerIds={["kpop-bubbles", "kpop-pulse"]}
        onMouseMove={onHover}
        onMouseLeave={() => setHoverInfo(null)}
        onClick={onClick}
        cursor={hoverInfo ? "pointer" : "grab"}
        attributionControl={false}
      >
        <Source id="kpop-data" type="geojson" data={geojsonData}>
          <Layer id="kpop-pulse" type="circle" paint={{
            "circle-radius": ["interpolate", ["linear"], ["get", "score"], 0, 8, 50, 20, 100, 40],
            "circle-color": ["interpolate", ["linear"], ["get", "score"], ...SCORE_COLORS.flatMap(([s, c]) => [s, c])],
            "circle-opacity": 0.15, "circle-blur": 0.8,
          }} />
          <Layer id="kpop-bubbles" type="circle" paint={{
            "circle-radius": ["interpolate", ["linear"], ["get", "score"], 0, 4, 50, 12, 100, 24],
            "circle-color": ["interpolate", ["linear"], ["get", "score"], ...SCORE_COLORS.flatMap(([s, c]) => [s, c])],
            "circle-opacity": 0.85, "circle-stroke-width": 2, "circle-stroke-color": "#FF6AC1",
            "circle-stroke-opacity": ["case", [">=", ["get", "change"], 5], 0.8, 0.2],
          }} />
          <Layer id="kpop-labels" type="symbol" layout={{
            "text-field": ["get", "score"], "text-allow-overlap": false, "text-ignore-placement": false,
            "text-size": ["interpolate", ["linear"], ["get", "score"], 0, 9, 50, 11, 100, 14],
          }} paint={{ "text-color": "#FFFFFF", "text-halo-color": "#0F0B1A", "text-halo-width": 1.5 }} />
        </Source>
      </Map>
      {hoverInfo && <MapTooltip info={hoverInfo} />}
    </div>
  );
}
