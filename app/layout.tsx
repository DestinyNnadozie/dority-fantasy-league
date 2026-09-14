import "./globals.css";
import { NavClient } from "@/components/ui/NavClient";
import { DeadlineBanner } from "@/components/ui/DeadlineBanner";
import { SquadNudge } from "@/components/SquadNudge";

export const metadata = {
  title: "Dority Fantasy League",
  description: "School fantasy league",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NavClient />
        <SquadNudge />
        <DeadlineBanner />
        <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">{children}</main>
      </body>
    </html>
  );
}