/* ────────── exact item-code lookup and Bengali spoken code normalization ────────── */
export const codeDigits = (value: string) =>
  value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
const canonical = (value: string) =>
  value
    .normalize("NFC")
    .replace(/[\u09bc\u200c\u200d]/g, "")
    .replace(/ঊন/g, "উন")
    .toLowerCase();
const words = [
  "শূন্য",
  "এক",
  "দুই",
  "তিন",
  "চার",
  "পাঁচ",
  "ছয়",
  "সাত",
  "আট",
  "নয়",
  "দশ",
  "এগারো",
  "বারো",
  "তেরো",
  "চৌদ্দ",
  "পনেরো",
  "ষোলো",
  "সতেরো",
  "আঠারো",
  "উনিশ",
  "বিশ",
  "একুশ",
  "বাইশ",
  "তেইশ",
  "চব্বিশ",
  "পঁচিশ",
  "ছাব্বিশ",
  "সাতাশ",
  "আঠাশ",
  "উনত্রিশ",
  "ত্রিশ",
  "একত্রিশ",
  "বত্রিশ",
  "তেত্রিশ",
  "চৌত্রিশ",
  "পঁয়ত্রিশ",
  "ছত্রিশ",
  "সাঁইত্রিশ",
  "আটত্রিশ",
  "উনচল্লিশ",
  "চল্লিশ",
  "একচল্লিশ",
  "বিয়াল্লিশ",
  "তেতাল্লিশ",
  "চুয়াল্লিশ",
  "পঁয়তাল্লিশ",
  "ছেচল্লিশ",
  "সাতচল্লিশ",
  "আটচল্লিশ",
  "উনপঞ্চাশ",
  "পঞ্চাশ",
  "একান্ন",
  "বাহান্ন",
  "তিপ্পান্ন",
  "চুয়ান্ন",
  "পঞ্চান্ন",
  "ছাপ্পান্ন",
  "সাতান্ন",
  "আটান্ন",
  "উনষাট",
  "ষাট",
  "একষট্টি",
  "বাষট্টি",
  "তেষট্টি",
  "চৌষট্টি",
  "পঁয়ষট্টি",
  "ছেষট্টি",
  "সাতষট্টি",
  "আটষট্টি",
  "উনসত্তর",
  "সত্তর",
  "একাত্তর",
  "বাহাত্তর",
  "তিয়াত্তর",
  "চুয়াত্তর",
  "পঁচাত্তর",
  "ছিয়াত্তর",
  "সাতাত্তর",
  "আটাত্তর",
  "উনআশি",
  "আশি",
  "একাশি",
  "বিরাশি",
  "তিরাশি",
  "চুরাশি",
  "পঁচাশি",
  "ছিয়াশি",
  "সাতাশি",
  "আটাশি",
  "উননব্বই",
  "নব্বই",
  "একানব্বই",
  "বিরানব্বই",
  "তিরানব্বই",
  "চুরানব্বই",
  "পঁচানব্বই",
  "ছিয়ানব্বই",
  "সাতানব্বই",
  "আটানব্বই",
  "নিরানব্বই",
];
const numbers = new Map(words.map((word, index) => [canonical(word), index]));
for (const [word, value] of Object.entries({
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  thirtyfive: 35,
  তিরিশ: 30,
  পঁয়ত্রিশ: 35,
  দু: 2,
}))
  numbers.set(canonical(word), value);
export const spokenNumberWords = [...words, ...numbers.keys()];
export function normalizeVoiceSearch(input: string): string {
  const text = codeDigits(input)
    .trim()
    .replace(/[।,!?]+$/g, "");
  const clean = text
    .replace(
      /^(?:আইটেম\s*)?(?:কোড|code|নাম্বার|নম্বর|number)\s*(?:(?:নাম্বার|নম্বর|number)\s*)?/i,
      "",
    )
    .trim();
  if (/^\d[\d\s]*$/.test(clean)) return clean.replace(/\s/g, "");
  const tokens = canonical(clean).split(/\s+/),
    compact = tokens.join("");
  if (numbers.has(compact)) return String(numbers.get(compact));
  if (
    tokens.length > 1 &&
    tokens.every(
      (token) =>
        /^\d$/.test(token) || (numbers.has(token) && numbers.get(token)! < 10),
    )
  )
    return tokens
      .map((token) => (/^\d$/.test(token) ? token : numbers.get(token)))
      .join("");
  const hundreds = compact.match(/^(.+?)(?:শো|শত|শ|hundred)(.*)$/);
  if (hundreds) {
    const prefix =
      numbers.get(hundreds[1]) ??
      (/^[1-9]$/.test(hundreds[1]) ? Number(hundreds[1]) : undefined);
    const suffix = hundreds[2]
      ? (numbers.get(hundreds[2]) ??
        (/^\d{1,2}$/.test(hundreds[2]) ? Number(hundreds[2]) : undefined))
      : 0;
    if (prefix && prefix < 10 && suffix !== undefined && suffix < 100)
      return String(prefix * 100 + suffix);
  }
  return clean;
}
export const isCodeQuery = (query: string) =>
  /^\d+$/.test(normalizeVoiceSearch(query));
export function matchesMenuCode(code: string | undefined, query: string) {
  return (
    !!code &&
    codeDigits(code).toUpperCase() === normalizeVoiceSearch(query).toUpperCase()
  );
}
