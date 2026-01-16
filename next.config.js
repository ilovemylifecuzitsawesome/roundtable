/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Exclude @xenova/transformers and its native dependencies from webpack bundling
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark packages with native bindings as external
      config.externals = config.externals || [];
      config.externals.push({
        "@xenova/transformers": "commonjs @xenova/transformers",
        "onnxruntime-node": "commonjs onnxruntime-node",
      });
    }
    return config;
  },
};

module.exports = nextConfig;
