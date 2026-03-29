import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  eslint: {
    // Keep lint in CI/local commands, but do not block Next build output.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'tacs-crm-bucket.s3.us-east-1.amazonaws.com',
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  // Solo activar SW en producción (en dev crea ruido innecesario)
  disable: process.env.NODE_ENV === "development",
  // Estrategia NetworkFirst para páginas — intenta servidor, cae a caché
  // Estrategia CacheFirst para assets estáticos (_next/static)
  workboxOptions: {
    // Páginas navegables: NetworkFirst (30s timeout)
    runtimeCaching: [
      {
        urlPattern: /^\/(?!api\/).*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1 día
          },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
          },
        },
      },
      {
        urlPattern: /\/_next\/image\?.*/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
          },
        },
      },
    ],
  },
})(nextConfig);
