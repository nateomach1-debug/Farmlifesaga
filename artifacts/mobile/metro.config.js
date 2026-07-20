const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// In a pnpm monorepo, Expo CLI may auto-detect the workspace root and use it
// as projectRoot. We explicitly pin projectRoot to this artifact directory so
// that native bundle URL paths resolve correctly.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro picks up changes in shared packages.
config.watchFolders = [workspaceRoot];

// Look for node_modules in both the artifact directory and the workspace root
// (pnpm hoists packages to the workspace root via .pnpm symlinks).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
