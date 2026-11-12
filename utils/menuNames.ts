import { foodMatchScore } from "./foodMatching";
/* ────────── Bengali-first labels; English stays available for recognition and search ────────── */
import { matchesMenuCode, isCodeQuery } from "./menuSearch";
export function foodNames(item: { name: string; nameBn?: string }) {
  const primary = item.nameBn?.trim() || item.name;
  return { primary, secondary: primary !== item.name ? item.name : "" };
}
export const bnDigits = (value: string | number) =>
  String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
const categories: Record<string, string> = {
  All: "সব খাবার",
  Breakfast: "সকালের নাশতা",
  Paratha: "পরোটা",
  Naan: "নান",
  "Rice & Sides": "ভাত ও অন্যান্য",
  "Curry & Bhuna": "তরকারি ও ভুনা",
  Fish: "মাছ",
  Biriyani: "বিরিয়ানি",
  Halim: "হালিম",
  "Grill & Kebab": "গ্রিল ও কাবাব",
  Shawarma: "শাওয়ারমা",
  Pizza: "পিৎজা",
  Pasta: "পাস্তা",
  "Tea & Coffee": "চা ও কফি",
  Lassi: "লাচ্ছি",
  "Faluda & Dessert": "ফালুদা ও মিষ্টান্ন",
  Shakes: "মিল্কশেক",
  Mocktails: "মকটেইল",
  "Juice & Drinks": "জুস ও পানীয়",
};
const stations: Record<string, string> = {
  "Main Kitchen": "মূল কিচেন",
  BBQ: "বারবিকিউ",
  Drinks: "পানীয়",
};
const statuses: Record<string, string> = {
  New: "নতুন",
  Preparing: "প্রস্তুত হচ্ছে",
  Ready: "প্রস্তুত",
  Paid: "পরিশোধিত",
  Cancelled: "বাতিল",
};
export const categoryLabel = (value: string) => categories[value] || value;
export const stationLabel = (
  value: string,
  kitchens?: { id: string; name: string }[],
) => {
  const name = kitchens?.find((k) => k.id === value)?.name || value;
  return stations[name] || name;
};
export const statusLabel = (value: string) => statuses[value] || value;
export const floorLabel = (value: string) =>
  value === "Ground floor"
    ? "নিচতলা"
    : value === "Second floor"
      ? "দোতলা"
      : value;
const normalize = (value: string) =>
  value.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
export function matchesFood(
  item: {
    code?: string;
    aliases?: string[];
    name: string;
    nameBn?: string;
    category: string;
    station: string;
  },
  query: string,
) {
  if (matchesMenuCode(item.code, query)) return true;
  if (isCodeQuery(query)) return false;
  const text = normalize(
    [
      item.name,
      item.nameBn || "",
      item.category,
      categoryLabel(item.category),
      item.station,
      stationLabel(item.station),
    ].join(" "),
  );
  const needle = normalize(query);
  return (
    foodMatchScore(query, item) > 0 ||
    text.includes(needle) ||
    text.replace(/\s/g, "").includes(needle.replace(/\s/g, ""))
  );
}
