import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Image optimisation
   * R2 public bucket URL and any CDN domains go here.
   * Add the actual R2 public URL once the bucket is created.
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.tcoefs-unijos.org",
        pathname: "/**",
      },
    ],
  },

  /**
   * Server-side packages that must not be bundled by webpack/Turbopack.
   * AWS SDK and Supabase service-role client are server-only — keeping them
   * external avoids edge runtime incompatibilities and reduces cold-start time.
   */
  serverExternalPackages: [
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
  ],

  /**
   * Strict mode catches subtle React bugs during development.
   * Leave on — it double-invokes effects and renders, which surfaces
   * side-effect problems early. This does not affect production builds.
   */
  reactStrictMode: true,

  /**
   * Compiler options
   * Remove console.log statements in production builds.
   * Keep console.warn and console.error so runtime errors still surface.
   */
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["warn", "error"] }
        : false,
  },
};

export default nextConfig;
