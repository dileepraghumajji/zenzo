export type DayHours = { open: string; close: string } | null;

export interface OperatingHours {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
}

export interface ClubSearchResult {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  cover_image_url: string | null;
  business_type: string;
  subcategories: string[] | null;
  amenities: string[] | null;
  area: string | null;
  city: string | null;
  avg_rating: number | null;
  review_count: number;
  starting_price_paise: number | null;
  price_range: string | null;
  is_verified: boolean;
  featured: boolean;
  location: { lat: number; lng: number } | null;
  distance_km: number | null;
  operating_hours: OperatingHours | null;
  member_count: number;
}

export interface CoachAffiliation {
  club_id: string;
  club_name: string;
  club_slug: string;
}

export interface CoachSearchResult {
  user_id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  specializations: string[] | null;
  certifications: string[] | null;
  experience_years: number | null;
  languages: string[] | null;
  session_price_paise: number | null;
  avg_rating: number | null;
  review_count: number;
  is_available: boolean;
  is_verified: boolean;
  area: string | null;
  city: string | null;
  distance_km: number | null;
  affiliated_clubs: CoachAffiliation[];
}

export interface SuggestResult {
  label: string;
  slug: string;
  type: "club" | "coach";
}

export interface FilterState {
  category: string;
  subcategories: string[];
  amenities: string[];
  specializations: string[];
  price_range: string;
  min_rating: number;
  availability: string;
  sort: string;
}

export const EMPTY_FILTERS: FilterState = {
  category: "",
  subcategories: [],
  amenities: [],
  specializations: [],
  price_range: "",
  min_rating: 0,
  availability: "",
  sort: "relevance",
};
