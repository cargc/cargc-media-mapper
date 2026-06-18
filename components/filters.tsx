"use client";

import { useMemo, useState } from "react";
import { MapFilters, MediaLocation } from "@/lib/airtable/types";
import { ENABLE_REGION_FILTER } from "@/lib/feature-flags";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import MultiSelect from "./ui/multi-select";

interface FilterProps {
  filters: MapFilters;
  mediaPoints: MediaLocation[];
}

function filtersResetKey(f: MapFilters): string {
  return [
    [...f.countries].sort().join(","),
    [...f.regions].sort().join(","),
    [...f.bodiesOfWater].sort().join(","),
    f.startYear,
    f.endYear,
  ].join("|");
}

function FiltersForm({ filters, mediaPoints }: FilterProps) {
  const countryOptions = useMemo(
    () =>
      [...new Set(mediaPoints.map((m) => m.country))]
        .filter((c) => c !== undefined)
        .sort()
        .map((c) => ({ value: c?.toLowerCase(), label: c })),
    [mediaPoints]
  );
  const regionOptions = useMemo(
    () =>
      [...new Set(mediaPoints.map((m) => m.region))]
        .filter((r): r is string => typeof r === "string" && r.trim() !== "")
        .sort()
        .map((r) => ({ value: r.toLowerCase(), label: r })),
    [mediaPoints]
  );
  const bodiesOfWaterOptions = useMemo(
    () =>
      [...new Set(mediaPoints.map((m) => m.natural_feature_name))]
        .filter((b) => b !== undefined)
        .sort()
        .map((b) => ({ value: b?.toLowerCase(), label: b })),
    [mediaPoints]
  );
  const minYear = useMemo(
    () =>
      Math.min(
        ...mediaPoints
          .map((d) => d.media?.release_year)
          .filter((y) => y !== undefined)
      ),
    [mediaPoints]
  );
  const maxYear = useMemo(
    () =>
      Math.max(
        ...mediaPoints
          .map((d) => d.media?.release_year)
          .filter((y) => y !== undefined)
      ),
    [mediaPoints]
  );
  const [selectedCountry, setSelectedCountry] = useState<string[]>(
    filters.countries
  );
  const [selectedRegion, setSelectedRegion] = useState<string[]>(
    filters.regions
  );
  const [selectedWater, setSelectedWater] = useState<string[]>(
    filters.bodiesOfWater
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [startYear, setStartYear] = useState(filters.startYear || "");
  const [endYear, setEndYear] = useState(filters.endYear || "");

  const handleApplyFilters = () => {
    const newParams = new URLSearchParams();

    if (selectedWater.length) {
      newParams.append("body_of_water", selectedWater.join(","));
    }
    if (selectedCountry.length) {
      newParams.append("country", selectedCountry.join(","));
    }
    if (ENABLE_REGION_FILTER && selectedRegion.length) {
      newParams.append("region", selectedRegion.join(","));
    }
    if (startYear) {
      newParams.append("start_year", "" + startYear);
    }
    if (endYear) {
      newParams.append("end_year", "" + endYear);
    }

    setFiltersOpen(false);
    history.pushState({}, "", `/?${newParams.toString()}`);
  };

  return (
    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="lg"
          className="rounded-l-full px-6 text-base border-0 shadow-none"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-5 w-5" />
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Filter media points shown on the map. Click apply when you are done.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <MultiSelect
            values={countryOptions}
            label="Countries"
            onSelect={setSelectedCountry}
            selectedOptions={selectedCountry}
          />

          {ENABLE_REGION_FILTER && (
            <MultiSelect
              values={regionOptions}
              label="Region"
              onSelect={setSelectedRegion}
              selectedOptions={selectedRegion}
            />
          )}

          <MultiSelect
            values={bodiesOfWaterOptions}
            label="Affiliated Fellow"
            onSelect={setSelectedWater}
            selectedOptions={selectedWater}
          />

          <div className="flex flex-col gap-1">
            <Label>Date Range</Label>
            <div className="flex gap-1 items-center">
              <Input
                value={startYear}
                min={minYear}
                max={maxYear}
                onChange={(e) => setStartYear(e.target.value)}
                aria-label="From year"
                type="number"
                placeholder="Start Year"
                className="min-w-28 text-base"
              />
              -
              <Input
                value={endYear}
                min={minYear}
                max={maxYear}
                onChange={(e) => setEndYear(e.target.value)}
                type="number"
                aria-label="Filter by latest release year"
                placeholder="To year"
                className="min-w-28 text-base"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" aria-label="Cancel">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleApplyFilters} aria-label="Apply filters">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Wrapper that remounts FiltersForm whenever the applied filters change,
// resetting local form state to match the current URL parameters.
export function Filters(props: FilterProps) {
  return <FiltersForm key={filtersResetKey(props.filters)} {...props} />;
}
