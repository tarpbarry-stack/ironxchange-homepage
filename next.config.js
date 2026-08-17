/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/financial/:path*",
        destination: "/api/ixi/financial/:path*"
      }
    ];
  },

  webpack(config, { isServer }) {
    /*
     * ExcelJS publishes a browser bundle specifically for client use.
     *
     * AOS Bulk Import parses .xlsx files in the browser so the raw
     * customer workbook does not need to be uploaded merely to inspect
     * and map columns. Force browser builds onto that bundle and keep
     * ExcelJS's Node/fs entrypoint out of the client dependency graph.
     */
    if (!isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "exceljs$": require.resolve(
          "exceljs/dist/exceljs.min.js"
        )
      };
    }

    return config;
  }
};

module.exports = nextConfig;
