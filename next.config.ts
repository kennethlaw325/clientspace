import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@base-ui/react"],
  serverExternalPackages: ["@react-pdf/renderer", "react-reconciler"],
};

export default nextConfig;
