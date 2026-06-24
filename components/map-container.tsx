"use client";

import { MapFilters, MediaLocation } from "@/lib/airtable/types";
import { ENABLE_REGION_FILTER } from "@/lib/feature-flags";
import { cn, computeMapBounds } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Map } from "@/components/map";
import { STYLES, MapStyle, takeScreenshot } from "@/lib/map-utils";
import { MapDrawer } from "./map-drawer";
import { MapToolbar } from "./map-toolbar";
import { BasemapToggle } from "./basemap-toggle";
import { useIsTablet } from "./hooks/use-tablet";
import { TooltipProvider } from "./ui/tooltip";

interface MapContainerProps {
  mediaPoints: MediaLocation[];
}

const MIN_DRAWER_WIDTH_PX = 280;

function defaultDrawerWidthForViewport(): number {
  if (typeof window === "undefined") return 0;
  return Math.floor(window.innerWidth * 0.4);
}

function maxDrawerWidthPx(): number {
  if (typeof window === "undefined") return 800;
  return Math.floor(window.innerWidth * 0.5);
}

function clampDrawerWidthPx(w: number): number {
  const max = maxDrawerWidthPx();
  return Math.min(max, Math.max(MIN_DRAWER_WIDTH_PX, Math.round(w)));
}

export default function MapContainer({ mediaPoints }: MapContainerProps) {
  const searchParams = useSearchParams();
  const mediaPointId = searchParams.get("mediaPointId");
  const [prevMediaPointId, setPrevMediaPointId] = useState(mediaPointId);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>("standard");
  const [searchValue, setSearchValue] = useState("");
  const [drawerWidthPx, setDrawerWidthPx] = useState(0);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const isTablet = useIsTablet();

  useLayoutEffect(() => {
    setDrawerWidthPx(clampDrawerWidthPx(defaultDrawerWidthForViewport()));
  }, []);

  useEffect(() => {
    if (isTablet) return;
    if (!mapInstanceRef.current) return;

    const id1 = window.requestAnimationFrame(() => {
      const id2 = window.requestAnimationFrame(() => {
        mapInstanceRef.current?.resize();
      });
      return () => window.cancelAnimationFrame(id2);
    });
    return () => window.cancelAnimationFrame(id1);
  }, [drawerWidthPx, drawerOpen, isTablet]);

  useEffect(() => {
    function onResize() {
      setDrawerWidthPx((w) => clampDrawerWidthPx(w || defaultDrawerWidthForViewport()));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleDrawerWidthChange = useCallback((w: number) => {
    setDrawerWidthPx(clampDrawerWidthPx(w));
  }, []);

  const handleDrawerWidthCommit = useCallback((w: number) => {
    setDrawerWidthPx(clampDrawerWidthPx(w));
  }, []);

  const handleMapReady = useCallback((mapInstance: mapboxgl.Map) => {
    mapInstanceRef.current = mapInstance;
  }, []);

  const handleScreenshot = useCallback(() => {
    if (mapInstanceRef.current) takeScreenshot(mapInstanceRef.current);
  }, []);

  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const handleBasemapToggle = useCallback(() => {
    setMapStyle((prev) => (prev === "standard" ? "satellite" : "standard"));
  }, []);

  if (mediaPointId !== prevMediaPointId) {
    setPrevMediaPointId(mediaPointId);
    if (mediaPointId) {
      setDrawerOpen(true);
    }
  }

  const filters: MapFilters = useMemo(
    () => ({
      countries: searchParams.get("country")?.split(",").filter(Boolean) || [],
      regions: ENABLE_REGION_FILTER
        ? searchParams.get("region")?.split(",").filter(Boolean) || []
        : [],
      bodiesOfWater:
        searchParams.get("body_of_water")?.split(",").filter(Boolean) || [],
    }),
    [searchParams]
  );

  const filteredMediaPoints = useMemo(() => {
    return mediaPoints.filter((media) => {
      if (
        filters.countries.length > 0 &&
        !filters.countries.includes(media?.country?.toLowerCase() || "")
      )
        return false;
      if (
        ENABLE_REGION_FILTER &&
        filters.regions.length > 0 &&
        !filters.regions.includes(media?.region?.toLowerCase() || "")
      )
        return false;
      if (
        filters.bodiesOfWater.length > 0 &&
        !filters.bodiesOfWater.includes(
          media.media?.affiliated_fellow?.toLowerCase() || ""        )
      )
        return false;
      return true;
    });
  }, [filters, mediaPoints]);

  const searchedMediaPoints = useMemo(() => {
    return filteredMediaPoints.filter((media) =>
      matchesSearch(media, searchValue)
    );
  }, [searchValue, filteredMediaPoints]);

  const mapBounds = useMemo(
    () => computeMapBounds(filteredMediaPoints),
    [filteredMediaPoints]
  );

  const drawerProps = {
    searchedMediaPoints,
    allMediaPoints: mediaPoints,
    searchValue,
    onSearchChange: setSearchValue,
    isOpen: drawerOpen,
    onToggle: handleDrawerToggle,
    drawerWidthPx,
    onDrawerWidthChange: handleDrawerWidthChange,
    onDrawerWidthCommit: handleDrawerWidthCommit,
  };

  return (
    <div className="w-full relative h-[calc(100vh-4rem)]">
      {isTablet ? (
        <div className="relative w-full h-full overflow-hidden">
          <Map
            data={searchedMediaPoints}
            bounds={mapBounds}
            filters={filters}
            styleUrl={STYLES[mapStyle]}
            onMapReady={handleMapReady}
          />
          <MapDrawer {...drawerProps} />
          <TooltipProvider>
            <div className="absolute top-3 z-20 max-sm:left-3 sm:left-1/2 sm:-translate-x-1/2">
              <MapToolbar
                filters={filters}
                mediaPoints={mediaPoints}
                onScreenshot={handleScreenshot}
              />
            </div>
            <BasemapToggle mapStyle={mapStyle} onToggle={handleBasemapToggle} />
          </TooltipProvider>
        </div>
      ) : (
        <div className="w-full h-full overflow-hidden flex">
          {drawerOpen ? <MapDrawer {...drawerProps} /> : null}
          <div className="relative flex-1 min-w-0">
            <Map
              data={searchedMediaPoints}
              bounds={mapBounds}
              filters={filters}
              styleUrl={STYLES[mapStyle]}
              onMapReady={handleMapReady}
            />
            <TooltipProvider>
              <div className="absolute top-3 z-20 left-1/2 -translate-x-1/2">
                <MapToolbar
                  filters={filters}
                  mediaPoints={mediaPoints}
                  onScreenshot={handleScreenshot}
                />
              </div>
              <BasemapToggle mapStyle={mapStyle} onToggle={handleBasemapToggle} />
            </TooltipProvider>
            {!drawerOpen ? <MapDrawer {...drawerProps} /> : null}
          </div>
        </div>
      )}
    </div>
  );
}
