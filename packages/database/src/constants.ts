// ─── Zenzo Shared Constants ─────────────────────────────────────────────────
// Non-enum constants shared across web and mobile apps.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Top 50 Indian cities for the city autocomplete dropdown.
 * Ordered roughly by population / fitness market relevance.
 */
export const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Surat",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Dhanbad",
  "Amritsar",
  "Navi Mumbai",
  "Allahabad",
  "Ranchi",
  "Howrah",
  "Coimbatore",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kochi",
  "Chandigarh",
  "Mysuru",
  "Gurgaon",
  "Noida",
  "Thiruvananthapuram",
  "Dehradun",
  "Mangaluru",
] as const;

export type IndianCity = (typeof INDIAN_CITIES)[number];
