/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/financial/:path*",
        destination: "/api/ixi-financial/financial/:path*"
      }
    ];
  }
};

module.exports = nextConfig;
