import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zenzo/ui", "@zenzo/database", "@zenzo/utils"],
};

export default nextConfig;
