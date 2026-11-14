import { NextRequest, NextResponse } from "next/server";
import { scrapeShowtimes } from "@/lib/scraper";
import { sendAlertEmails } from "@/lib/email";
import {
  getAllSubscribers,
  isNotified,
  setNotified,
  setStatus,
  setLastCheck,
} from "@/lib/kv";

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  await setLastCheck(now);

  const result = await scrapeShowtimes();

  if (result.error) {
    return NextResponse.json({ error: result.error, checked: now }, { status: 500 });
  }

  await setStatus(result.hasShowtimes);

  if (!result.hasShowtimes) {
    return NextResponse.json({ hasShowtimes: false, checked: now });
  }

  // Showtimes are live — check if we've already sent notifications
  const alreadyNotified = await isNotified();
  if (alreadyNotified) {
    return NextResponse.json({ hasShowtimes: true, notified: true, checked: now });
  }

  const subscribers = await getAllSubscribers();

  if (subscribers.length === 0) {
    await setNotified(true);
    return NextResponse.json({ hasShowtimes: true, sent: 0, checked: now });
  }

  const { sent, errors } = await sendAlertEmails(subscribers, result.showtimes);
  await setNotified(true);

  return NextResponse.json({ hasShowtimes: true, sent, errors, checked: now });
}
