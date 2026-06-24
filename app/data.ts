import { cache } from "react";
import { base, convertKeysToSnakeCase } from "@/lib/airtable";
import { Media, WebAppMetadata } from "@/lib/airtable/types";

const MEDIA_LOCATION_TABLE_NAME = "Media Locations";
const MEDIA_TABLE_NAME = "Media";
const WEB_APP_METADATA_TABLE_NAME = "Web App Metadata";

// Fetches Media records directly rather than relying on lookup fields on the
// Media Locations table. Airtable lookup fields strip rich text (Markdown)
// formatting, so we fetch from the source table to preserve it.
async function getMedia(): Promise<Map<string, Media>> {
  const records = await base(MEDIA_TABLE_NAME).select().all();

  const mediaMap = new Map<string, Media>();
  for (const record of records) {
    const fields = convertKeysToSnakeCase(record.fields);
    mediaMap.set(record.id, {
      name: fields.name,
      original_title: fields.original_title,
      description: fields.description,
      image: fields.image?.[0],
      video_link: fields.video_link,
      subjects: fields.tags,
      references: fields.references,
      rights: fields.corresponding_publications,
      rights_statement_link: fields.corresponding_publication_link,
      media_type: fields.media_type,
      related_media_locations: fields.related_media_locations,
    });
  }

  return mediaMap;
}

export async function getMediaPoints() {
  const [locationRecords, mediaMap] = await Promise.all([
    base(MEDIA_LOCATION_TABLE_NAME)
      .select({
        view: process.env.AIRTABLE_VIEW_NAME,
      })
      .all(),
    getMedia(),
  ]);

  return locationRecords
    .filter((record) => record.fields.Latitude && record.fields.Longitude)
    .map((record) => {
      const fields = convertKeysToSnakeCase(record.fields);
      const mediaId = fields.media?.[0];

      return {
        id: record.id,
        name: fields.name,
        latitude: fields.latitude,
        longitude: fields.longitude,
        location_name: fields.location_name,
        location_description: fields.location_description,
        natural_feature_name: fields.affiliated_fellow,
        affiliated_fellow_link: fields.affiliated_fellow_link,
        city: fields.city,
        region: fields.region,
        country: fields.country,
        media: mediaId ? mediaMap.get(mediaId) : undefined,
      };
    });
}

export const getWebAppMetadata = cache(async (): Promise<WebAppMetadata> => {
  const response = await base(WEB_APP_METADATA_TABLE_NAME)
    .select({
      view: process.env.AIRTABLE_VIEW_NAME,
    })
    .all()
    .then((records) => {
      return records.map((record) => {
        const fields = convertKeysToSnakeCase(record.fields);
        return {
          title: fields.site_title,
          description: fields.site_description,
          keywords: fields.site_keywords,
          creator: fields.creator,
          owner: fields.owner,
          getting_started_dialog_title: fields.getting_started_dialog_title,
          getting_started_dialog_content: fields.getting_started_dialog_content,
          getting_started_dialog_enabled:
            fields.getting_started_dialog_enabled ?? false,
          getting_started_dialog_version:
            fields.getting_started_dialog_version ?? "v1",
        };
      });
    });

  const metadata = response[0] ?? ({} as WebAppMetadata);

  return metadata;
});
