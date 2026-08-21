/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Every /dashboard/* URL below is live today. Bookmarks and any links
  // already sent to users break without these, so they are permanent.
  async redirects() {
    return [
      { source: '/dashboard', destination: '/home', permanent: true },

      // Brand
      { source: '/dashboard/brand-strategy', destination: '/brand/strategy', permanent: true },
      { source: '/dashboard/brand-strategy/social', destination: '/brand/channels', permanent: true },
      { source: '/dashboard/brand-library/tone-of-voice', destination: '/brand/tone-of-voice', permanent: true },
      { source: '/dashboard/brand-library', destination: '/brand/visual-identity', permanent: true },
      { source: '/dashboard/catalog', destination: '/brand/products', permanent: true },

      // Knowledge
      { source: '/dashboard/brand-library/knowledge-vault', destination: '/knowledge/documents', permanent: true },
      { source: '/dashboard/assets', destination: '/knowledge/images', permanent: true },
      { source: '/dashboard/brand-library/templates', destination: '/knowledge/links', permanent: true },

      // Studio
      { source: '/dashboard/copy-architect', destination: '/studio/write', permanent: true },
      { source: '/dashboard/create', destination: '/studio/write', permanent: true },
      { source: '/dashboard/draft-pad', destination: '/studio/write', permanent: true },
      { source: '/dashboard/brand-library/image-architect', destination: '/studio/create-images', permanent: true },
      { source: '/dashboard/brand-assets', destination: '/studio/brand-assets', permanent: true },
      // Code Architect keeps working behind Studio's "More" card rather than
      // being folded into Brand assets, which would have lost the feature.
      { source: '/dashboard/brand-code-architect', destination: '/studio/code', permanent: true },
      { source: '/dashboard/brand-book', destination: '/studio/brand-book', permanent: true },
      { source: '/dashboard/brand-guideline', destination: '/studio/brand-guideline', permanent: true },
      { source: '/dashboard/brand-bases', destination: '/studio/brand-bases', permanent: true },

      // Cut surfaces
      { source: '/dashboard/mission-board', destination: '/home', permanent: true },

      // Numbers
      { source: '/dashboard/tools', destination: '/numbers/profitability', permanent: true },
      { source: '/dashboard/tools/:path*', destination: '/numbers/profitability/:path*', permanent: true },

      // Section roots land on their first child.
      { source: '/brand', destination: '/brand/strategy', permanent: false },
      { source: '/knowledge', destination: '/knowledge/documents', permanent: false },
      { source: '/studio', destination: '/studio/write', permanent: false },
      { source: '/numbers', destination: '/numbers/profitability', permanent: false },
    ]
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
