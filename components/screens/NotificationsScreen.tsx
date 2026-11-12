"use client";
import { Bell, CheckCheck } from "lucide-react";
import { useWaiterContext } from "@/context/WaiterContext";
import { Title, Button, Empty } from "../ui/Primitives";
export default function NotificationsScreen() {
  const c = useWaiterContext();
  return (
    <section className="page">
      <Title
        eyebrow="প্রস্তুত খাবারের খবর"
        title="নোটিফিকেশন"
        detail="অপারেটর খাবার প্রস্তুত করলে এখানেও খবর পাবেন।"
      />
      <Button
        secondary
        className="w-full my-4"
        onClick={() => void c.operations.enablePush()}
      >
        <Bell size={18} />
        ব্রাউজারের খবর চালু করুন
      </Button>
      <p className="muted text-xs leading-6 mb-4">{c.operations.pushStatus}</p>
      {c.operations.error && <p className="error-text">{c.operations.error}</p>}
      <div className="space-y-3">
        {c.operations.notifications.map((n) => (
          <article
            key={n.id}
            className={"card " + (!n.readAt ? "border-alpine/60" : "")}
          >
            <div className="flex gap-3">
              <Bell size={22} className="text-alpine shrink-0" />
              <div>
                <h2 className="font-bold text-base">{n.title}</h2>
                <p className="muted text-sm leading-7 mt-2">{n.body}</p>
                <p className="muted text-xs mt-2">
                  {new Date(n.createdAt).toLocaleString("bn-BD")}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              {!n.readAt && (
                <button
                  className="text-alpine text-xs flex gap-1 items-center"
                  onClick={() => void c.operations.read(n.id)}
                >
                  <CheckCheck size={15} />
                  পড়েছি
                </button>
              )}
              <button
                className="text-alpine text-xs"
                onClick={() => {
                  void c.operations.read(n.id);
                  c.navigate("operations");
                }}
              >
                প্রস্তুতির তালিকা দেখুন →
              </button>
            </div>
          </article>
        ))}
      </div>
      {!c.operations.notifications.length && (
        <Empty
          title="এখনও কোনো খবর নেই"
          detail="খাবার প্রস্তুত হলে এখানে দেখা যাবে।"
        />
      )}
    </section>
  );
}
