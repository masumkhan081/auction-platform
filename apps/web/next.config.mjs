/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Consume the shared workspace package as TS source so changes propagate
  // without a separate watch step. Next compiles + tree-shakes it via SWC.
  transpilePackages: ['@auction/shared'],

  // Cloudinary-served product images. Domain-locked image optimization keeps
  // arbitrary URLs from being proxied through `next/image`.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  typedRoutes: true,
};

export default nextConfig;
