import { foodMatchScore, normalizeFood, foodLabels } from "./foodMatching";
import {
  matchesMenuCode,
  isCodeQuery,
  normalizeVoiceSearch,
  spokenNumberWords,
} from "./menuSearch";
/* ────────── conservative menu matching; uncertain choices require human review ────────── */
import type { MenuItem, OrderLine } from "../types";
export type ServingMode = "dine_in" | "parcel";
export interface VoiceSelection {
  menuId: string;
  quantity: number;
  fulfillment: ServingMode;
}
export interface VoiceRow {
  id: string;
  spoken: string;
  query: string;
  quantity: number;
  quantityConfirmed: boolean;
  fulfillment: ServingMode;
  modeConfirmed: boolean;
  menuId?: string;
  candidates: string[];
  issue?: string;
}
const numbers: Record<string, number> = {
  এক: 1,
  একটা: 1,
  একটি: 1,
  দুই: 2,
  দুটো: 2,
  দুটি: 2,
  তিন: 3,
  চার: 4,
  পাঁচ: 5,
  ছয়: 6,
  ছয়: 6,
  সাত: 7,
  আট: 8,
  নয়: 9,
  নয়: 9,
  দশ: 10,
  এগারো: 11,
  বারো: 12,
  তেরো: 13,
  চৌদ্দ: 14,
  পনেরো: 15,
  ষোলো: 16,
  সতেরো: 17,
  আঠারো: 18,
  উনিশ: 19,
  বিশ: 20,
  ত্রিশ: 30,
  চল্লিশ: 40,
  পঞ্চাশ: 50,
  ষাট: 60,
  সত্তর: 70,
  আশি: 80,
  নব্বই: 90,
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
};
for (const word of spokenNumberWords)
  numbers[word] = Number(normalizeVoiceSearch(word));
const toDigits = (text: string) =>
  text.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
export const voiceNormalize = normalizeFood;
const compact = (text: string) => voiceNormalize(text).replace(/\s/g, "");
const numberWords = Object.keys(numbers)
  .sort((a, b) => b.length - a.length)
  .join("|");
const quantityWords = new RegExp(
  `(^|[\\s,;।])(${numberWords})(?=টা|টি|খানা|পিস|বাটি|কাপ|গ্লাস|\\s|হাফ|ফুল|পরোটা|মুগ|গ্রিল|নান|$)`,
  "gi",
);
function prepare(text: string) {
  return toDigits(text)
    .toLowerCase()
    .replace(/1\s*\/\s*2/g, " হাফ ")
    .replace(
      quantityWords,
      (_, space: string, word: string) => space + numbers[word] + " ",
    )
    .replace(/([0-9])(?=[a-z\u0980-\u09ff])/g, "$1 ")
    .replace(/\b(\d+)\s*(টা|টি|খানা|পিস|বাটি|কাপ|গ্লাস)/g, "$1 ");
}
function quantities(text: string) {
  return [...text.matchAll(/(^|\s)(\d+)(?=\s|$)/g)].filter(
    (match) =>
      !/^\s*(ইঞ্চি|inch|ইঞ্চ)/.test(
        text.slice((match.index || 0) + match[0].length),
      ),
  );
}
function chunks(text: string): string[] {
  return prepare(text)
    .split(/[,;।\n]+|\s+(?:আরও|আর|এবং|and)\s+/i)
    .flatMap((part) => {
      const marks = quantities(part).filter(
        (match) =>
          part.slice((match.index || 0) + match[0].length).trim().length > 0,
      );
      const cuts = [
        0,
        ...marks.slice(1).map((match) => match.index || 0),
        part.length,
      ];
      return cuts
        .slice(0, -1)
        .map((start, index) => part.slice(start, cuts[index + 1]).trim());
    })
    .filter(Boolean);
}
function score(query: string, item: MenuItem): number {
  if (matchesMenuCode(item.code, query)) return 1;
  if (isCodeQuery(query)) return 0;
  return foodMatchScore(query, item);
}
/* Protect explicit codes before quantity splitting: দুইটা কোড উনিশ => 2 portions, code 19. */
function protectCodes(text: string) {
  return text.replace(
    /(?:কোড|নম্বর|নাম্বার|code|number)\s*([^,;।\n]+)/gi,
    (whole, tail: string) => {
      const words = tail.trim().split(/\s+/);
      let count = 0,
        code = "";
      for (let n = 1; n <= Math.min(words.length, 5); n++) {
        const value = normalizeVoiceSearch(words.slice(0, n).join(" "));
        if (/^\d+$/.test(value)) {
          count = n;
          code = value;
        }
      }
      return count ? `§${code}§ ${words.slice(count).join(" ")}` : whole;
    },
  );
}
export function voiceCandidates(query: string, menu: MenuItem[]): MenuItem[] {
  return menu
    .filter((item) => item.active && Number.isFinite(item.price))
    .map((item) => ({ item, score: score(query, item) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.item);
}
export function parseVoiceOrder(
  text: string,
  menu: MenuItem[],
  mode: ServingMode,
  takeaway = false,
): VoiceRow[] {
  const parts = chunks(protectCodes(text));
  if (parts.length > 40 || text.length > 2000)
    throw new Error(
      "একবারে সর্বোচ্চ ৪০টি লাইন বলুন। ছোট করে ভাগ করে যোগ করুন।",
    );
  return parts.map((spoken, index) => {
    const hasParcel = /পার্সেল|প্যাকেট|প্যাকিং|parcel|take\s*away/i.test(
      spoken,
    );
    const hasDine = /এখানে|টেবিলে|বসে|dine\s*in/i.test(spoken);
    let fulfillment: ServingMode = takeaway
      ? "parcel"
      : hasParcel
        ? "parcel"
        : hasDine
          ? "dine_in"
          : mode;
    const counts = quantities(spoken),
      count = counts[0];
    const quantity = count ? Number(count[2]) : 1;
    const quantityConfirmed =
      counts.length === 1 && quantity >= 1 && quantity <= 99;
    let query = spoken;
    if (count)
      query =
        query.slice(0, count.index) +
        " " +
        query.slice((count.index || 0) + count[0].length);
    query = query
      .replace(
        /পার্সেল|প্যাকেট|প্যাকিং|এখানে\s*খাবেন|এখানে\s*খাবো|এখানে|টেবিলে|বসে|parcel|take\s*away|dine\s*in/gi,
        " ",
      )
      .replace(/\s+(দিন|দেন|দাও|নেব|নিব|চাই|হবে|করুন|করে|খাবো|খাবেন)\s*$/g, " ")
      .trim();
    query = query.replace(/§(\d+)§/g, "কোড $1");
    let candidates = voiceCandidates(query, menu);
    const sizeRequested = /হাফ|ফুল|half|full|আধা|অর্ধেক|ইঞ্চি|inch/i.test(
      query,
    );
    const missingSize = !candidates.length && sizeRequested;
    if (missingSize)
      candidates = voiceCandidates(
        query.replace(/হাফ|ফুল|half|full|আধা|অর্ধেক|\d+\s*(ইঞ্চি|inch)/gi, " "),
        menu,
      );
    const exact = candidates.filter((item) =>
      foodLabels(item).some((name) => compact(name) === compact(query)),
    );
    const selected = missingSize
      ? undefined
      : exact.length === 1
        ? exact[0]
        : candidates.length === 1 && score(query, candidates[0]) >= 0.8
          ? candidates[0]
          : undefined;
    const modeConfirmed = !(takeaway && hasDine) && !(hasParcel && hasDine);
    return {
      id: `voice-${index}`,
      spoken: spoken.replace(/§(\d+)§/g, "কোড $1"),
      query,
      quantity,
      quantityConfirmed,
      fulfillment,
      modeConfirmed,
      menuId: selected?.id,
      candidates: candidates.map((item) => item.id),
      issue: missingSize
        ? "বলা সাইজটি মেনুতে মেলেনি। সঠিক পরিবেশন নিজে বাছুন; দাম অর্ধেক করা হবে না।"
        : !selected
          ? candidates.length
            ? "কাছাকাছি বা একাধিক মিল আছে—সঠিক আইটেমটি বাছুন।"
            : "মেনুতে নিশ্চিত মিল পাওয়া যায়নি। সার্চ করে বাছুন।"
          : undefined,
    };
  });
}
/* ────────── atomic draft merge; never touch a pending request or invent prices ────────── */
export function mergeVoiceItems(
  current: OrderLine[],
  rows: VoiceSelection[],
  menu: MenuItem[],
  takeaway: boolean,
  stock?: Record<
    string,
    { available: boolean; quantity: number | null; reason?: string }
  >,
): OrderLine[] {
  if (!rows.length || rows.length > 40)
    throw new Error(
      "খাবারের তালিকা মিলিয়ে নিন। সর্বোচ্চ ৪০টি লাইন একবারে যোগ করুন।",
    );
  const result = current.map((line) => ({ ...line }));
  for (const row of rows) {
    const item = menu.find(
      (entry) =>
        entry.id === row.menuId && entry.active && Number.isFinite(entry.price),
    );
    if (!item)
      throw new Error(
        "কোনো খাবার এখন মেনুতে নেই। তালিকা আপডেট করে আবার বাছুন।",
      );
    if (
      !Number.isInteger(row.quantity) ||
      row.quantity < 1 ||
      row.quantity > 99
    )
      throw new Error("প্রতিটি পরিমাণ ১ থেকে ৯৯ দিন।");
    if (
      !["dine_in", "parcel"].includes(row.fulfillment) ||
      (takeaway && row.fulfillment !== "parcel")
    )
      throw new Error(
        "শুধু পার্সেল অর্ডারে এখানে খাওয়ার খাবার যোগ করা যাবে না।",
      );
    const existing = result.find(
      (line) =>
        line.menuId === item.id &&
        (line.fulfillment || "dine_in") === row.fulfillment,
    );
    const quantity = (existing?.quantity || 0) + row.quantity;
    if (quantity > 99)
      throw new Error(
        `${item.nameBn || item.name}: একই লাইনে সর্বোচ্চ ৯৯টি রাখা যাবে।`,
      );
    const canonical = {
      menuId: item.id,
      name: item.name,
      nameBn: item.nameBn,
      price: item.price,
      station: item.station,
      quantity,
      fulfillment: row.fulfillment,
    };
    if (existing) Object.assign(existing, canonical);
    else result.push(canonical);
  }
  if (result.length > 80)
    throw new Error("এক অর্ডারে সর্বোচ্চ ৮০টি খাবারের লাইন রাখা যাবে।");
  for (const id of new Set(rows.map((row) => row.menuId))) {
    const availability = stock?.[id],
      item = menu.find((entry) => entry.id === id)!;
    const needed = result
      .filter((line) => line.menuId === id)
      .reduce((sum, line) => sum + line.quantity, 0);
    if (
      availability &&
      (!availability.available ||
        (availability.quantity !== null && availability.quantity < needed))
    )
      throw new Error(
        `${item.nameBn || item.name}: ${availability.available ? "এই পরিমাণ স্টকে নেই।" : "এখন পাওয়া যাচ্ছে না।"}`,
      );
  }
  return result;
}
