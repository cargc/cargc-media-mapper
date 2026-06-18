"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { MediaLocation } from "@/lib/airtable/types";
import { Metric } from "@/components/metric";
import Link from "next/link";
import { Label } from "./ui/label";

interface LocationDetailsProps {
  selectedMediaPoint: MediaLocation;
  mediaPoints: MediaLocation[];
}

/**
 * Builds a formatted location string from city, region, and country components.
 */
function buildLocationString(
  city?: string,
  region?: string,
  country?: string
): string {
  const locationParts = [city, region, country].filter(
    (part) => part && part.trim() !== ""
  );
  return locationParts.join(", ");
}

export function LocationDetails({
  selectedMediaPoint,
  mediaPoints,
}: LocationDetailsProps) {
  const relatedMedia = mediaPoints.filter(
    (d) =>
      selectedMediaPoint?.media?.related_media_locations?.includes(d.id) &&
      d.id !== selectedMediaPoint.id
  );

  return (
    <Card className="border-0 shadow-none rounded-none">
      <div className="px-4 pb-4">
        <CardHeader className="p-0">
          <Badge className="capitalize" variant="secondary">
            {selectedMediaPoint?.media?.media_type}
          </Badge>
          <div>
            <CardTitle
              id="location-title"
              className="text-xl font-bold"
              role="heading"
              aria-level={2}
            >
              {selectedMediaPoint?.media?.name} 
            </CardTitle>
            {selectedMediaPoint?.media?.video_link && (
              <Button variant="outline" size="sm" asChild className="my-2">
                <Link
                  href={selectedMediaPoint?.media?.video_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch Video
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>

          {selectedMediaPoint?.media?.image?.url && (
            <div className="relative w-full h-50">
              <Image
                src={selectedMediaPoint.media.image.url || ""}
                alt={`Image from ${
                  selectedMediaPoint.media.name || "unknown media"
                } 
                fill
                className="object-cover rounded"
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <Metric
            label="Language"
            value={selectedMediaPoint?.media?.language}
          />
          {selectedMediaPoint?.location_description && (
            <Metric
              label="Location Description"
              value={selectedMediaPoint?.location_description}
              className="mt-3"
            />
          )}
          <Metric
            label="Summary"
            value={selectedMediaPoint?.media?.description || ""}
            className="mt-3"
          />
          <Metric
            label="Nearest Location"
            value={buildLocationString(
              selectedMediaPoint?.city,
              selectedMediaPoint?.region,
              selectedMediaPoint?.country
            )}
            className="mt-3"
          />

          <Metric
            label="Affiliated Fellow"
            value={selectedMediaPoint?.natural_feature_name}
            className="mt-3"
          />

          <Metric
            label="Tags"
            value={selectedMediaPoint?.media?.subjects}
            className="mt-3"
          />

          {relatedMedia.length > 0 && (
            <>
              <Label className="text-xs font-semibold tracking-relaxed mt-3">
                Associated Media Locations
              </Label>
              <ul className="ml-5 list-disc">
                {relatedMedia.map((item, index) => (
                  <li key={`associated-media-${index}`}>
                    <Link
                      className="text-sm flex items-center gap-1 text-primary underline underline-offset-2 hover:text-primary/80 transition-colors w-fit"
                      href={`/?mediaPointId=${item.id}`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <Metric
            href={selectedMediaPoint?.media?.rights_statement_link || ""}
            label="Corresponding Publications"
            value={selectedMediaPoint?.media?.rights || ""}
            className="mt-3"
          />
        </CardContent>
      </div>
    </Card>
  );
}
