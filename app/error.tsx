"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page max-w-md mx-auto">
      <h1 className="text-xl font-bold">পেজটি আবার খুলুন</h1>
      <p className="muted my-4">
        সংযোগ ও ব্রাউজারের স্টোরেজ পরীক্ষা করুন। সেভ করা অর্ডার থাকলে একই অনুরোধ
        দিয়ে আবার পাঠাবেন।
      </p>
      <button className="primary" onClick={reset}>
        আবার চেষ্টা করুন
      </button>
    </main>
  );
}
