const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignore Android and iOS build output directories in Metro file watcher
config.resolver.blockList = [
  /android\/app\/build\/.*/,
  /android\/.gradle\/.*/,
  /ios\/build\/.*/,
];

module.exports = config;
