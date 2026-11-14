import { NextRequest, NextResponse } from "next/server";
import { removeSubscriber } from "@/lib/kv";
import { verifyUnsubscribeToken } from "@/lib/email";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const token = searchParams.get("token") ?? "";

  if (!email || !token) {
    return new NextResponse("Missing email or token", { status: 400 });
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return new NextResponse("Invalid unsubscribe link", { status: 403 });
  }

  await removeSubscriber(email);

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Unsubscribed</title>
    <style>body{background:#0a0a0a;color:#ccc;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
    .box{text-align:center;padding:40px;background:#111;border:1px solid #222;border-radius:8px;max-width:400px;}
    h1{color:#f5c842;font-size:24px;margin:0 0 12px;}
    p{margin:0 0 20px;line-height:1.6;}
    a{color:#f5c842;}</style></head>
    <body><div class="box">
      <h1>Unsubscribed</h1>
      <p>You've been removed from the Doomsday Tracker alert list.</p>
      <a href="/">← Back to tracker</a>
    </div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
