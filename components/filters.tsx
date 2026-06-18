"use client";

import { useMemo, useState } from "react";
import { MapFilters, MediaLocation } from "@/lib/airtable/types";
import { ENABLE_REGION_FILTER } from "@/lib/feature-flags";
import { Button } from "./ui/button";
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
