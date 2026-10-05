const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      // Noble 1.x redirects ./crypto to ./crypto.js through its browser field,
      // but does not export ./crypto.js. Use its existing browser resolution
      // for this subpath, preserving React Native's global crypto polyfill.
      if (
        moduleName === '@noble/hashes/crypto' ||
        moduleName === '@noble/hashes/crypto.js'
      ) {
        return context.resolveRequest(
          { ...context, unstable_enablePackageExports: false },
          moduleName,
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
