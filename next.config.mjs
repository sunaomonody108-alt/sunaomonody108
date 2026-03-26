/** @type {import('next').NextConfig} */
const nextConfig = {
  // Needed for pdf-parse and kuromoji to work in API routes
  experimental: { serverComponentsExternalPackages: ["pdf-parse", "kuromoji"] },
  // Allow serving audio files
  async headers() {
    return [
      {
        source: "/audio/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
