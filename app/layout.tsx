import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doomsday Tracker — CUE Cinemas",
  description:
    "Get notified the moment Avengers: Doomsday sessions go live at CUE Cinemas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
