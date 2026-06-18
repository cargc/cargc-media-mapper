"use client";

import { MapFilters, MediaLocation } from "@/lib/airtable/types";
import { ENABLE_REGION_FILTER } from "@/lib/feature-flags";
import { cn, computeMapBounds } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
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

/*
Map Container component Reason:
Filtering is handled client-side to provide instant feedback to the user,
avoid unnecessary server requests and page redirects, and keep the map UI
responsive while users refine search and filter criteria.
*/

export default function MapContainer({ mediaPoints }: MapContainerProps) {
  const searchParams = useSearchParams();
  const mediaPointId = searchParams.get("mediaPointId");
  const [prevMediaPointId, setPrevMediaPointId] = useState(mediaPointId);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>("standard");
  const [searchValue, setSearchValue] = useState("");
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const isTablet = useIsTablet();

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

  // This block checks if the selected mediaPointId from the URL search parameters has changed.
  // If it detects a change, it updates the state storing the previous mediaPointId.
  // Additionally, if a new mediaPointId is present, it ensures the map drawer is open,
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
          media.natural_feature_name?.toLowerCase() || ""
        )
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

  // Bounds are computed from filter results only (not search),
  // so the map doesn't refit on every keystroke.
  const mapBounds = useMemo(
    () => computeMapBounds(filteredMediaPoints),
    [filteredMediaPoints]
  );

  return (
    <div className="w-full relative h-[calc(100vh-4rem)]">
      <div className="relative w-full h-full overflow-hidden">
        <Map
          data={searchedMediaPoints}
          bounds={mapBounds}
          filters={filters}
          styleUrl={STYLES[mapStyle]}
          onMapReady={handleMapReady}
        />
        <MapDrawer
          searchedMediaPoints={searchedMediaPoints}
          allMediaPoints={mediaPoints}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          isOpen={drawerOpen}
          onToggle={handleDrawerToggle}
        />
        <TooltipProvider>
          <div
            className={cn(
              "absolute top-3 z-20 max-sm:left-3 sm:left-1/2 sm:-translate-x-1/2",
              !isTablet && drawerOpen && "pl-96"
            )}
          >
            <MapToolbar
              filters={filters}
              mediaPoints={mediaPoints}
              onScreenshot={handleScreenshot}
            />
          </div>
          <BasemapToggle mapStyle={mapStyle} onToggle={handleBasemapToggle} />
        </TooltipProvider>
      </div>
    </div>
  );
}
