/* ────────── browser Bengali dictation; confirmation stays local and deterministic ────────── */
import { useEffect, useRef, useState } from "react";
type Speech = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: { [key: number]: { [key: number]: { transcript: string } } };
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
export function useSpeech(onResult: (text: string) => void) {
  const [supported, setSupported] = useState(false),
    [listening, setListening] = useState(false),
    [error, setError] = useState("");
  const active = useRef<Speech | null>(null),
    callback = useRef(onResult);
  callback.current = onResult;
  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => Speech;
      webkitSpeechRecognition?: new () => Speech;
    };
    setSupported(
      !!(w.SpeechRecognition || w.webkitSpeechRecognition) &&
        window.isSecureContext,
    );
    return () => active.current?.abort();
  }, []);
  function start() {
    setError("");
    const w = window as unknown as {
      SpeechRecognition?: new () => Speech;
      webkitSpeechRecognition?: new () => Speech;
    };
    const C = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!C || !window.isSecureContext) {
      setError(
        "ভয়েসের জন্য সমর্থিত ব্রাউজারে HTTPS বা localhost খুলুন। এখানে লিখেও সার্চ / অর্ডার করতে পারবেন।",
      );
      return;
    }
    active.current?.abort();
    const speech = new C();
    active.current = speech;
    speech.lang = "bn-BD";
    speech.continuous = false;
    speech.interimResults = false;
    speech.onresult = (e) => callback.current(e.results[0][0].transcript);
    speech.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "মাইক্রোফোনের অনুমতি দিন।"
          : "ভয়েস শোনা যায়নি। আবার বলুন অথবা লিখুন।",
      );
      setListening(false);
    };
    speech.onend = () => setListening(false);
    try {
      speech.start();
      setListening(true);
    } catch {
      setError("মাইক্রোফোন চালু হয়নি।");
    }
  }
  return {
    supported,
    listening,
    error,
    start,
    stop: () => active.current?.stop(),
  };
}
