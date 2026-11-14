import { Resend } from "resend";
import { createHmac } from "crypto";
import type { Showtime } from "./scraper";

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.FROM_EMAIL ?? "noreply@example.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://doomsday-tracker.vercel.app";

export function makeUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? "fallback-secret";
  return createHmac("sha256", secret).update(email).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  return makeUnsubscribeToken(email) === token;
}

function buildEmailHtml(email: string, showtimes: Showtime[]): string {
  const unsubToken = makeUnsubscribeToken(email);
  const unsubUrl = `${BASE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`;
  const bookUrl = "https://cuecinemas.com/Browsing/Movies/Details/f-F000001483";

  const showtimeRows =
    showtimes.length > 0
      ? showtimes
          .map(
            (s) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #333;color:#ccc;">${s.date}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #333;color:#ccc;">${s.screen}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #333;color:#f5c842;">${s.times.join(" · ")}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="padding:12px;color:#ccc;text-align:center;">Check the CUE Cinemas website for full session times.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Avengers: Doomsday tickets available</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#111;border:1px solid #222;border-radius:8px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1a1a1a,#0d0d0d);padding:32px;text-align:center;border-bottom:2px solid #f5c842;">
      <div style="color:#f5c842;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">CUE Cinemas Alert</div>
      <h1 style="color:#fff;font-size:28px;margin:0 0 8px;">Avengers: Doomsday</h1>
      <p style="color:#aaa;margin:0;font-size:14px;">Show times are now available to book!</p>
    </div>

    <div style="padding:32px;">
      <p style="color:#ccc;margin:0 0 24px;line-height:1.6;">
        Great news — sessions for <strong style="color:#fff;">Avengers: Doomsday</strong> are now
        showing at CUE Cinemas. Opening <strong style="color:#f5c842;">Friday, 18 December 2026</strong>.
      </p>

      ${
        showtimes.length > 0
          ? `<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#1a1a1a;">
            <th style="padding:10px 12px;text-align:left;color:#f5c842;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Date</th>
            <th style="padding:10px 12px;text-align:left;color:#f5c842;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Screen</th>
            <th style="padding:10px 12px;text-align:left;color:#f5c842;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Times</th>
          </tr>
        </thead>
        <tbody>${showtimeRows}</tbody>
      </table>`
          : ""
      }

      <a href="${bookUrl}" style="display:inline-block;background:#f5c842;color:#000;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;margin-bottom:24px;">
        Book Tickets at CUE Cinemas →
      </a>

      <p style="color:#555;font-size:12px;margin:0;border-top:1px solid #222;padding-top:16px;">
        You're receiving this because you subscribed at the Doomsday Tracker.<br>
        <a href="${unsubUrl}" style="color:#888;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendAlertEmails(
  emails: string[],
  showtimes: Showtime[]
): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;

  // Resend supports batch sending up to 100 at once
  const batches: string[][] = [];
  for (let i = 0; i < emails.length; i += 100) {
    batches.push(emails.slice(i, i + 100));
  }

  for (const batch of batches) {
    const resend = getResend();
    const results = await Promise.allSettled(
      batch.map((email) =>
        resend.emails.send({
          from: FROM,
          to: email,
          subject: "🎬 Avengers: Doomsday — CUE Cinemas sessions now available!",
          html: buildEmailHtml(email, showtimes),
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && !result.value.error) {
        sent++;
      } else {
        errors++;
      }
    }
  }

  return { sent, errors };
}
