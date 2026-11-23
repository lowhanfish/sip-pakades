"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface MapMarkerPoint {
  id: string;
  title: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
  kind?: "office" | "village" | "tourism";
}

interface DistrictMapProps {
  centerLat: number;
  centerLng: number;
  zoom?: number;
  markers: MapMarkerPoint[];
  heightClass?: string;
}

export default function DistrictMap({
  centerLat,
  centerLng,
  zoom = 12,
  markers,
  heightClass = "h-[380px]",
}: DistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let mapInstance: import("leaflet").Map | null = null;

    async function initMap() {
      if (!containerRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !containerRef.current) return;

      mapInstance = L.map(containerRef.current, {
        center: [centerLat, centerLng],
        zoom,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(mapInstance);

      for (const m of markers) {
        const color =
          m.kind === "office"
            ? "#0284c7"
            : m.kind === "tourism"
              ? "#eab308"
              : "#38bdf8";
        const radius = m.kind === "office" ? 10 : 7;

        const circle = L.circleMarker([m.latitude, m.longitude], {
          radius,
          color: "#ffffff",
          weight: 2,
          fillColor: color,
          fillOpacity: 0.92,
        }).addTo(mapInstance);

        circle.bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;"><strong>${m.title}</strong>${
            m.subtitle ? `<br/><span style="color:#475569">${m.subtitle}</span>` : ""
          }</div>`
        );
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [centerLat, centerLng, zoom, markers]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${heightClass} rounded-2xl overflow-hidden border border-sky-200/70 z-0`}
    />
  );
}
