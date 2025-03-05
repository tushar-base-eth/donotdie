// Attempt to import user-specific configuration
let userConfig;
try {
  const mod = await import('./v0-user-next.config');
  userConfig = mod.default; // Extract the default export, assuming v0-user-next.config uses `export default`
} catch (e) {
  // Ignore if user config is not found or fails to load
}

/** @type {import('next').NextConfig} */
// Base configuration shared across both development and production environments
const baseConfig = {
  experimental: {
    // Experimental features aimed at improving build performance
    webpackBuildWorker: true,        // Enables a worker for Webpack builds to parallelize tasks and speed up the process
    parallelServerBuildTraces: true, // Parallelizes server build traces, potentially aiding in debugging and optimization
    parallelServerCompiles: true,    // Parallelizes server-side compilations for faster build times
  },
};

// Development-specific configuration
const devConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignores ESLint errors during builds to speed up development iteration
  },
  typescript: {
    ignoreBuildErrors: true, // Ignores TypeScript errors during builds, useful for rapid development
  },
  images: {
    unoptimized: true, // Disables image optimization to reduce build time in development
  },
  // Note: reactStrictMode is true by default in Next.js, which is beneficial in development for catching potential issues
};

// Production-specific configuration as per Group 10 requirements
const prodConfig = {
  reactStrictMode: true,           // Enables React Strict Mode for additional runtime checks (default: true)
  swcMinify: true,                 // Uses SWC for minification to reduce bundle size and improve performance (default: true)
  productionBrowserSourceMaps: false, // Disables source maps in production builds for security and smaller artifacts (default: false)
  optimizeFonts: true,             // Optimizes font loading to improve page load performance (default: true)
  eslint: {
    ignoreDuringBuilds: false,     // Enforces ESLint checks during builds to ensure code quality
  },
  typescript: {
    ignoreBuildErrors: false,      // Enforces TypeScript type checking during builds for reliability
  },
  images: {
    unoptimized: false,            // Enables image optimization for better performance in production
  },
};

// Select environment-specific config based on NODE_ENV
const envConfig = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;

// Merge base and environment-specific configurations into nextConfig
const nextConfig = { ...baseConfig, ...envConfig };

// Merge with user-specific configuration if it exists, allowing user overrides
if (userConfig) {
  mergeConfig(nextConfig, userConfig);
}

// Function to merge configurations, handling nested objects appropriately
function mergeConfig(target, source) {
  if (!source) {
    return; // Skip if source (userConfig) is undefined or null
  }
  for (const key in source) {
    if (
      target[key] &&                     // Check if target key exists
      typeof target[key] === 'object' && // Ensure target[key] is an object
      !Array.isArray(target[key]) &&     // Ensure it's not an array
      source[key] &&                     // Check if source key exists
      typeof source[key] === 'object' && // Ensure source[key] is an object
      !Array.isArray(source[key])        // Ensure it's not an array
    ) {
      // Deep merge nested objects
      target[key] = { ...target[key], ...source[key] };
    } else {
      // Directly assign non-object values or if no deep merge is needed
      target[key] = source[key];
    }
  }
}

export default nextConfig;