import { getStatus, getLastCheck, getSubscriberCount } from "@/lib/kv";
import SubscribeForm from "@/components/SubscribeForm";

// Revalidate every 5 minutes so the status is reasonably fresh
export const revalidate = 300;

function formatLastCheck(ts: string | null): string {
  if (!ts) return "Never";
  const d = new Date(ts);
  return d.toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function Home() {
  let isAvailable = false;
  let lastCheck: string | null = null;
  let subscriberCount = 0;

  try {
    [isAvailable, lastCheck, subscriberCount] = await Promise.all([
      getStatus(),
      getLastCheck(),
      getSubscriberCount(),
    ]);
  } catch {
    // KV not configured — degrade gracefully
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <p className="text-gold-400 text-xs tracking-widest uppercase font-semibold">
          CUE Cinemas · Session Alert
        </p>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Movie info */}
        <div className="mb-10">
          <p className="text-gold-400 text-xs tracking-widest uppercase mb-3">
            Coming Soon
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
            Avengers: Doomsday
          </h1>
          <p className="text-zinc-400 text-lg">
            Opening Friday, 18 December 2026 &nbsp;·&nbsp; 135 min &nbsp;·&nbsp; Sci-Fi
          </p>
        </div>

        {/* Status card */}
        <div
          className={`rounded-xl border p-6 mb-10 ${
            isAvailable
              ? "border-green-700 bg-green-950/40"
              : "border-zinc-700 bg-zinc-900/50"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${
                isAvailable
                  ? "bg-green-800/60 text-green-300"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAvailable ? "bg-green-400 animate-pulse" : "bg-zinc-500"
                }`}
              />
              {isAvailable ? "Sessions Available" : "Not Yet Available"}
            </span>
          </div>

          <p className="text-zinc-400 text-sm">
            {isAvailable
              ? "Sessions are live on CUE Cinemas — book now!"
              : "No sessions scheduled yet. We check every 15 minutes."}
          </p>

          {lastCheck && (
            <p className="text-zinc-600 text-xs mt-3">
              Last checked: {formatLastCheck(lastCheck)} AEDT
            </p>
          )}
        </div>

        {/* Subscription section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-1">Get notified instantly</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Enter your email and we&apos;ll alert you the moment sessions drop.
            {subscriberCount > 0 && (
              <span className="text-gold-400">
                {" "}
                {subscriberCount.toLocaleString()} {subscriberCount === 1 ? "person is" : "people are"} watching.
              </span>
            )}
          </p>

          <SubscribeForm />
        </div>

        {/* Book CTA if available */}
        {isAvailable && (
          <div className="mt-8 text-center">
            <a
              href="https://cuecinemas.com/Browsing/Movies/Details/f-F000001483"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gold-400 hover:bg-gold-500 text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Book at CUE Cinemas →
            </a>
          </div>
        )}
      </div>

      <footer className="border-t border-zinc-900 px-6 py-8 text-center text-zinc-600 text-xs">
        Not affiliated with CUE Cinemas. Checks every 15 minutes via Vercel Cron.
      </footer>
    </main>
  );
}
