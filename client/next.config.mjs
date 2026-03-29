/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/api/**",
      },
      {
        protocol: "http",   // 你的圖片來源是 http，不是 https
        hostname: "localhost",
        port: "3005",       // 記得加上 port
        pathname: "/uploads/**",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  // 🔥 加這段 rewrites
  async rewrites() {
    return [
      {
        source: "/api/:path*",          // 前端呼叫 /api/xxx
        destination: "http://localhost:3005/api/:path*", // 代理到後端
      },
    ];
  },
};


export default nextConfig;
