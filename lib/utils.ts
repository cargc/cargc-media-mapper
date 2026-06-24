import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Row } from "@tanstack/react-table";
import { MapFilters, MediaLocation } from "@/lib/airtable/types";
import { ENABLE_REGION_FILTER } from "@/lib/feature-flags";
import { formatLocation } from "@/components/media-locations-table/columns";
import { LngLatBoundsLike } from "mapbox-gl";

const headers = [
  "Media Title",
  "Media Type",
  "Location",
  "Affiliated Fellow",
  "Tags",
  "Coordinates",
  "Description",
  "Original Title",
  "References",
  "Corresponding Publications",
];

export function exportToCSV(filteredRows: Row<MediaLocation>[]) {
  const csvData = filteredRows.map((row) => {
    const item = row.original;
    return [
      item.media?.name || "",
      item.media?.media_type || "",
      formatLocation(item),
      item.media?.affiliated_fellow || "",
      item.media?.subjects?.join("; ") || "",
      `${item.latitude}, ${item.longitude}`,
      item.media?.description || "",
      item.media?.original_title || "",
      item.media?.references || "",
      item.media?.rights || "",
    ];
  });

  const csvContent = [headers, ...csvData]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `media-locations-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function removeQueryParameter(param: string): string {
  const currentURL = new URL(window.location.href).search;
  const params = new URLSearchParams(currentURL);

  params.delete(param);

  return `?${params.toString()}`;
}

export function addQueryParameter(
  param: string,
  value: string | number
): string {
  const currentURL = new URL(window.location.href).search;
  const params = new URLSearchParams(currentURL);
  params.set(param, `${value}`);
  return `?${params.toString()}`;
}

/** URL query parameter keys used for map filters */
export const FILTER_PARAMS = [
  "country",
  "body_of_water",
] as const;

/** Keys cleared by “Clear filters” (includes `region` when the feature is on). */
export function filterSearchParamKeys(): string[] {
  return ENABLE_REGION_FILTER
    ? [...FILTER_PARAMS, "region"]
    : [...FILTER_PARAMS];
}

export function hasActiveFilters(filters: MapFilters): boolean {
  return (
    filters.countries.length > 0 ||
    (ENABLE_REGION_FILTER && filters.regions.length > 0) ||
    filters.bodiesOfWater.length > 0
  );
}

const SINGLE_POINT_BUFFER_DEGREES = 0.5;

export function computeMapBounds(
  points: MediaLocation[]
): LngLatBoundsLike | undefined {
  const valid = points.filter((p) => p.longitude != null && p.latitude != null);

  if (valid.length === 0) return undefined;

  let west = valid[0].longitude;
  let east = valid[0].longitude;
  let south = valid[0].latitude;
  let north = valid[0].latitude;

  for (const p of valid) {
    if (p.longitude < west) west = p.longitude;
    if (p.longitude > east) east = p.longitude;
    if (p.latitude < south) south = p.latitude;
    if (p.latitude > north) north = p.latitude;
  }

  if (west === east && south === north) {
    west -= SINGLE_POINT_BUFFER_DEGREES;
    east += SINGLE_POINT_BUFFER_DEGREES;
    south -= SINGLE_POINT_BUFFER_DEGREES;
    north += SINGLE_POINT_BUFFER_DEGREES;
  }

  return [west, south, east, north];
}
