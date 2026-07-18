const nextConfig = {
  typedRoutes: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["socket.io-client"],
  },
};

export default nextConfig;
