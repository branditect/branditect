/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    // pdfjs-dist uses canvas as optional dep — not needed in SSR
    if (isServer) {
      config.externals.push('canvas')
    }
    return config
  },
};

export default nextConfig;
