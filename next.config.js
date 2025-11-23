/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ]
  },
  output: 'standalone',
  
  // Extended timeout for large file uploads (10 minutes)
  // Note: This requires Vercel Pro plan for timeouts > 10s in production
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Allow large file uploads
      allowedOrigins: ['*']
    },
  },
  
  // Webpack configuration for WASM support
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    // Add WASM module rules
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Ignore Walrus WASM and related modules on server side to prevent SSR issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        '@mysten/walrus',
        '@mysten/walrus-wasm',
        /walrus_wasm/,
        {
          '@mysten/walrus': 'commonjs @mysten/walrus',
          '@mysten/walrus-wasm': 'commonjs @mysten/walrus-wasm',
        }
      );
      
      // Add fallback for Walrus modules in server build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@mysten/walrus': false,
        '@mysten/walrus-wasm': false,
      };
    }

    // Set up proper file loading for WASM
    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';

    return config;
  },
  
  // Headers for WASM support (CORS and MIME type)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig