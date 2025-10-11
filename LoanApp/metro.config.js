const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('bin');

// Enable hermesEnabled for better performance
config.transformer.hermesCommand = undefined;

module.exports = config;