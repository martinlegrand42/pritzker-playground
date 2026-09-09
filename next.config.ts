import type { NextConfig } from "next";

// GitHub Pages serves this repo under /pritzker-playground/, so the static
// export needs its base path set to match — but only for that build, not
// local dev (which should stay at the root).
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/pritzker-playground" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
};

export default nextConfig;
