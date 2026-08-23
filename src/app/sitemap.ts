import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rodcor.github.io/sidequest-commons";
  return ["", "/rules", "/security"].map((path) => ({
    url: `${site}${path}`,
    lastModified: new Date(),
    changeFrequency: path ? "monthly" : "daily",
    priority: path ? 0.7 : 1,
  }));
}
