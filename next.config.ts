import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.GITHUB_ACTIONS === "true" ? "/sidequest-commons" : "",
  images: { unoptimized: true },
};

export default nextConfig;
