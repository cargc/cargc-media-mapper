import { MediaLocation } from "@/lib/airtable/types";

// Utility function used to fuzzy search across media and locationfields
export function matchesSearch(media: MediaLocation, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const searchable = [
    media.name,
    media.city,
    media.country,
    media.region,
    media.location_name,
    media.media?.affiliated_fellow,
    media.media?.name,
    media.media?.media_type,
    media.media?.subjects?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return searchable.includes(q);
}
