import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allows production builds to successfully complete even if the project has ESLint warnings/errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
