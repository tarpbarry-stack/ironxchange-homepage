/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: "/BrowseV2",
        destination: "/browse-v2",
        permanent: true
      },
      {
        source: "/postfree",
        destination: "/post-free",
        permanent: true
      },
      {
        source: "/my-listings-v2",
        destination: "/account/my-listings-v2",
        permanent: true
      }
    ];
  },

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
