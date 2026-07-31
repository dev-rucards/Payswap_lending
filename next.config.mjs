/** @type {import('next').NextConfig} */

/**
 * Single source of truth for the deploy sub-path.
 *
 * Empty = served from the domain root (local dev, and any normal host).
 * Set NEXT_PUBLIC_BASE_PATH="/your-repo" to deploy under a GitHub Pages
 * project path. `src/utils/utils.ts` reads the same variable, so routing and
 * asset URLs can never drift apart again.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig = {
  basePath,
  assetPrefix: basePath ? `${basePath}/` : "",
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
