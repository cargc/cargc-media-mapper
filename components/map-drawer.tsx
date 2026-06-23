"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { MediaLocation } from "@/lib/airtable/types";
import { filterSearchParamKeys, removeQueryParameter } from "@/lib/utils";
import { Button } from "./ui/button";
import Search from "./search";
import { ResultCard } from "./result-card";
import { LocationDetails } from "./location-details";
import { useIsTablet } from "./hooks/use-tablet";

interface MapDrawerProps {
  searchedMediaPoints: MediaLocation[];
  allMediaPoints: MediaLocation[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  drawerWidthPx: number;
  onDrawerWidthChange: (width: number) => void;
  onDrawerWidthCommit: (width: number) => void;
}
export function MapDrawer({
  searchedMediaPoints,
  allMediaPoints,
  searchValue,
  onSearchChange,
  isOpen,
  onToggle,
  drawerWidthPx,
  onDrawerWidthChange,
  onDrawerWidthCommit,
}: MapDrawerProps) {
  const searchParams = useSearchParams();
  const mediaPointId = searchParams.get("mediaPointId");
  const isMobile = useIsTablet();
  const drawerRef = useRef<HTMLDivElement>(null);

    const startResize = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startW = drawerWidthPx;
      function onMove(moveEvent: MouseEvent) {
        const delta = moveEvent.clientX - startX;
        onDrawerWidthChange(startW + delta);
      }
      function onUp(moveEvent: MouseEvent) {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        const delta = moveEvent.clientX - startX;
        onDrawerWidthCommit(startW + delta);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [drawerWidthPx, onDrawerWidthChange, onDrawerWidthCommit]
  );

  const filterKeys = filterSearchParamKeys();
  const hasActiveFilters = filterKeys.some((p) => searchParams.has(p));

  function handleClearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    filterKeys.forEach((p) => params.delete(p));
    const qs = params.toString();
    window.history.pushState({}, "", qs ? `?${qs}` : "/");
  }

  const selectedMediaPoint = mediaPointId
    ? allMediaPoints.find((point) => point.id === mediaPointId)
    : null;

  function handleBack() {
    window.history.pushState({}, "", removeQueryParameter("mediaPointId"));
  }

  // Keyboard support: Escape key closes detail view or drawer
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selectedMediaPoint) {
          handleBack();
        } else {
          onToggle();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedMediaPoint, onToggle]);

  // Focus drawer when it opens
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen, selectedMediaPoint]);

  // Closed state: show toggle button
  if (!isOpen) {
    if (isMobile) {
      return (
        <Button
          variant="outline"
          size="lg"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 rounded-full px-6 shadow-md bg-background text-base"
          onClick={onToggle}
          aria-label="Open results panel"
        >
          <ChevronUp className="h-5 w-5" />
          Results
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        size="icon"
        className="absolute top-2 left-2 z-10 bg-background shadow-lg"
        onClick={onToggle}
        aria-label="Open results panel"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </Button>
    );
  }

  // Drawer content (shared between mobile and desktop)
  const drawerContent = selectedMediaPoint ? (
    /* Detail view */
    <div className="flex flex-col overflow-hidden flex-1">
      <div className="flex items-center justify-between px-3 pt-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-1 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label="Close panel"
          className="h-8 w-8"
        >
          {isMobile ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="overflow-y-auto flex-1 styled-scrollbar">
        <LocationDetails
          selectedMediaPoint={selectedMediaPoint}
          mediaPoints={allMediaPoints}
        />
      </div>
    </div>
  ) : (
    /* Search + Results list */
    <div className="flex flex-col overflow-hidden flex-1">
      <div className="flex items-center gap-2 p-3 shrink-0">
        <div className="flex-1">
          <Search value={searchValue} onValueChange={onSearchChange} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label="Close panel"
          className="h-8 w-8 shrink-0"
        >
          {isMobile ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          {searchedMediaPoints.length} result
          {searchedMediaPoints.length !== 1 ? "s" : ""}
        </span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            Clear filters
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="overflow-y-auto flex-1 styled-scrollbar">
        {searchedMediaPoints.map((media) => (
          <ResultCard
            key={media.id}
            media={media}
            isSelected={media.id === mediaPointId}
          />
        ))}
        {searchedMediaPoints.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No results found.
          </div>
        )}
      </div>
    </div>
  );

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <div
        ref={drawerRef}
        tabIndex={-1}
        role="region"
        aria-label={selectedMediaPoint ? "Location details" : "Search results"}
        className="absolute bottom-0 left-0 right-0 z-10 h-[60%] bg-background flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] rounded-t-2xl focus:outline-none"
      >
        {drawerContent}
      </div>
    );
  }

  // Desktop: left panel
  return (
    <div
      ref={drawerRef}
      tabIndex={-1}
      role="region"
      aria-label={selectedMediaPoint ? "Location details" : "Search results"}
      className="relative h-full z-10 bg-background flex flex-col shadow-lg focus:outline-none min-w-0 overflow-hidden"
      style={{ width: drawerWidthPx > 0 ? drawerWidthPx : "40vw" }}
    >
      {drawerContent}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize side panel"
        className="absolute top-0 right-0 bottom-0 w-3 -mr-1.5 cursor-ew-resize z-20 flex shrink-0 justify-center touch-none select-none"
        onMouseDown={startResize}
      >
        <span className="w-px h-full bg-border hover:bg-primary/50 active:bg-primary transition-colors" />
      </div>
    </div>
  );
}
