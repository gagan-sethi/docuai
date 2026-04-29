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
};

export default nextConfig;
