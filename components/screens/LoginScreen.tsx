"use client";
import { useState } from "react";
import { ShieldCheck, Eye, EyeOff, Server } from "lucide-react";
import { useWaiterContext } from "@/context/WaiterContext";
import { Button } from "../ui/Primitives";
export default function LoginScreen() {
  const c = useWaiterContext(),
    [identifier, setIdentifier] = useState(""),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [settings, setSettings] = useState(false);
  return (
    <main className="login-wrap">
      <img
        src="/alpine-logo.png"
        alt="Alpine Restaurant"
        width={112}
        height={112}
        className="rounded-3xl mb-8"
      />
      <p className="eyebrow">ALPINE RESTAURANT</p>
      <h1 className="login-title">
        আপনার দায়িত্বে
        <br />
        সুন্দর সেবা।
      </h1>
      <p className="muted leading-7 mt-5">
        টেবিল অনুযায়ী অর্ডার নিন, সঠিক কিচেনে পাঠান।
      </p>
      <form
        className="card login-card"
        onSubmit={(e) => {
          e.preventDefault();
          void c.login(identifier.trim(), password, c.server);
        }}
      >
        <h2 className="flex items-center gap-3 text-xl font-bold mb-7">
          <ShieldCheck size={25} className="text-alpine" />
          কর্মীর লগইন
        </h2>
        <label>
          মোবাইল নম্বর / ইমেইল
          <input
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="মোবাইল নম্বর অথবা ইমেইল"
          />
        </label>
        <label>
          অ্যাডমিনের দেওয়া পাসওয়ার্ড
          <div className="relative">
            <input
              required
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </label>
        {c.error && (
          <p role="alert" className="error-text">
            {c.error}
          </p>
        )}
        <Button busy={c.busy} type="submit" className="w-full mt-5">
          লগইন করুন
        </Button>
      </form>
      <button
        className="flex items-center justify-center gap-2 muted w-full mt-7 text-sm"
        onClick={() => setSettings(!settings)}
      >
        <Server size={17} /> Restaurant server settings
      </button>
      {settings && (
        <div className="card mt-3 text-xs leading-6 muted">
          একই মোবাইল অ্যাপের অ্যাকাউন্ট দিয়ে লগইন করুন।
          <br />
          লাইভ সংযোগ: {c.server}
          <br />
          ওয়েবের API সার্ভার .env.local থেকে নির্ধারণ করা হয়।
        </div>
      )}
      <p className="muted text-center text-xs tracking-widest mt-9">
        MAIN KITCHEN · BBQ · DRINKS
      </p>
    </main>
  );
}
