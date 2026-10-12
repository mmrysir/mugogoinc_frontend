// ── Region & Language Constants ───────────────────────────────────────────────
// Shared across Keyword Planner and any future multi-region targeting UI.

export interface RegionPreset {
  label: string;
  emoji: string;
  countries: string[];
  languages: string[];
}

export const REGION_PRESETS: RegionPreset[] = [
  {
    label: "Global",
    emoji: "🌐",
    countries: ["United States", "United Kingdom", "Canada", "Australia", "Kenya", "South Africa", "Germany", "France"],
    languages: ["English"],
  },
  {
    label: "East Africa",
    emoji: "🌍",
    countries: ["Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia"],
    languages: ["English", "Swahili"],
  },
  {
    label: "West Africa",
    emoji: "🌍",
    countries: ["Nigeria", "Ghana", "Ivory Coast", "Senegal"],
    languages: ["English", "French"],
  },
  {
    label: "North Africa",
    emoji: "🌍",
    countries: ["Egypt", "Morocco", "Algeria", "Tunisia"],
    languages: ["Arabic", "French"],
  },
  {
    label: "Africa",
    emoji: "🌍",
    countries: ["Kenya", "Nigeria", "South Africa", "Ghana", "Egypt", "Morocco", "Tanzania", "Uganda"],
    languages: ["English", "Arabic", "French"],
  },
  {
    label: "North America",
    emoji: "🌎",
    countries: ["United States", "Canada", "Mexico"],
    languages: ["English", "Spanish"],
  },
  {
    label: "Europe",
    emoji: "🇪🇺",
    countries: ["United Kingdom", "Germany", "France", "Spain", "Italy", "Netherlands"],
    languages: ["English", "German", "French", "Spanish"],
  },
  {
    label: "Middle East",
    emoji: "🕌",
    countries: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Israel", "Oman"],
    languages: ["Arabic", "English"],
  },
  {
    label: "Southeast Asia",
    emoji: "🌏",
    countries: ["Singapore", "Thailand", "Malaysia", "Indonesia", "Vietnam", "Philippines"],
    languages: ["English"],
  },
];

export const AVAILABLE_LOCATIONS: string[] = [
  // Africa – East
  "Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "Burundi", "South Sudan",
  // Africa – West
  "Nigeria", "Ghana", "Ivory Coast", "Senegal", "Mali", "Burkina Faso", "Togo", "Benin",
  // Africa – North
  "Egypt", "Morocco", "Algeria", "Tunisia", "Libya",
  // Africa – South
  "South Africa", "Zambia", "Zimbabwe", "Mozambique", "Botswana", "Namibia", "Malawi",
  // Africa – Central
  "Democratic Republic of Congo", "Cameroon", "Angola",
  // North America
  "United States", "Canada", "Mexico",
  // Europe
  "United Kingdom", "Germany", "France", "Spain", "Italy", "Netherlands", "Sweden",
  "Norway", "Denmark", "Switzerland", "Belgium", "Poland", "Portugal",
  // Middle East
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Israel", "Oman", "Kuwait", "Bahrain",
  // Asia
  "India", "Singapore", "Thailand", "Malaysia", "Indonesia", "Vietnam", "Philippines",
  "Japan", "South Korea", "China",
  // Oceania
  "Australia", "New Zealand",
];

export const AVAILABLE_LANGUAGES: string[] = [
  "English", "Swahili", "French", "Spanish", "German", "Arabic",
  "Hindi", "Portuguese", "Italian", "Dutch", "Swedish", "Polish",
  "Indonesian", "Vietnamese", "Tagalog", "Japanese", "Korean", "Chinese",
];
