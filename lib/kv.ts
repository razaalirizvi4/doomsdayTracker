import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SUBSCRIBERS_KEY = "doomsday:subscribers";
const NOTIFIED_KEY = "doomsday:notified";
const STATUS_KEY = "doomsday:status";
const LAST_CHECK_KEY = "doomsday:last_check";

export async function addSubscriber(email: string): Promise<"added" | "exists"> {
  const added = await redis.sadd(SUBSCRIBERS_KEY, email);
  return added === 1 ? "added" : "exists";
}

export async function removeSubscriber(email: string): Promise<void> {
  await redis.srem(SUBSCRIBERS_KEY, email);
}

export async function getAllSubscribers(): Promise<string[]> {
  const members = await redis.smembers(SUBSCRIBERS_KEY);
  return members as string[];
}

export async function getSubscriberCount(): Promise<number> {
  return redis.scard(SUBSCRIBERS_KEY);
}

export async function isNotified(): Promise<boolean> {
  const val = await redis.get<string>(NOTIFIED_KEY);
  return val === "true";
}

export async function setNotified(value: boolean): Promise<void> {
  await redis.set(NOTIFIED_KEY, value ? "true" : "false");
}

export async function getStatus(): Promise<boolean> {
  const val = await redis.get<string>(STATUS_KEY);
  return val === "true";
}

export async function setStatus(value: boolean): Promise<void> {
  await redis.set(STATUS_KEY, value ? "true" : "false");
}

export async function getLastCheck(): Promise<string | null> {
  return redis.get<string>(LAST_CHECK_KEY);
}

export async function setLastCheck(ts: string): Promise<void> {
  await redis.set(LAST_CHECK_KEY, ts);
}
