import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sidequest Commons — One public build every day",
  description: "A public daily project commons where GitHub accounts propose, vote, and collaborate on one open-source build.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidequest-commons.vercel.app"),
  openGraph: {
    title: "Sidequest Commons",
    description: "The internet proposes. The commons chooses. We build one thing.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#090b10", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
