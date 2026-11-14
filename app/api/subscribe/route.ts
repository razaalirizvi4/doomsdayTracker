import { NextRequest, NextResponse } from "next/server";
import { addSubscriber } from "@/lib/kv";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let email: string;

  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  if (email.length > 254) {
    return NextResponse.json({ error: "Email too long" }, { status: 400 });
  }

  const result = await addSubscriber(email);

  if (result === "exists") {
    return NextResponse.json({ message: "Already subscribed" }, { status: 200 });
  }

  return NextResponse.json({ message: "Subscribed successfully" }, { status: 201 });
}
