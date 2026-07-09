import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger file uploads for document processing
  serverExternalPackages: ["@aws-sdk/client-textract", "@aws-sdk/client-s3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "production.promaticstechnologies.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "0.gravatar.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
