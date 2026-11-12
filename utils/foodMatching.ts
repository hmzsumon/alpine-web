/* ────────── deterministic menu vocabulary; fuzzy matches never auto-select orders ────────── */
export interface FoodName {
  name: string;
  nameBn?: string;
  aliases?: string[];
}
const vocabulary: Record<string, string> = {
  normal: "সাধারণ",
  special: "স্পেশাল",
  paratha: "পরোটা",
  porota: "পরোটা",
  naan: "নান",
  nan: "নান",
  mug: "মুগ",
  moong: "মুগ",
  mung: "মুগ",
  dal: "ডাল",
  daal: "ডাল",
  chicken: "চিকেন",
  grill: "গ্রিল",
  half: "হাফ",
  full: "ফুল",
  keema: "কিমা",
  beef: "বিফ",
  mutton: "মাটন",
  fish: "ফিশ",
  rice: "ভাত",
  plain: "সাধারণ",
  pizza: "পিৎজা",
  inch: "ইঞ্চি",
  biriyani: "বিরিয়ানি",
  biryani: "বিরিয়ানি",
  kacchi: "কাচ্চি",
  tea: "চা",
  coffee: "কফি",
  juice: "জুস",
  mango: "আম",
  apple: "আপেল",
  lassi: "লাচ্ছি",
  lacchi: "লাচ্ছি",
  garlic: "গার্লিক",
  masala: "মাসালা",
};

export const normalizeFood = (text: string) =>
  text
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .normalize("NFC")
    .toLowerCase()
    .replace(/[a-z]+/g, (word) => vocabulary[word] || word)
    .replace(/নরমাল/g, "সাধারণ")
    .replace(/পরাটা|পড়োটা/g, "পরোটা")
    .replace(/পিজ্জা|পিজা|পিতজা/g, "পিৎজা")
    .replace(/লাস্সি|লাচ্চি/g, "লাচ্ছি")
    .replace(/কেবাব/g, "কাবাব")
    .replace(/ফালুদা|ফালুডা/g, "ফালুদা")
    .replace(/আধা|অর্ধেক/g, "হাফ")
    .replace(/পুরো/g, "ফুল")
    .replace(/[\u09bc\u200c\u200d]/g, "")
    .replace(/[^a-z0-9\u0980-\u09ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const compact = (s: string) => normalizeFood(s).replace(/\s/g, "");
export const foodLabels = (item: FoodName) =>
  [item.name, item.nameBn || "", ...(item.aliases || [])].filter(Boolean);
/* One insertion/deletion/substitution for longer words; no guessed code or size. */
function near(a: string, b: string) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1)
    return false;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + (i < a.length || j < b.length ? 1 : 0) <= 1;
}
export function foodMatchScore(query: string, item: FoodName) {
  const q = compact(query),
    tokens = normalizeFood(query).split(" ").filter(Boolean);
  if (!q) return 0;
  return Math.max(
    0,
    ...foodLabels(item).map((name) => {
      const candidate = compact(name),
        words = normalizeFood(name).split(" ");
      if (q === candidate) return 1;
      if (q.length >= 2 && candidate.includes(q)) return 0.85;
      if (tokens.every((token) => candidate.includes(compact(token))))
        return 0.8;
      return tokens.every((token) => words.some((word) => near(token, word)))
        ? 0.5
        : 0;
    }),
  );
}
