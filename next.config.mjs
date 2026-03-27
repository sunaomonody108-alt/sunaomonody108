/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "kuromoji", "better-sqlite3", "@prisma/adapter-better-sqlite3"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [
        ...externals,
        "better-sqlite3",
        "@prisma/adapter-better-sqlite3",
      ];
    }
    return config;
  },
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
