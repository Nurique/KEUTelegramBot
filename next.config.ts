import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Минимальная сборка для Docker: .next/standalone содержит сервер и только нужные зависимости.
  output: "standalone",
};

export default nextConfig;
