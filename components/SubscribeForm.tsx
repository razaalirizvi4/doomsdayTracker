"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "exists" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.status === 201) {
        setStatus("success");
        setEmail("");
      } else if (res.status === 200) {
        setStatus("exists");
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-4">
        <div className="text-2xl mb-2">✓</div>
        <p className="text-gold-400 font-semibold">You&apos;re on the list!</p>
        <p className="text-gray-400 text-sm mt-1">
          We&apos;ll email you the moment Doomsday sessions go live.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-gray-500 text-xs underline hover:text-gray-300"
        >
          Add another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === "loading"}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-gold-400 hover:bg-gold-500 text-black font-bold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === "loading" ? "Adding…" : "Notify me"}
        </button>
      </div>

      {status === "exists" && (
        <p className="text-yellow-400 text-sm">Already subscribed — we&apos;ll alert you!</p>
      )}
      {status === "error" && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}
    </form>
  );
}
