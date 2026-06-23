"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import mapboxgl, { LngLatBoundsLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapFilters, MediaLocation } from "@/lib/airtable/types";
import { addQueryParameter, hasActiveFilters } from "@/lib/utils";
import {
  addDataLayer,
  setupKeyboardNav,
} from "@/lib/map-utils";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
/** Globe size on initial load. Higher = globe looks larger. */
const MAP_CATALOG_ZOOM = 2.5;

interface MapProps {
  data: MediaLocation[];
  bounds: LngLatBoundsLike | undefined;
  filters: MapFilters;
  styleUrl: string;
  onMapReady?: (mapInstance: mapboxgl.Map) => void;
}

export function Map({ data, bounds, filters, styleUrl, onMapReady }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const searchParams = useSearchParams();
  const mediaPointId = searchParams.get("mediaPointId");

  const selectedMediaPoint = mediaPointId
    ? data.find((point) => point.id === mediaPointId)
    : null;

  // Create the Mapbox instance once on mount
  // /Sets up zoom/nav controls,
  // keyboard accessibility, and notifies the parent when the map is ready.
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [0, 20],
      zoom: MAP_CATALOG_ZOOM,
      preserveDrawingBuffer: true,
    });
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setIsMapLoaded(true);
      if (map.current) onMapReady?.(map.current);
    });

    const container = mapContainer.current;
    const cleanupKeyboard = container
      ? setupKeyboardNav(container, map.current)
      : undefined;

    return () => {
      cleanupKeyboard?.();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the basemap style URL changes, swap the style and re-add the data
  // layer + selection styling once the new style finishes loading.
  const hasSetCatalogBoundsRef = useRef(false);
  const prevStyleRef = useRef(styleUrl);
  useEffect(() => {
    if (!map.current || !isMapLoaded || styleUrl === prevStyleRef.current)
      return;
    prevStyleRef.current = styleUrl;
    map.current.setStyle(styleUrl);
    map.current.once("style.load", () => {
      if (map.current) {
        addDataLayer(map.current, data, selectedMediaPoint);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl, isMapLoaded]);

    useEffect(() => {
    if (!map.current || !isMapLoaded || !bounds) return;

    if (!hasSetCatalogBoundsRef.current) {
      map.current.fitBounds(bounds, { duration: 0 });
      map.current.setZoom(MAP_CATALOG_ZOOM);
      hasSetCatalogBoundsRef.current = true;
    }
  }, [isMapLoaded, bounds]);


  // Sync the GeoJSON data layer with selection included in a single
  // setData() call to avoid intermediate frames with missing styling.
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    addDataLayer(map.current, data, selectedMediaPoint);

    if (selectedMediaPoint) {
      map.current.flyTo({
        center: [selectedMediaPoint.longitude, selectedMediaPoint.latitude],
      });
    }
  }, [isMapLoaded, data, selectedMediaPoint]);

  // Auto-select a random point on first load so the UI isn't empty.
  // Skipped if a point is already selected or filters are active.
  useEffect(() => {
    if (
      selectedMediaPoint ||
      !isMapLoaded ||
      data.length === 0 ||
      hasActiveFilters(filters)
    ) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * data.length);
    window.history.pushState(
      {},
      "",
      addQueryParameter("mediaPointId", data[randomIndex].id)
    );
    // Omitting selectedMediaPoint since it would retrigger a selection when the media panel is closed.
    // Omitting data since data changes anytime the url changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    />
  );
}
