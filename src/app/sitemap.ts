import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rodcor.github.io/sidequest-commons";
  return ["", "/agents", "/rules", "/security"].map((path) => ({
    url: `${site}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/agents" || !path ? "daily" : "monthly",
    priority: path === "/agents" ? 0.9 : path ? 0.7 : 1,
  }));
}
