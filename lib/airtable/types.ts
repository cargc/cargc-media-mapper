export interface MediaImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  width: number;
  height: number;
  thumbnails: {
    small: {
      width: number;
      height: number;
    };
    large: {
      width: number;
      height: number;
    };
  };
}

export interface Media {
  name: string;
  original_title?: string;
  media_type?: string;
  description?: string;
  image?: MediaImage;
  video_link?: string;
  subjects?: string[];
  references?: string;
  rights?: string;
  rights_statement_link?: string;
  related_media_locations?: string[];
}

export interface MediaLocation {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  location_name?: string;
  location_description?: string;
  natural_feature_name?: string;
  city?: string;
  region?: string;
  country?: string;
  media?: Media;
}

export interface MapFilters {
  countries: string[];
  regions: string[];
  bodiesOfWater: string[];
}

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface WebAppMetadata {
  title: string;
  description: string;
  keywords: string;
  creator: string;
  owner: string;
  getting_started_dialog_title?: string;
  getting_started_dialog_content?: string;
  getting_started_dialog_enabled?: boolean;
  getting_started_dialog_version?: string;
}
