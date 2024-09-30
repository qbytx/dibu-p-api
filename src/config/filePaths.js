'use strict';
const { join, resolve } = require('node:path');

// Constants
const API_VERSION = 'v1';
const ERROR_DUPLICATE = 'duplicate path entry in object.';
const _joinScriptPath = join(__dirname, __filename);
const _joinPublicPath = join(__dirname, '..', 'public');
const _joinSourcePath = join(__dirname, '..');
const scriptPath = resolve(_joinScriptPath);
const publicPath = resolve(_joinPublicPath);
const sourcePath = resolve(_joinSourcePath);

// Error handling
const onError = (err, source) => {
  console.error(`Error: [${err}] in ${source} in ${scriptPath}`);
  throw new Error(`${err} :: ${source} in ${scriptPath}`);
};

// Frozen objects for files and directories
const FILES = Object.freeze({
  HTML_INDEX: 'index.html',
  HTML_404: '404.html'
});

const DIRECTORIES = Object.freeze({
  publicDirCss: 'css',
  publicDirImg: 'img',
  srcDirPlugins: 'plugins',
  srcDirRoutes: 'routes',
  srcDirData: 'data',
  srcDirJson: 'json',
  srcDirModels: 'models',
  srcDirTemplates: 'templates',
  srcDirApi: API_VERSION
});

// Path mappings
const publicFiles = new Map([
  [FILES.HTML_INDEX, FILES.HTML_INDEX],
  [FILES.HTML_404, FILES.HTML_404]
]);

const publicDirectories = new Map([
  [DIRECTORIES.publicDirCss, `./${DIRECTORIES.publicDirCss}`],
  [DIRECTORIES.publicDirImg, `./${DIRECTORIES.publicDirImg}`]
]);

const sourceDirectories = new Map([
  [DIRECTORIES.srcDirPlugins, `./${DIRECTORIES.srcDirPlugins}`],
  [DIRECTORIES.srcDirRoutes, `./${DIRECTORIES.srcDirRoutes}`],
  [DIRECTORIES.srcDirData, `./${DIRECTORIES.srcDirData}`],
  [DIRECTORIES.srcDirJson, `./${DIRECTORIES.srcDirData}/${DIRECTORIES.srcDirJson}`],
  [DIRECTORIES.srcDirModels, `./${DIRECTORIES.srcDirData}/${DIRECTORIES.srcDirModels}`],
  [DIRECTORIES.srcDirTemplates, `./${DIRECTORIES.srcDirData}/${DIRECTORIES.srcDirTemplates}`],
  [DIRECTORIES.srcDirApi, `./${DIRECTORIES.srcDirRoutes}/${API_VERSION}`]
]);

// Initialize paths object
const filePaths = {
  public: { path: publicPath, pathPrefix: '/', directories: {}, files: {} },
  src: { path: sourcePath, pathPrefix: './src/', directories: {}, files: {} }
};

/**
 * Resolves and adds paths to the target object.
 *
 * @param {Object} options - The options for resolving and adding paths.
 * @param {string} options.basePath - The base path to resolve against.
 * @param {Map<string, string>} options.pathMap - A map of key-value pairs representing paths to resolve.
 * @param {Object} options.targetObject - The object to which resolved paths will be added.
 * @param {string} options.pathType - A string describing the type of paths being resolved (e.g., 'file', 'directory').
 * @throws {Error} Throws an error if a duplicate path is encountered.
 */
function resolveAndAddPath ({ basePath, pathMap, targetObject, pathType }) {
  for (const [key, relativePath] of pathMap) {
    const fullPath = join(basePath, relativePath);
    const resolvedPath = resolve(fullPath);

    if (key in targetObject) {
      const errorMessage = `Duplicate ${pathType} path: ${key}`;
      onError(ERROR_DUPLICATE, errorMessage);
    }

    console.log(`Loaded [${pathType.toUpperCase()}] path: ${resolvedPath}`);
    targetObject[key] = resolvedPath;
  }
}

function createOptions (basePath, pathMap, targetObject, pathType) {
  return {
    basePath,
    pathMap,
    targetObject,
    pathType
  };
}

// Resolve and add public files
resolveAndAddPath(createOptions(publicPath, publicFiles, filePaths.public.files, 'public-file'));

// Resolve and add public directories
resolveAndAddPath(createOptions(publicPath, publicDirectories, filePaths.public.directories, 'public-directory'));

// Resolve and add source directories
resolveAndAddPath(createOptions(sourcePath, sourceDirectories, filePaths.src.directories, 'source-directory'));

module.exports = {
  filePaths,
  FILES,
  DIRECTORIES
};
