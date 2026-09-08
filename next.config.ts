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
  // Exposed to client code that needs to build an absolute asset URL itself
  // (e.g. fetching the ffmpeg WASM core), rather than going through
  // next/image or next/link which apply basePath automatically.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
