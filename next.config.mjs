/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product images will live in Supabase Storage
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wmsyollcbgqfvaslivjx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
