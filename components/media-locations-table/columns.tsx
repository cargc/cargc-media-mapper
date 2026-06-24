import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { MediaLocation } from "@/lib/airtable/types";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ExternalLink } from "lucide-react";
import { SortableHeader } from "../sortable-header";

export const formatLocation = (item: MediaLocation) => {
  const parts = [item.city, item.region, item.country].filter(Boolean);
  return parts.join(", ");
};

export const columns: ColumnDef<MediaLocation>[] = [
  {
    id: "mediaTitle",
    accessorFn: (row) => row.media?.name,
    header: ({ column }) => (
      <SortableHeader column={column} title="Media Title" />
    ),
    cell: ({ row }) => {
      const mediaTitle = row.original.media?.name;
      const videoLink = row.original.media?.video_link;

      if (!videoLink) {
        return <div className="font-medium">{mediaTitle}</div>;
      }

      return (
        <div className="text-sm text-muted-foreground">
          <Link
            href={videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline underline-offset-2 flex items-center gap-2"
          >
            {mediaTitle}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      );
    },
    size: 200,
  },
  {
    id: "mediaType",
    accessorFn: (row) => row.media?.media_type,
    header: ({ column }) => <SortableHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const mediaType = row.original.media?.media_type;
      return mediaType ? (
        <Badge variant="outline">{mediaType}</Badge>
      ) : (
        <span>-</span>
      );
    },
  },

  {
    id: "location",
    accessorFn: (row) => formatLocation(row),
    header: ({ column }) => <SortableHeader column={column} title="Location" />,
    cell: ({ row }) => {
      const location = formatLocation(row.original);
      if (!location) return "-";

      return (
        <Link
          href={`/?mediaPointId=${row.original.id}`}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
        >
          <span>{location}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      );
    },
  },
  {
    id: "naturalFeature",
    accessorFn: (row) => row.natural_feature_name || "",
    header: ({ column }) => (
      <SortableHeader column={column} title="Affiliated Fellow" />
    ),
    cell: ({ row }) => row.original.natural_feature_name || "-",
  },
  {
    id: "subjects",
    accessorFn: (row) => row.media?.subjects?.join(", ") || "",
    header: ({ column }) => <SortableHeader column={column} title="Tags" />,
    cell: ({ row }) => {
      const subjects = row.original.media?.subjects;
      if (!subjects?.length) return "-";

      return (
        <div className="flex flex-wrap gap-1">
          {subjects.map((subject, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {subject}
            </Badge>
          ))}
        </div>
      );
    },
  },
];
