import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidequest-commons.vercel.app";
  return ["", "/rules", "/security"].map((path) => ({
    url: `${site}${path}`,
    lastModified: new Date(),
    changeFrequency: path ? "monthly" : "daily",
    priority: path ? 0.7 : 1,
  }));
}
