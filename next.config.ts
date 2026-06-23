import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["tesseract.js", "@prisma/client", "bcryptjs"],
};

export default nextConfig;
